import type { Metadata } from "next";
import { headers } from "next/headers";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/providers/AppProviders";

export const dynamic = "force-dynamic";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap"
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap"
});

export const metadata: Metadata = {
  title: "EduWave — School Management Platform",
  description:
    "Modern school management platform for Moroccan private schools. Attendance, grades, behavior, and communication — all in one place.",
  keywords: ["school", "management", "morocco", "education", "saas"],
  authors: [{ name: "EduWave" }],
  robots: {
    index: false,
    follow: false
  },
  openGraph: {
    title: "EduWave — School Management Platform",
    description: "Replace paper. Empower schools.",
    type: "website"
  }
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const h = headers();
  const nonce = h.get("x-nonce") || "";
  return (
    <html lang="fr" suppressHydrationWarning className={`${inter.variable} ${plusJakarta.variable}`}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1e293b" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="EduWave" />
        <script nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: `try{document.documentElement.classList.remove('dark')}catch(e){}`
          }}
        />
        {/* Force light mode: v3 */}
      </head>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
