import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #F5EFE6 0%, #FDFAF5 55%, #FEF3EC 100%)",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -120,
            right: -120,
            width: 420,
            height: 420,
            borderRadius: 420,
            background: "#FCDEC6",
            opacity: 0.6,
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -140,
            left: -100,
            width: 380,
            height: 380,
            borderRadius: 380,
            background: "#D6EDD1",
            opacity: 0.5,
          }}
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 96,
            height: 96,
            borderRadius: 28,
            background: "linear-gradient(135deg, #F4A261 0%, #EC8035 100%)",
            color: "white",
            fontSize: 52,
            fontWeight: 800,
            marginBottom: 28,
          }}
        >
          К
        </div>
        <div style={{ display: "flex", fontSize: 72, fontWeight: 800, color: "#3D2C1E" }}>
          КАПИБАРА
        </div>
        <div style={{ display: "flex", fontSize: 32, color: "#6B5240", marginTop: 16 }}>
          Книга, где герой — ваш ребёнок
        </div>
      </div>
    ),
    { ...size }
  );
}
