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
      manageOrders?: boolean;
      assignProducts?: boolean;
      assignPayouts?: boolean;
      assignPickups?: boolean;
      SupportTick?: boolean;
      managePickups?: boolean;
    };
  };
  onUpdated: () => void;
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const ns = "employeeAdd";

  const [name, setName] = useState(employee.name || "");
  const [password, setPassword] = useState("");
  const [customRole, setCustomRole] = useState(employee.customRole || "");
  const [permissions, setPermissions] = useState({
    addStock: employee.permissions?.addStock || false,
    manageOrders: employee.permissions?.manageOrders || false,
    assignProducts: employee.permissions?.assignProducts || false,
    assignPayouts: employee.permissions?.assignPayouts || false,
    assignPickups: employee.permissions?.assignPickups || false,
    SupportTick: employee.permissions?.SupportTick || false,
    managePickups: employee.permissions?.managePickups || false,
  });
  const [loading, setLoading] = useState(false);

  // Sync employee data when modal opens or employee changes
  useEffect(() => {
    if (employee) {
      setName(employee.name || "");
      setCustomRole(employee.customRole || "");
      setPermissions({
        addStock: employee.permissions?.addStock || false,
        manageOrders: employee.permissions?.manageOrders || false,
        assignProducts: employee.permissions?.assignProducts || false,
        assignPayouts: employee.permissions?.assignPayouts || false,
        assignPickups: employee.permissions?.assignPickups || false,
        SupportTick: employee.permissions?.SupportTick || false,
        managePickups: employee.permissions?.managePickups || false,
      });
      setPassword("");
    }
  }, [employee, open]);

  const handlePermissionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setPermissions((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error(t(`${ns}.errorNoToken`));
        setLoading(false);
        return;
      }

      await axios.put(
        `https://cod-ecommerce-two.vercel.app/api/admin/employees/${employee._id}`,
        {
          name,
          password,
          customRole,
          permissions,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(t(`${ns}.successUpdate`));
      onUpdated();
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(
        err.response?.data?.message || t(`${ns}.errorGenericUpdate`)
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{t(`${ns}.editTitle`)}</SheetTitle>
          <SheetDescription>{t(`${ns}.editDescription`)}</SheetDescription>
        </SheetHeader>

        <form onSubmit={handleUpdate} className="grid gap-6 px-4">
          {/* Name Field */}
          <div className="grid gap-3">
            <Label htmlFor="name">{t(`${ns}.fields.name`)}</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* Password Field */}
          <div className="grid gap-3">
            <Label htmlFor="password">{t(`${ns}.fields.password`)}</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t(`${ns}.placeholders.password`)}
            />
          </div>

          {/* Custom Role Field */}
          <div className="grid gap-3">
            <Label htmlFor="customRole">{t(`${ns}.fields.customRole`)}</Label>
            <Input
              id="customRole"
              name="customRole"
              value={customRole}
              onChange={(e) => setCustomRole(e.target.value)}
              placeholder={t(`${ns}.placeholders.customRole`)}
              required
            />
          </div>

          {/* Permissions Section */}
          <div className="border-t pt-4">
            <Label className="font-semibold text-sm mb-2 block">
              {t(`${ns}.permissionsTitle`)}
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              {Object.keys(permissions).map((key) => (
                <label key={key} className="flex items-center gap-2 lg:overflow-auto overflow-x-scroll capitalize">
                  <input
                    type="checkbox"
                    name={key}
                    checked={permissions[key as keyof typeof permissions] || false}
                    onChange={handlePermissionChange}
                    className="w-4 h-4"
                  />
                  {t(`${ns}.permissions.${key}`)}
                </label>
              ))}
            </div>
          </div>

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
