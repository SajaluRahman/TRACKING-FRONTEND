import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import ReminderManager from "@/components/ReminderManager";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "HabitTracker — Track Your Daily Habits",
  description:
    "A premium habit tracking app to organize categories, subcategories, and track daily progress on a visual calendar grid.",
  keywords: ["habit tracker", "daily tracking", "productivity", "calendar"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased`}>
        <div className="relative z-10 flex min-h-screen flex-col">
          <Header />
          <main className="flex-1">{children}</main>
        </div>
        <ReminderManager />
      </body>
    </html>
  );
}
