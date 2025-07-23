export const metadata = {
  title: "ULS Blockchain Simulator",
  description: "Simulating tokenized message flows between ULS instances and Blockchain.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}