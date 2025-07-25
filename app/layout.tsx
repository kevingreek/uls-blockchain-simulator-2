
import "../styles/globals.css";
import Head from "next/head";
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <Head>
        <title>Λ-Link Enhanced By Astropledge Simulator</title>
      </Head>
      <body>
        {children}
        <footer>
          Copyright 2025 (c) by Bitrezus I.K.E. All rights reserved.
        </footer>
      </body>
    </html>
  );
}
