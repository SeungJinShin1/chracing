import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CH Racing — RC Car Racing System",
  description:
    "실시간 RC카 레이싱 타이머 및 리더보드 시스템. NFC 태그로 학생 식별, 초음파 센서로 랩타임 측정.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
