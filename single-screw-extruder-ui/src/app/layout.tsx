import type { Metadata } from "next";
import { IBM_Plex_Mono, Inter } from "next/font/google";
import "./globals.css";
import { PageTransition } from "@/components/page-transition";
import { MachineDataProvider } from "@/components/machine-data-provider";
import { createInitialSnapshot } from "@/lib/machine-data";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const mono = IBM_Plex_Mono({
  variable: "--font-ibm-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Extruder Monitor | Industrial Monitoring UI",
  description:
    "A production-grade frontend dashboard and interactive machine canvas for a single screw extruder, powered by simulated frontend data.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const initialSnapshot = createInitialSnapshot();

  return (
    <html lang="en" className={`${inter.variable} ${mono.variable} h-full antialiased`}>
      <body className="min-h-full bg-background text-foreground">
        <MachineDataProvider initialSnapshot={initialSnapshot}>
          <PageTransition>{children}</PageTransition>
        </MachineDataProvider>
      </body>
    </html>
  );
}
