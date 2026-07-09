import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "급여 미터기",
  description: "연봉을 입력하면 지금까지 얼마를 벌었는지 실시간으로 보여주는 미터기",
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