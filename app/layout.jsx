// app/layout.tsx
import "../styles/globals.css";

export const metadata = { title: "Secured Λ-Link Simulator" };

export default function RootLayout({ children }) {
  return <html lang="en"><body>{children}</body></html>;
}
