/** Debug session d19efc — remove after investigation */
export function agentDebugLog(
  location: string,
  message: string,
  data: Record<string, unknown>,
  hypothesisId: string,
  runId = "pre-fix",
) {
  // #region agent log
  fetch("http://127.0.0.1:7683/ingest/ffd752af-435e-4d5b-b0b7-c0dc1821dba2", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "d19efc",
    },
    body: JSON.stringify({
      sessionId: "d19efc",
      location,
      message,
      data,
      timestamp: Date.now(),
      hypothesisId,
      runId,
    }),
  }).catch(() => {})
  // #endregion
}
