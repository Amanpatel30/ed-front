import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";

import { AuthBootstrap } from "@/components/providers/auth-bootstrap";
import { StoreProvider } from "@/lib/store-provider";
import { ActiveThemeProvider } from "@/components/themes/active-theme";
import ThemeProvider from "@/components/themes/theme-provider";
import { DEFAULT_THEME } from "@/components/themes/theme.config";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const META_THEME_COLORS = {
  light: "#ffffff",
  dark: "#09090b",
};

export const metadata: Metadata = {
  title: {
    default: "EduCore",
    template: "%s · EduCore",
  },
  description:
    "EduCore education management: courses, semesters and enrollment for super admins, admins, instructors and students.",
};

export const viewport: Viewport = {
  themeColor: META_THEME_COLORS.light,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-theme={DEFAULT_THEME}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const match = document.cookie.match(/(?:^|;\\s*)active_theme=([^;]+)/);
                if (match && match[1]) {
                  document.documentElement.setAttribute('data-theme', decodeURIComponent(match[1]));
                }
                if (localStorage.theme === 'dark' || ((!('theme' in localStorage) || localStorage.theme === 'system') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '${META_THEME_COLORS.dark}')
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground overflow-x-hidden overscroll-none">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          enableColorScheme
        >
          <ActiveThemeProvider initialTheme={DEFAULT_THEME}>
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
          </ActiveThemeProvider>
        </ThemeProvider>
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
