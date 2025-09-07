"use client";

import { useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function AddWearhouse({ onwearHouseAdded }: { onwearHouseAdded?: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleAddwearHouse = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const token = localStorage.getItem("token");

      const res = await axios.post(
        "https://cod-ecommerce-two.vercel.app/api/warehouse/create",
        { name, email, password},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage(`✅ wearHouse ${res.data?.data?.name || "created"} successfully!`);

      setName("");
      setEmail("");
      setPassword("");

      if (onwearHouseAdded) onwearHouseAdded(); // 🔄 Refresh parent list
    } catch (err: any) {
      if (axios.isAxiosError(err)) {
        setMessage(err.response?.data?.message || "❌ Failed to create wearHouse");
      } else {
        setMessage("❌ Unexpected error");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button>+ Add wearHouse</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Add wearHouse</SheetTitle>
          <SheetDescription>Fill in the details to create a new wearHouse.</SheetDescription>
        </SheetHeader>
        <form onSubmit={handleAddwearHouse} className="grid flex-1 auto-rows-min gap-6 px-4">
          <div className="grid gap-3">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="grid gap-3">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-3">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
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
  );
}
