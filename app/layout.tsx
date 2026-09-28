import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import { FlowProvider } from "@/lib/flow";
import { Progress } from "@/components/Progress";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Flightback",
  description: "Check if your delayed US flight may be owed compensation. Demo only.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#F5F3EE", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} antialiased`}>
      <body className="min-h-dvh bg-bg text-ink">
        <div className="bg-ink px-4 py-2 text-center text-xs font-medium text-white">
          Demo. No real claims are filed and no card is charged.
        </div>
        <FlowProvider>
          <div className="mx-auto w-full max-w-[480px] px-4 pb-16 pt-5">
            <header className="mb-6">
              <Link href="/" className="text-lg font-bold tracking-tight">
                Flightback
              </Link>
            </header>
            <Progress />
            <main>{children}</main>
          </div>
        </FlowProvider>
      </body>
    </html>
  );
}
