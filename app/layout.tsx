import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";

import { AuthBootstrap } from "@/components/providers/auth-bootstrap";
import { StoreProvider } from "@/lib/store-provider";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "EduCore",
    template: "%s · EduCore",
  },
  description:
    "EduCore education management: courses, semesters and enrollment for super admins, admins, instructors and students.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/*
         * Redux reads `Math.random()` while its module is evaluated, and with
         * cacheComponents enabled Next rejects that during the prerender of a
         * Client Component. Keeping the store behind a boundary renders this
         * fallback as the static shell instead, and the tree streams per request.
         */}
        <Suspense fallback={<RootFallback />}>
          <StoreProvider>
            <AuthBootstrap>{children}</AuthBootstrap>
          </StoreProvider>
        </Suspense>
      </body>
    </html>
  );
}

function RootFallback() {
  return (
    <div className="flex min-h-svh items-center justify-center">
      <span role="status" className="sr-only">
        Loading EduCore
      </span>
      <span
        aria-hidden
        className="size-6 animate-spin rounded-full border-2 border-muted border-t-foreground"
      />
    </div>
  );
}
