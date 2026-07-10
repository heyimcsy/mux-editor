import type { Metadata } from "next";
import { StoreProvider } from "@/lib/store";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mux Editor — 터미널 테마를, 보면서 만드세요",
  description:
    "cmux(macOS)와 wmux(Windows)의 색상 테마를 눈으로 보면서 만들고, 붙여넣을 수 있는 설정 파일과 명령어로 내보냅니다.",
};

// Fonts are pulled in from globals.css rather than <link> tags here, because a
// manual <head> in the root layout is not supported.
//
// suppressHydrationWarning is on <html> because browser extensions stamp
// attributes onto it (data-hwp-extension, cz-shortcut-listen, …) before React
// loads, and the server HTML can never contain those. It only silences
// mismatches on this one element's own attributes — anything wrong deeper in
// the tree still reports normally, so it is not hiding our own bugs.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body>
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
