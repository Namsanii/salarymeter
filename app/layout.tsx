import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "급여 미터기",
  description: "연봉을 입력하면 초당/분당/시간당 수입을 실시간으로 보여주는 미터기",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Noto+Sans+KR:wght@400;500;600;700;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
