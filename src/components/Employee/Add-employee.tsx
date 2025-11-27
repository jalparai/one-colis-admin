// ---------------------------------------------------------------------------
// AddEmployee.tsx  (Corrected Permissions)
// ---------------------------------------------------------------------------
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
import { useTranslation } from "react-i18next";

interface AddEmployeeProps {
  onEmployeeAdded: () => void;
}

export function AddEmployee({ onEmployeeAdded }: AddEmployeeProps) {
  const { t } = useTranslation();
  const ns = "employeeAdd";

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    customRole: "",
    // FIXED PERMISSIONS → EXACT MATCH WITH API
    permissions: {
      addStock: false,
      supportOperations: false,
      manageOrders: false,
      scanOrders: false,
      assignOrders: false,
      assignPickups: false,
      assignProducts: false,
      assignPayouts: false,
      SupportTick: false,
      managePickups: false,
      manageSellers: false,
      manageInvoices: false,
      manageWarehouse: false,
      manageDeliveryAgents: false,
    }
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
      toast.error(t(`${ns}.errorNoToken`));
      setLoading(false);
      return;
    }

    try {
      await axios.post(
        "https://cod-ecommerce-two.vercel.app/api/admin/create-employee",
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(t(`${ns}.success`));
      onEmployeeAdded();

      setFormData({
        name: "",
        email: "",
        password: "",
        customRole: "",
        permissions: {
          addStock: false,
          supportOperations: false,
          manageOrders: false,
          scanOrders: false,
          assignOrders: false,
          assignPickups: false,
          assignProducts: false,
          assignPayouts: false,
          SupportTick: false,
          managePickups: false,
          manageSellers: false,
          manageInvoices: false,
          manageWarehouse: false,
          manageDeliveryAgents: false,
        },
      });

      setOpen(false);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || t(`${ns}.errorGeneric`);
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
          {t(`${ns}.button`)}
        </Button>
      </SheetTrigger>

      <SheetContent className="overflow-scroll">
        <SheetHeader>
          <SheetTitle>{t(`${ns}.title`)}</SheetTitle>
          <SheetDescription>{t(`${ns}.description`)}</SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="grid gap-6 px-4 py-4">
          {/* Text inputs */}
          <div className="grid gap-3">
            <Label htmlFor="name">{t(`${ns}.fields.name`)}</Label>
            <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
          </div>

          <div className="grid gap-3">
            <Label htmlFor="email">{t(`${ns}.fields.email`)}</Label>
            <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required />
          </div>

          <div className="grid gap-3">
            <Label htmlFor="password">{t(`${ns}.fields.password`)}</Label>
            <Input id="password" name="password" type="password" value={formData.password} onChange={handleChange} required />
          </div>

          <div className="grid gap-3">
            <Label htmlFor="customRole">{t(`${ns}.fields.customRole`)}</Label>
            <Input id="customRole" name="customRole" value={formData.customRole}
              onChange={handleChange} placeholder={t(`${ns}.placeholders.customRole`)} required />
          </div>

          {/* Permissions */}
        <div className="border-t pt-4">
  <Label className="font-semibold mb-2 text-sm">
    {t(`${ns}.permissionsTitle`)}
  </Label>

  <div className="flex flex-col gap-3 mt-2 text-sm">
    {Object.keys(formData.permissions).map((key) => (
      <label
        key={key}
        className="flex items-center gap-2 capitalize"
      >
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
        {t(`${ns}.permissions.${key}`)}
      </label>
    ))}
  </div>
</div>


          {message && <p className="text-sm text-red-500">{message}</p>}

          <SheetFooter>
            <Button type="submit" disabled={loading}>
              {loading ? t(`${ns}.submit.adding`) : t(`${ns}.submit.add`)}
            </Button>
            <SheetClose asChild>
              <Button variant="outline" type="button">{t(`${ns}.close`)}</Button>
            </SheetClose>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}