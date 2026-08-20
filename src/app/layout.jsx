import "./globals.css"
import { Toaster } from "sonner"

export const metadata = {
  title: "Fixam Pro Control Panel | Admin Dashboard",
  description: "Fixam Marketplace Management System & Control Panel",
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png" },
      { url: "/icon.png", type: "image/png" }
    ],
    shortcut: "/favicon.png",
    apple: "/apple-touch-icon.png",
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased font-sans selection:bg-blue-100 selection:text-blue-900">
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  )
}
