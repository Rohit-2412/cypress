export const dynamic = "force-dynamic";

import "./globals.css";

import AppStateProvider from "@/lib/providers/state-provider";
import { DM_Sans } from "next/font/google";
import type { Metadata } from "next";
import { ThemeProvider } from "@/lib/providers/next-theme-provider";
import { twMerge } from "tailwind-merge";

const inter = DM_Sans({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Cypres Clone | Home",
    description: "Cypres Clone",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className={twMerge("bg-background", inter.className)}>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="dark"
                    enableSystem
                    forcedTheme="dark"
                >
                    <AppStateProvider>{children}</AppStateProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
