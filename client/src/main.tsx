import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { agentDebugLog } from "./lib/agentDebugLog";

// #region agent log
if (typeof window !== "undefined") {
  window.addEventListener("error", (event) => {
    const msg = String(event.message || "");
    if (
      msg.includes("removeChild") ||
      msg.includes("insertBefore") ||
      msg.includes("not a child")
    ) {
      agentDebugLog(
        "main.tsx:window.error",
        "DOM reconcile error",
        {
          message: msg,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          stack: event.error instanceof Error ? event.error.stack : undefined,
          path: window.location.pathname,
        },
        "H1-framer-animatepresence",
      );
    }
  });
  window.addEventListener("unhandledrejection", (event) => {
    const r = event.reason;
    const msg = r instanceof Error ? r.message : String(r);
    if (msg.includes("removeChild") || msg.includes("insertBefore")) {
      agentDebugLog(
        "main.tsx:unhandledrejection",
        "async DOM error",
        {
          message: msg,
          stack: r instanceof Error ? r.stack : undefined,
          path: window.location.pathname,
        },
        "H5-async-pdf-or-promise",
      );
    }
  });
}
// #endregion

createRoot(document.getElementById("root")!).render(<App />);
