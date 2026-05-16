import "./globals.css"
import { Toaster } from "sonner"

export const metadata = {
  title: "Fixam Admin Dashboard",
  description: "Marketplace Management System",
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
