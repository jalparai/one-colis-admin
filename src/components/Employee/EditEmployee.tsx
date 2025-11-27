"use client";

import { useState, useEffect } from "react";
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
} from "@/components/ui/sheet";
import { useTranslation } from "react-i18next";

export function EditEmployee({
  employee,
  onUpdated,
  open,
  onClose,
}: {
  employee: {
    _id: string;
    name: string;
    email?: string;
    customRole?: string;
    permissions?: {
      addStock?: boolean;
      supportOperations?: boolean;
      manageOrders?: boolean;
      scanOrders?: boolean;
      assignOrders?: boolean;
      assignPickups?: boolean;
      assignProducts?: boolean;
      assignPayouts?: boolean;
      SupportTick?: boolean;
      managePickups?: boolean;
      manageSellers?: boolean;
      manageInvoices?: boolean;
      manageWarehouse?: boolean;
      manageDeliveryAgents?: boolean;
    };
  };
  onUpdated: () => void;
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const ns = "employeeAdd";

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [formData, setFormData] = useState({
    name: employee.name || "",
    email: employee.email || "",
    password: "",
    customRole: employee.customRole || "",
    permissions: {
      addStock: employee.permissions?.addStock || false,
      supportOperations: employee.permissions?.supportOperations || false,
      manageOrders: employee.permissions?.manageOrders || false,
      scanOrders: employee.permissions?.scanOrders || false,
      assignOrders: employee.permissions?.assignOrders || false,
      assignPickups: employee.permissions?.assignPickups || false,
      assignProducts: employee.permissions?.assignProducts || false,
      assignPayouts: employee.permissions?.assignPayouts || false,
      SupportTick: employee.permissions?.SupportTick || false,
      managePickups: employee.permissions?.managePickups || false,
      manageSellers: employee.permissions?.manageSellers || false,
      manageInvoices: employee.permissions?.manageInvoices || false,
      manageWarehouse: employee.permissions?.manageWarehouse || false,
      manageDeliveryAgents: employee.permissions?.manageDeliveryAgents || false,
    },
  });

  // Sync employee data when modal opens or employee changes
  useEffect(() => {
    if (employee) {
      setFormData({
        name: employee.name || "",
        email: employee.email || "",
        password: "",
        customRole: employee.customRole || "",
        permissions: {
          addStock: employee.permissions?.addStock || false,
          supportOperations: employee.permissions?.supportOperations || false,
          manageOrders: employee.permissions?.manageOrders || false,
          scanOrders: employee.permissions?.scanOrders || false,
          assignOrders: employee.permissions?.assignOrders || false,
          assignPickups: employee.permissions?.assignPickups || false,
          assignProducts: employee.permissions?.assignProducts || false,
          assignPayouts: employee.permissions?.assignPayouts || false,
          SupportTick: employee.permissions?.SupportTick || false,
          managePickups: employee.permissions?.managePickups || false,
          manageSellers: employee.permissions?.manageSellers || false,
          manageInvoices: employee.permissions?.manageInvoices || false,
          manageWarehouse: employee.permissions?.manageWarehouse || false,
          manageDeliveryAgents: employee.permissions?.manageDeliveryAgents || false,
        },
      });
      setMessage("");
    }
  }, [employee, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked, type } = e.target;

    if (name in formData.permissions) {
      setFormData((prev) => ({
        ...prev,
        permissions: { ...prev.permissions, [name]: checked },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error(t(`${ns}.errorNoToken`));
        setLoading(false);
        return;
      }

      await axios.put(
        `https://cod-ecommerce-two.vercel.app/api/admin/employees/${employee._id}`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(t(`${ns}.successUpdate`));
      onUpdated();
      onClose();
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.message || t(`${ns}.errorGenericUpdate`);
      setMessage(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="overflow-scroll">
        <SheetHeader>
          <SheetTitle>{t(`${ns}.editTitle`)}</SheetTitle>
          <SheetDescription>{t(`${ns}.editDescription`)}</SheetDescription>
        </SheetHeader>

        <form onSubmit={handleUpdate} className="grid gap-6 px-4 py-4">
          {/* Name */}
          <div className="grid gap-3">
            <Label htmlFor="name">{t(`${ns}.fields.name`)}</Label>
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
            <Label htmlFor="email">{t(`${ns}.fields.email`)}</Label>
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
            <Label htmlFor="password">{t(`${ns}.fields.password`)}</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder={t(`${ns}.placeholders.password`)}
            />
          </div>

          {/* Custom Role */}
          <div className="grid gap-3">
            <Label htmlFor="customRole">{t(`${ns}.fields.customRole`)}</Label>
            <Input
              id="customRole"
              name="customRole"
              value={formData.customRole}
              onChange={handleChange}
              placeholder={t(`${ns}.placeholders.customRole`)}
              required
            />
          </div>

          {/* Permissions */}
          <div className="border-t pt-4">
            <Label className="font-semibold mb-2 text-sm">
              {t(`${ns}.permissionsTitle`)}
            </Label>
            <div className="flex flex-col gap-3 mt-2 text-sm">
              {Object.keys(formData.permissions).map((key) => (
                <label key={key} className="flex items-center gap-2 capitalize">
                  <input
                    type="checkbox"
                    name={key}
                    checked={
                      formData.permissions[key as keyof typeof formData.permissions]
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
              {loading ? t(`${ns}.submit.saving`) : t(`${ns}.submit.save`)}
            </Button>
            <SheetClose asChild>
              <Button type="button" variant="outline">
                {t(`${ns}.close`)}
              </Button>
            </SheetClose>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
