import { spawn } from "child_process";
import fs from "fs";
import path from "path";

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const SCREENSHOT_DIR = path.join(process.cwd(), "public", "images", "screenshots");

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const pages = [
  { url: "http://localhost:3000/dashboard", filename: "dashboard.png" },
  { url: "http://localhost:3000/prompts", filename: "prompt-library.png" },
  { url: "http://localhost:3000/workflows", filename: "workflows.png" },
  { url: "http://localhost:3000/settings", filename: "settings.png" },
];

async function capture() {
  for (const page of pages) {
    const outFile = path.join(SCREENSHOT_DIR, page.filename);
    console.log(`Capturing ${page.url} -> ${outFile}`);
    const proc = spawn(EDGE_PATH, [
      "--headless=new",
      "--disable-gpu",
      "--window-size=1280,800",
      `--screenshot=${outFile}`,
      page.url
    ]);
    
    await new Promise((resolve) => proc.on("exit", resolve));
  }
  console.log("Done!");
}

capture();
