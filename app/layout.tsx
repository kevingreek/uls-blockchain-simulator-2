import './globals.css';

export const metadata = {
  title: 'ULS Blockchain Simulator',
  description: 'Demo visual simulation by Kostas Sotiropoulos',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
