"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "ui-monospace, Menlo, Consolas, monospace",
          background: "#0a0907",
          color: "#e5e1da",
          minHeight: "100vh",
          margin: 0,
          padding: "4rem 1.5rem",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          maxWidth: "640px",
          marginInline: "auto",
        }}
      >
        <p style={{ fontSize: "0.75rem", color: "#d97757" }}>fatal error</p>
        <h1 style={{ marginTop: "0.75rem", fontSize: "2rem", fontWeight: 500 }}>
          The site crashed.
        </h1>
        <p style={{ marginTop: "1rem", fontSize: "0.875rem", lineHeight: 1.6 }}>
          The root layout failed to render. Try reloading the page. If it keeps
          happening, the deploy is broken.
        </p>
        {error.digest && (
          <p
            style={{
              marginTop: "1rem",
              fontSize: "0.75rem",
              opacity: 0.7,
            }}
          >
            digest: {error.digest}
          </p>
        )}
        <button
          type="button"
          onClick={reset}
          style={{
            marginTop: "2rem",
            alignSelf: "flex-start",
            background: "transparent",
            border: "1px solid #d97757",
            color: "#d97757",
            padding: "0.5rem 1rem",
            fontFamily: "inherit",
            cursor: "pointer",
            borderRadius: "0.25rem",
          }}
        >
          ↻ reload
        </button>
      </body>
    </html>
  );
}
