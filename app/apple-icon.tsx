import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "#06251F",
          borderRadius: 40,
          color: "white",
          display: "flex",
          height: "100%",
          justifyContent: "center",
          width: "100%",
        }}
      >
        <svg width="136" height="136" viewBox="0 0 64 64" fill="none">
          <rect
            width="64"
            height="64"
            rx="15"
            fill="#063C34"
            fillOpacity="0.72"
          />
          <path
            d="M43.5 12.5C35.8 10.4 27.6 11.7 21.8 16.2C15.8 20.9 13.1 28.4 14.8 35.2C16.7 44.8 25.6 51.2 35.6 49.5C39.2 48.9 42.2 47.4 44.4 45.5"
            stroke="#F8FFFB"
            strokeWidth="5.4"
            strokeLinecap="round"
          />
          <path
            d="M32.8 18.8H39C45.1 18.8 49.2 22.7 49.2 28.1C49.2 33.6 45.1 37.4 39 37.4H31.6"
            stroke="#F8FFFB"
            strokeWidth="5.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M17.5 38.8H25.4L28.8 31.6L35.2 45.5L38.8 38.8H48.4"
            stroke="#7AF2C5"
            strokeWidth="4.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M44 14.6V24.6M39 19.6H49"
            stroke="#CFFBE7"
            strokeWidth="3.8"
            strokeLinecap="round"
          />
        </svg>
      </div>
    ),
    size,
  );
}
