import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { FlowProvider } from "@/lib/flow";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Flightback: get paid when your flight is 3+ hours late",
  description:
    "Your US domestic flight arrived 3 or more hours late? You may be owed $250 per passenger. We check your flight and file the claim. Demo only.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#F2F3F5", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${inter.variable} antialiased`}>
      <body className="min-h-dvh bg-bg text-ink">
        <div className="bg-ink px-4 py-2 text-center text-xs font-medium text-white">
          Demo. No real claims are filed and no card is charged.
        </div>
        <FlowProvider>{children}</FlowProvider>
      </body>
    </html>
  );
}
