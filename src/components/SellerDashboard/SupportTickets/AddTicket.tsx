"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { toast } from "react-hot-toast";

interface AddTicketProps {
  /** optional: if provided, component is controlled by parent */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onTicketAdded?: () => void;
  /** if true, don't render a trigger button (useful if parent wants its own) */
  hideTrigger?: boolean;
}

export function AddTicket({
  open: openProp,
  onOpenChange,
  onTicketAdded,
  hideTrigger = false,
}: AddTicketProps) {
  const isControlled = typeof openProp === "boolean" && typeof onOpenChange === "function";

  // internal state only used when uncontrolled
  const [internalOpen, setInternalOpen] = useState<boolean>(false);
  const open = isControlled ? (openProp as boolean) : internalOpen;

  useEffect(() => {
    // if parent switches from controlled -> uncontrolled or vice versa we keep sane state
    if (!isControlled) return;
    // when controlled, keep nothing in internal state
  }, [isControlled]);

  const setOpen = (v: boolean) => {
    if (isControlled) {
      onOpenChange?.(v);
    } else {
      setInternalOpen(v);
    }
  };

  const [subject, setSubject] = useState("");
  const [ticketMessage, setTicketMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleAddTicket = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setMessage("❌ Authentication token missing");
        setLoading(false);
        return;
      }

      await axios.post(
        "https://cod-ecommerce-two.vercel.app/api/seller/support-tickets",
        { subject, message: ticketMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    toast.success("Tickets refreshed");

      setMessage("✅ Ticket created successfully!");
      setSubject("");
      setTicketMessage("");
      onTicketAdded?.();

      // close sheet
      setOpen(false);
    } catch (err: any) {
      setMessage(
        axios.isAxiosError(err)
          ? err.response?.data?.message || "❌ Failed to create ticket"
          : "❌ Unexpected error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {/* Render trigger only when uncontrolled and not explicitly hidden */}
      {!isControlled && !hideTrigger && (
        <SheetTrigger asChild>
          <Button>+ Add Ticket</Button>
        </SheetTrigger>
      )}

      <SheetContent>
        <SheetHeader>
          <SheetTitle>Add Ticket</SheetTitle>
          <SheetDescription>Fill in the details to create a new support ticket.</SheetDescription>
        </SheetHeader>

        <form onSubmit={handleAddTicket} className="grid gap-6 px-4">
          <div className="grid gap-3">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
          </div>

          <div className="grid gap-3">
            <Label htmlFor="ticketMessage">Message</Label>
            <Input
              id="ticketMessage"
              value={ticketMessage}
              onChange={(e) => setTicketMessage(e.target.value)}
              placeholder="Describe your issue..."
              required
            />
          </div>

          {message && (
            <p className={`text-sm ${message.startsWith("✅") ? "text-green-600" : "text-red-500"}`}>
              {message}
            </p>
          )}

          <SheetFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Ticket"}
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
