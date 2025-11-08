"use client";

import * as React from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const editProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  password: z
    .string()
    .optional()
    .refine((val) => !val || val.length >= 6, "Password must be at least 6 characters if provided"),
  accountNumber: z.string().optional(),
  accountName: z.string().optional(),
  bankName: z.string().optional(),
  bankCode: z.string().optional(),
});

type EditProfileFormData = z.infer<typeof editProfileSchema>;

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    _id?: string;
    name: string;
    email?: string;
    bankDetails?: {
      accountNumber?: string;
      accountName?: string;
      bankName?: string;
      bankCode?: string;
    };
    storeName?: string;
    phoneNumber?: string;
    city?: string;
    isCurrentlySellingOnline?: boolean;
    estimatedMonthlyOrders?: number | string;
  };
  onProfileUpdated?: () => void;
}

export function EditProfileDialog({
  open,
  onOpenChange,
  user,
  onProfileUpdated,
}: EditProfileDialogProps) {
  const [loading, setLoading] = React.useState(false);

  const form = useForm<EditProfileFormData>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      name: user.name || "",
      password: "",
      accountNumber: user.bankDetails?.accountNumber || "",
      accountName: user.bankDetails?.accountName || "",
      bankName: user.bankDetails?.bankName || "",
      bankCode: user.bankDetails?.bankCode || "",
    },
  });

  React.useEffect(() => {
    form.reset({
      name: user.name || "",
      password: "",
      accountNumber: user.bankDetails?.accountNumber || "",
      accountName: user.bankDetails?.accountName || "",
      bankName: user.bankDetails?.bankName || "",
      bankCode: user.bankDetails?.bankCode || "",
    });
  }, [user, form]);

  const onSubmit = async (data: EditProfileFormData) => {
    setLoading(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        toast.error("No auth token found. Please login.");
        setLoading(false);
        return;
      }

      // Build payload: send password only if provided; include only non-empty bank fields.
      const name = data.name.trim();
      const password = data.password?.trim() ?? "";

      const bankDetailsCandidate: Record<string, string> = {};
      if (data.accountNumber?.trim()) bankDetailsCandidate.accountNumber = data.accountNumber.trim();
      if (data.accountName?.trim()) bankDetailsCandidate.accountName = data.accountName.trim();
      if (data.bankName?.trim()) bankDetailsCandidate.bankName = data.bankName.trim();
      if (data.bankCode?.trim()) bankDetailsCandidate.bankCode = data.bankCode.trim();

      const payload: any = { name };
      if (password) payload.password = password;
      if (Object.keys(bankDetailsCandidate).length > 0) payload.bankDetails = bankDetailsCandidate;

      // Use auth-based endpoint: server will read user id from token (req.user._id)
      const targetUrl = "https://cod-ecommerce-two.vercel.app/api/seller/edit-profile";

      // Debug — remove in production if you want
      // eslint-disable-next-line no-console
      console.log("EditProfile payload:", payload, "targetUrl:", targetUrl);

      const res = await axios.put(targetUrl, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        validateStatus: () => true,
      });

      // eslint-disable-next-line no-console
      console.log("EditProfile response:", res.status, res.data);

      if (res.status >= 200 && res.status < 300) {
        toast.success("Profile updated successfully");

        // Prefer server-returned user object to update localStorage cleanly
        try {
          const serverUser = res.data?.user ?? null;
          const raw = localStorage.getItem("user");
          if (serverUser) {
            if (raw) {
              // If localStorage contains a wrapper { user: {...}, ... } preserve wrapper keys
              try {
                const parsed = JSON.parse(raw);
                if (parsed && typeof parsed === "object" && parsed.user) {
                  parsed.user = { ...parsed.user, ...serverUser };
                  localStorage.setItem("user", JSON.stringify(parsed));
                } else {
                  // plain user or other shape — replace/merge
                  const merged = { ...(parsed || {}), ...serverUser };
                  localStorage.setItem("user", JSON.stringify(merged));
                }
              } catch (e) {
                // parsing failed — overwrite with server user
                localStorage.setItem("user", JSON.stringify(serverUser));
              }
            } else {
              localStorage.setItem("user", JSON.stringify(serverUser));
            }
          } else if (raw) {
            // No server user returned; attempt to merge the fields we know we changed
            try {
              const parsed = JSON.parse(raw);
              const wrapperKey = parsed && typeof parsed === "object" && parsed.user ? "user" : null;
              const currentUser = wrapperKey ? parsed.user : parsed;
              const mergedUser = {
                ...currentUser,
                name: payload.name ?? currentUser?.name,
                bankDetails: payload.bankDetails ? { ...(currentUser?.bankDetails || {}), ...payload.bankDetails } : currentUser?.bankDetails,
              };
              if (wrapperKey) {
                parsed.user = mergedUser;
                localStorage.setItem("user", JSON.stringify(parsed));
              } else {
                localStorage.setItem("user", JSON.stringify(mergedUser));
              }
            } catch (e) {
              // ignore and don't overwrite if parsing fails
              console.warn("Failed to merge localStorage user after update", e);
            }
          }
        } catch (err) {
          console.warn("Failed to update localStorage with new user data", err);
        }

        onProfileUpdated?.();
        onOpenChange(false);
      } else {
        // show server message when available
        const msg = (res.data && (res.data.message || res.data.error)) ?? `Update failed with status ${res.status}`;
        toast.error(String(msg));
      }
    } catch (err: any) {
      console.error("Error updating profile:", err);
      toast.error("Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Leave blank to keep current password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="border-t pt-4">
              <h3 className="font-semibold text-sm mb-3">Bank Details</h3>

              <FormField
                control={form.control}
                name="accountNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Your account number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="accountName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Account holder name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bankName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bank Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your bank name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bankCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bank Code</FormLabel>
                    <FormControl>
                      <Input placeholder="Bank code or routing number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}