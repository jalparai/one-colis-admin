"use client";

import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
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

interface AddEmployeeProps {
  onEmployeeAdded: () => void;
}

export function AddEmployee({ onEmployeeAdded }: AddEmployeeProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    customRole: "",
    permissions: {
      addStock: false,
      manageOrders: false,
      assignProducts: false,
      assignPayouts: false,
      assignPickups: false,
                SupportTick: false,
                 managePickups:false


    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked } = e.target;

    if (name in formData.permissions) {
      setFormData((prev) => ({
        ...prev,
        permissions: { ...prev.permissions, [name]: checked },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("No token found. Please log in.");
      setLoading(false);
      return;
    }

    try {
      await axios.post(
        "https://cod-ecommerce-two.vercel.app/api/admin/create-employee",
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("✅ Employee added successfully!");
      onEmployeeAdded();

      setFormData({
        name: "",
        email: "",
        password: "",
        customRole: "",
        permissions: {
          addStock: false,
          manageOrders: false,
          assignProducts: false,
          assignPayouts: false,
          assignPickups: false,
          SupportTick: false,
          managePickups:false

        },
      });

      setOpen(false);
    } catch (err: any) {
      console.error("Error adding employee:", err);
      const errorMsg =
        err.response?.data?.message || "❌ Failed to add employee";
      setMessage(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button className="bg-primary text-white hover:bg-primary/90">
          + Add Employee
        </Button>
      </SheetTrigger>

      <SheetContent className="overflow-scroll">
        <SheetHeader>
          <SheetTitle>Add New Employee</SheetTitle>
          <SheetDescription>
            Fill in the fields to add a new employee and assign permissions.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="grid gap-6 px-4 py-4">
          {/* Name */}
          <div className="grid gap-3">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          {/* Email */}
          <div className="grid gap-3">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          {/* Password */}
          <div className="grid gap-3">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          {/* Role */}
          <div className="grid gap-3">
            <Label htmlFor="customRole">Custom Role</Label>
            <Input
              id="customRole"
              name="customRole"
              value={formData.customRole}
              onChange={handleChange}
              placeholder="e.g. Dev"
              required
            />
          </div>

          {/* Permissions */}
          <div className="border-t pt-4">
            <Label className="font-semibold mb-2 text-sm">Permissions</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 text-sm">
              {Object.keys(formData.permissions).map((key) => (
                <label key={key} className="flex items-center gap-2 capitalize">
                  <input
                    type="checkbox"
                    name={key}
                    checked={
                      formData.permissions[
                        key as keyof typeof formData.permissions
                      ]
                    }
                    onChange={handleChange}
                    className="w-4 h-4"
                  />
                  {key.replace(/([A-Z])/g, " $1")}
                </label>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {message && <p className="text-sm text-red-500">{message}</p>}

          {/* Footer */}
          <SheetFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Employee"}
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
