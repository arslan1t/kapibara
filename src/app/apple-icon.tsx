import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #F4A261 0%, #EC8035 100%)",
          color: "white",
          fontSize: 108,
          fontWeight: 800,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        К
      </div>
    ),
    { ...size }
  );
}
