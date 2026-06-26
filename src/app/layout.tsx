import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ConvexClientProvider } from "@/components/convex-client-provider";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bizwoke ERP - Enterprise Portal",
  description: "Enterprise ERP Management System for Admin, HR, and Employees.",
  icons: {
    icon: "/Bizwoke.jpg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ConvexAuthNextjsServerProvider storageNamespace="bizwoke-erp-auth">
      <html lang="en">
        <body
          className={`${inter.variable} font-sans antialiased bg-slate-50 text-slate-900 transition-colors duration-200`}
        >
          <ConvexClientProvider>
            {children}
          </ConvexClientProvider>
        </body>
      </html>
    </ConvexAuthNextjsServerProvider>
  );
}

