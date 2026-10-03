"use client";

// Replaces the whole page if the root layout itself crashes, so it brings its own <html>, <body> and styles.
export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
          background: "#ffffff",
          color: "#111111",
          textAlign: "center",
          padding: "1rem",
        }}
      >
        <div style={{ maxWidth: 420 }}>
          <h1 style={{ fontSize: "1.75rem", marginBottom: 8 }}>Something went wrong</h1>
          <p style={{ color: "#666666", fontSize: 14, marginBottom: 20 }}>
            Elite Laptops is having a problem. Please try again in a moment.
          </p>
          <button
            type="button"
            onClick={() => retry()}
            style={{
              minHeight: 48,
              padding: "0 32px",
              background: "#111111",
              color: "#ffffff",
              border: 0,
              borderRadius: 999,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
          {error.digest && <p style={{ color: "#999999", fontSize: 12, marginTop: 16 }}>Reference: {error.digest}</p>}
        </div>
      </body>
    </html>
  );
}
