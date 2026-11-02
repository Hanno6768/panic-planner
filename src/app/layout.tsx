import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import "@fontsource-variable/geist";
import "./globals.css";

export const metadata: Metadata = {
  title: "Panic Planner — A little less last-minute",
  description:
    "Your university batch’s calm corner of organized chaos. Track personal, group and batch deadlines.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
