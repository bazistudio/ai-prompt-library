export default function TestRuntimePage() {
  return (
    <div style={{ padding: "40px", fontFamily: "system-ui", background: "#090d16", color: "#f8fafc", minHeight: "100vh" }}>
      <h1 style={{ color: "#6366f1", fontSize: "28px", marginBottom: "16px" }}>Electron Runtime Test</h1>
      <p style={{ color: "#94a3b8", fontSize: "16px", marginBottom: "24px" }}>
        Testing isolated Electron + Next.js shell boundary without SQLite.
      </p>
      <div style={{ background: "#1e293b", padding: "20px", borderRadius: "8px", maxWidth: "500px" }}>
        <ul style={{ listStyle: "none", padding: 0, margin: 0, lineHeight: "2" }}>
          <li>🚀 Next.js Production Server: <strong style={{ color: "#4ade80" }}>OK</strong></li>
          <li>🖥️ Electron Renderer: <strong style={{ color: "#4ade80" }}>OK</strong></li>
          <li>💾 SQLite Native Module: <strong style={{ color: "#facc15" }}>NOT TESTED (BYPASSED)</strong></li>
        </ul>
      </div>
    </div>
  );
}
