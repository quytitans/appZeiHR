/**
 * Bảng màu "brand" trích từ mẫu màu người dùng cung cấp (xanh mint/ngọc lam, base #4FC9A9).
 * Đây là màu chủ đạo (primary) dùng xuyên suốt toàn bộ UI/UX của hệ thống Zei Group HR —
 * không đổi màu tuỳ tiện ở các phân hệ khác, mọi nút CTA/active state/badge trạng thái
 * đều nên tham chiếu từ thang màu này để giữ nhất quán.
 */
const brand = {
  50: "#EFFAF7",
  100: "#DCF4EE",
  200: "#B9E9DD",
  300: "#8EDCC7",
  400: "#67D0B4",
  500: "#4FC9A9", // màu gốc từ ảnh đính kèm
  600: "#36B08F",
  700: "#2C9076",
  800: "#24755F",
  900: "#1D5E4C",
  950: "#123B30",
};

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "media",
  theme: {
    extend: {
      colors: {
        brand,
        primary: brand,
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};
