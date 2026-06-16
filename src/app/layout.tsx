import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "流光岁月",
  description: "按照片年份归档的私人年度相册"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
