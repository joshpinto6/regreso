import "~/styles/globals.css";

import { type Metadata } from "next";

import { GeistSans } from "geist/font/sans";

import { ThemeProvider } from "~/app/providers";

import PostHogPageView from "./PostHogPageView";
import { CSPostHogProvider } from "./providers";

export const metadata: Metadata = {
  title: "Regreso | App Dashboard",
  description:
    "Regreso is an app that helps you find your way back. Never lose your digital trail again by effortlessly finding your way back to websites, articles, and resources.",
  icons: [
    { rel: "icon", url: "/favicon.ico", sizes: "any" },
    { rel: "icon", url: "/favicon.svg", type: "image/svg+xml" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${GeistSans.variable}`}>
      <CSPostHogProvider>
        <body>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <PostHogPageView />
            {children}
          </ThemeProvider>
        </body>
      </CSPostHogProvider>
    </html>
  );
}
