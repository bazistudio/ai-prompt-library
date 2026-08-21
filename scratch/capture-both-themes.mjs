import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import WebSocket from "ws";

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const PORT = 9224;

async function capture() {
  console.log("Launching Edge in headless mode...");
  const edgeProc = spawn(
    EDGE_PATH,
    [
      `--remote-debugging-port=${PORT}`,
      "--headless=new",
      "--disable-gpu",
      "--window-size=1280,800",
      "http://localhost:3000/",
    ],
    { stdio: "ignore" }
  );

  await new Promise((resolve) => setTimeout(resolve, 2500));

  let targets = [];
  for (let i = 0; i < 10; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json`);
      targets = await res.json();
      if (targets && targets.length > 0) break;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  const pageTarget = targets.find((t) => t.type === "page");
  if (!pageTarget) {
    console.error("No page target found");
    edgeProc.kill();
    process.exit(1);
  }

  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  let idCounter = 1;
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = idCounter++;
      const handler = (data) => {
        const msg = JSON.parse(data.toString());
        if (msg.id === id) {
          ws.off("message", handler);
          if (msg.error) reject(msg.error);
          else resolve(msg.result);
        }
      };
      ws.on("message", handler);
      ws.send(JSON.stringify({ id, method, params }));
    });

  await new Promise((resolve) => ws.on("open", resolve));

  // 1. Capture Dark Mode
  console.log("Capturing Dark Mode...");
  await send("Page.navigate", { url: "http://localhost:3000/" });
  await new Promise((resolve) => setTimeout(resolve, 2000));
  const darkShot = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(
    path.join(process.cwd(), "public", "images", "screenshots", "hero-dark.png"),
    Buffer.from(darkShot.data, "base64")
  );

  // 2. Set Light Mode in localStorage & document class
  console.log("Setting Light Mode...");
  await send("Runtime.evaluate", {
    expression: `
      localStorage.setItem("pref-theme", "light");
      document.documentElement.classList.add("light");
    `,
  });
  await new Promise((resolve) => setTimeout(resolve, 1000));
  const lightShot = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(
    path.join(process.cwd(), "public", "images", "screenshots", "hero-light.png"),
    Buffer.from(lightShot.data, "base64")
  );

  ws.close();
  edgeProc.kill();
  console.log("Dark and Light mode screenshots saved!");
}

capture().catch((err) => {
  console.error("Error capturing:", err);
  process.exit(1);
});
