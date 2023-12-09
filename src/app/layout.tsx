export const dynamic = "force-dynamic";

import "./globals.css";

import AppStateProvider from "@/lib/providers/state-provider";
import { DM_Sans } from "next/font/google";
import type { Metadata } from "next";
import { SocketProvider } from "@/lib/providers/socket-provider";
import { SupabaseUserProvider } from "@/lib/providers/supabase-user-provider";
import { ThemeProvider } from "@/lib/providers/next-theme-provider";
import { Toaster } from "@/components/ui/toaster";
import db from "@/lib/supabase/db";
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
    // console.log(db);
    return (
        <html lang="en">
            <body className={twMerge("bg-background", inter.className)}>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="dark"
                    enableSystem={true}
                >
                    <AppStateProvider>
                        <SupabaseUserProvider>
                            <SocketProvider>
                                {children}
                                <Toaster />
                            </SocketProvider>
                        </SupabaseUserProvider>
                    </AppStateProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
