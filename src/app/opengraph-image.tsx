import { ImageResponse } from "next/og";

export const alt = "Rune — polyglot scripting for Paper Minecraft servers";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "72px 80px",
        background: "#f7f3ec",
        fontFamily: "ui-monospace, Menlo, Consolas, monospace",
        color: "#1e1814",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: "16px",
          fontSize: "22px",
          color: "#7a6a5c",
        }}
      >
        <span style={{ color: "#c97a3b" }}>●</span>
        <span>runemc.dev</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: "28px",
          }}
        >
          <span
            style={{
              fontSize: "120px",
              fontWeight: 500,
              letterSpacing: "-0.04em",
              color: "#100c08",
            }}
          >
            Rune
          </span>
          <span style={{ fontSize: "32px", color: "#c97a3b" }}>.</span>
        </div>
        <p
          style={{
            fontSize: "36px",
            lineHeight: 1.3,
            maxWidth: "920px",
            color: "#3a3128",
            margin: 0,
          }}
        >
          Polyglot scripting for Paper Minecraft servers, embedded inside the
          JVM.
        </p>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: "22px",
          color: "#7a6a5c",
        }}
      >
        <span>typescript · wasm · python · lua · rust</span>
        <span>runemc.dev/install</span>
      </div>
    </div>,
    { ...size },
  );
}
