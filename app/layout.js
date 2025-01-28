import localFont from "next/font/local";
import "./globals.css";
import Sidebar from "../components/customComponents/Sidebar";
import Header from "@/components/customComponents/Header";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/customComponents/ThemeProvider";
import { PermissionsProvider } from "@/context/PermissionsProvider";
import { AuthProviders } from "./Provider";
import { AuthProvider } from "@/context/AuthProvider";


const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata = {
  title: "MIM Donor CRM",
  description: "MIM Donor Management System",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white dark:bg-black flex h-screen overflow-hidden`}
      >
        {/* <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        > */}
        <AuthProviders>
        <AuthProvider>

        <PermissionsProvider>
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header />
            <main className="flex-1 overflow-y-auto">
              {children}
            </main>
          </div>
          <Toaster />
        </PermissionsProvider>
        </AuthProvider>
        </AuthProviders>
        {/* </ThemeProvider> */}
      </body>
    </html>
  );
}
