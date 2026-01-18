
import type { Metadata } from "next";
import {Inter} from "next/font/google";
import "./globals.css";
import { VaultProvider } from "@/context/VaultContext";
import { Toaster } from "@/components/ui/sonner";


const inter = Inter({subsets: ["latin"]});

export const metadata: Metadata = {
  title: "PassKeep",
  description: "Zero Knowledge Password Manager",
};

export default function RootLayout({
  children,
}: Readonly<{children: React.ReactNode}>) {
  return (
    <html lang="en">
      <body className="{inter.className}">
        <VaultProvider>
          {children}
          <Toaster />
        </VaultProvider>
      </body>
    </html>
  )
}






















