export function GlobalBackground() {
  return (
    <>
      <div
        className="fixed inset-0 -z-10 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at top, #1a0a2e 0%, #080d1a 60%)",
        }}
        aria-hidden
      />
      <div className="noise" aria-hidden />
    </>
  )
}
