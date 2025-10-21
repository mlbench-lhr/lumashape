import type { Metadata } from "next";
import { Geist, Geist_Mono, Raleway } from "next/font/google";
import "../../init.ts";
import "./globals.css";
// import { ToastContainer } from "react-toastify/unstyled";
// import { TabProvider } from "@/context/TabContext";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { SidebarProvider } from "../context/SidebarContext";
import { UserProvider } from "@/context/UserContext";
import { CartProvider } from "@/context/CartContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const raleway = Raleway({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-raleway",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Lumashape",
  description: "Lumashape",
  icons: {
    icon: "/images/icons/lumashape.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${raleway.variable}  antialiased`}
      >
        <SidebarProvider>
          <UserProvider>
            <CartProvider>
              <ToastContainer
                position="top-center"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
              />
              {children}
            </CartProvider>
          </UserProvider>
        </SidebarProvider>
      </body>
    </html>
  );
}
