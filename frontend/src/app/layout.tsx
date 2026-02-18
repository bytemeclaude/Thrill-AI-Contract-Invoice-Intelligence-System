import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Contract Intelligence — AI-Powered Document Audit",
  description: "Enterprise AI agent that parses, audits, and reviews financial documents. Automates invoice-contract matching and legal risk assessment.",
  keywords: ["AI", "Contract", "Invoice", "Audit", "GST", "Chartered Accountant"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body>
        {children}
      </body>
    </html>
  );
}
