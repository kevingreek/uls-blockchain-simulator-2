// app/layout.tsx
import "../styles/globals.css";

export const metadata = {
  title: "Λ-Link Enhanced By Astropledge Simulator",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <footer>
          Copyright 2025 (c) by Bitrezus I.K.E. All rights reserved.
        </footer>
      </body>
    </html>
  );
}
