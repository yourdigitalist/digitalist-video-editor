import type { Metadata } from "next";
import { Inter, Syne } from "next/font/google";
import { AppShell } from "@/components/layout/app-shell";
import { StoreHydration } from "@/components/providers/store-hydration";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  weight: ["600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Digitalist Video Editor",
  description:
    "Multi-brand motion graphics dashboard — configure, pick animations, generate video with Cursor.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${syne.variable} antialiased`}
        style={
          {
            "--font-body": "var(--font-inter), system-ui, sans-serif",
            "--font-display": "var(--font-syne), system-ui, sans-serif",
          } as React.CSSProperties
        }
      >
        <StoreHydration>
          <AppShell>{children}</AppShell>
        </StoreHydration>
      </body>
    </html>
  );
}
