import { ImageResponse } from "next/og";

import { getMessages } from "@/lib/i18n/messages";

export const alt = "Tember · Care, kept close";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const messages = getMessages();

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "stretch",
          background: "#f7f5ef",
          color: "#062a17",
          display: "flex",
          fontFamily: "Arial, sans-serif",
          height: "100%",
          overflow: "hidden",
          padding: "64px 72px",
          position: "relative",
          width: "100%",
        }}
      >
        <div
          style={{
            background: "#0b3a22",
            borderRadius: "48px",
            bottom: "-300px",
            height: "680px",
            position: "absolute",
            right: "-160px",
            transform: "rotate(-18deg)",
            width: "680px",
          }}
        />
        <div
          style={{
            background: "#d9e8cf",
            borderRadius: "50%",
            height: "380px",
            position: "absolute",
            right: "80px",
            top: "-180px",
            width: "380px",
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            maxWidth: "720px",
          }}
        >
          <div style={{ alignItems: "center", display: "flex", gap: "18px" }}>
            <div
              style={{
                alignItems: "center",
                background: "#0b3a22",
                borderRadius: "22px",
                display: "flex",
                height: "72px",
                justifyContent: "center",
                width: "72px",
              }}
            >
              <div
                style={{
                  border: "3px solid #f7f5ef",
                  borderRadius: "18px 4px 18px 4px",
                  height: "28px",
                  transform: "rotate(-36deg)",
                  width: "28px",
                }}
              />
            </div>
            <span
              style={{
                fontSize: "34px",
                fontWeight: 700,
                letterSpacing: "-1px",
              }}
            >
              {messages.common.appName}
            </span>
          </div>
          <p
            style={{
              fontSize: "20px",
              fontWeight: 700,
              letterSpacing: "4px",
              margin: "96px 0 0",
              textTransform: "uppercase",
            }}
          >
            {messages.common.tagline}
          </p>
          <h1
            style={{
              fontSize: "72px",
              letterSpacing: "-4px",
              lineHeight: 1.04,
              margin: "18px 0 0",
            }}
          >
            {messages.metadata.shareDescription}
          </h1>
        </div>
      </div>
    ),
    size,
  );
}
