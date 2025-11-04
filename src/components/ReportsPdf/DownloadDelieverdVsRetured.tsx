  "use client"

  import React from "react"
  import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

  export default function DownloadDelieverdVsReturned() {
    const handleDownload = async () => {
      try {
        const token = localStorage.getItem("token")
        if (!token) {
          alert("No token found")
          return
        }

        const res = await fetch(
          "https://cod-ecommerce-two.vercel.app/api/admin/delivered-vs-returned/pdf",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )

        if (!res.ok) {
          throw new Error("Failed to download PDF")
        }

        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = "Delivery-vs-Returned-report.pdf"
        document.body.appendChild(a)
        a.click()
        a.remove()
        window.URL.revokeObjectURL(url)
      } catch (err) {
        console.error(err)
        alert("Error downloading PDF")
      }
    }

    return (
     <Button
  onClick={handleDownload}
  className="flex items-center gap-2  bg-[#2BC3F1] cursor-pointer font-medium text-white shadow-md transition-all duration-200 hover:bg-[#1BB8E8] hover:shadow-lg"
>
  <Download className="w-4 h-4" />
  Export Data
</Button>
    )
  }
