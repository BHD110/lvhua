import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "旅画",
  description: "来时是游客，走时是主角",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
