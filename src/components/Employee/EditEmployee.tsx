"use client"

import { useState } from "react"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

export function EditEmployee({
  employee,
  onUpdated,
  open,
  onClose,
}: {
  employee: { _id: string; name: string }
  onUpdated: () => void
  open: boolean
  onClose: () => void
}) {
  const [name, setName] = useState(employee.name)
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    try {
      const token = localStorage.getItem("token")
      await axios.put(
        `http://localhost:8000/api/admin/employees/${employee._id}`,
        { name, password },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setMessage("✅ Employee updated!")
      onUpdated()
      onClose()
    } catch (err: any) {
      setMessage("❌ Failed to update employee")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Edit Employee</SheetTitle>
          <SheetDescription>Update name or password only.</SheetDescription>
        </SheetHeader>
        <form onSubmit={handleUpdate} className="grid gap-6 px-4">
          <div className="grid gap-3">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="grid gap-3">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Leave blank to keep current"
            />
          </div>
          {message && <p className="text-sm text-red-500">{message}</p>}
          <SheetFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save changes"}
            </Button>
            <SheetClose asChild>
              <Button type="button" variant="outline">
                Close
              </Button>
            </SheetClose>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
