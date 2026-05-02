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
          background: "#0D7A6B",
          borderRadius: 40,
          color: "white",
          display: "flex",
          height: "100%",
          justifyContent: "center",
          width: "100%",
        }}
      >
        <svg width="132" height="132" viewBox="0 0 64 64" fill="none">
          <path
            d="M32 8.5 49 14.8v13.7c0 11.4-6.7 21-17 26.2C21.7 49.5 15 39.9 15 28.5V14.8L32 8.5Z"
            fill="white"
            fillOpacity="0.16"
          />
          <path
            d="M32 8.5 49 14.8v13.7c0 11.4-6.7 21-17 26.2C21.7 49.5 15 39.9 15 28.5V14.8L32 8.5Z"
            stroke="white"
            strokeWidth="4"
            strokeLinejoin="round"
          />
          <path
            d="M32 19v17M23.5 27.5h17"
            stroke="white"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <path
            d="M18.5 41h8l2.6-5.5 5 10 2.8-4.5h8.6"
            stroke="#BDF7D2"
            strokeWidth="3.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    ),
    size,
  );
}
