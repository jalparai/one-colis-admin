"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Upload } from "lucide-react"
import axios from "axios"
import toast from "react-hot-toast"
import { validateFile } from "@/lib/import-export-utils"

type Props = {
  endpoint: string
  label?: string
  onSuccess?: () => void
  disabled?: boolean
}

export function ImportReadyOrdersButton({ endpoint, label = "Import Ready Orders", onSuccess, disabled = false }: Props) {
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [submitting, setSubmitting] = React.useState(false)

  const onPick = () => fileInputRef.current?.click()

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const { isValid, error } = validateFile(file)
    if (!isValid) {
      toast.error(error || "Invalid file selected")
      e.target.value = ""
      return
    }

    try {
      setSubmitting(true)
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
      if (!token) throw new Error("Missing auth token")

      const formData = new FormData()
      formData.append("file", file)

      toast.loading("Uploading ready orders...", { id: "ready-upload" })

      await axios.post(endpoint, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      })

      toast.success("Ready orders imported successfully", { id: "ready-upload" })
      onSuccess?.()
    } catch (err: any) {
      console.error("Ready orders import failed", err)
      const msg = err?.response?.data?.message || err.message || "Failed to import ready orders"
      toast.error(msg, { id: "ready-upload" })
    } finally {
      setSubmitting(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  return (
    <div className="flex items-center gap-2 lg:overflow-auto overflow-x-scroll">
      <Input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={onFile} className="hidden" />
      <Button variant="outline" size="sm" onClick={onPick} disabled={disabled || submitting} className="flex items-center gap-2 lg:overflow-auto overflow-x-scroll">
        <Upload className="h-4 w-4" />
        {label}
      </Button>
    </div>
  )
}
