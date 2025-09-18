"use client";

import { useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

export function AddSeller({ onSellerAdded }: { onSellerAdded?: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [storeName, setStoreName] = useState("");
  const [city, setCity] = useState(""); // ✅ New city state
  const [estimatedMonthlyOrders, setEstimatedMonthlyOrders] = useState("");
  const [isCurrentlySellingOnline, setIsCurrentlySellingOnline] = useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleAddSeller = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const token = localStorage.getItem("token");

      const res = await axios.post(
        "https://cod-ecommerce-two.vercel.app/api/auth/register",
        {
          name,
          email,
          password,
          phoneNumber,
          storeName,
          city, // ✅ Include city in API call
          estimatedMonthlyOrders: Number(estimatedMonthlyOrders),
          isCurrentlySellingOnline,
          role: "Seller",
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage(`✅ Seller ${res.data?.data?.name || "created"} successfully!`);

      // reset form
      setName("");
      setEmail("");
      setPassword("");
      setPhoneNumber("");
      setStoreName("");
      setCity(""); // ✅ reset city
      setEstimatedMonthlyOrders("");
      setIsCurrentlySellingOnline(false);

      if (onSellerAdded) onSellerAdded();
    } catch (err: any) {
      if (axios.isAxiosError(err)) {
        setMessage(err.response?.data?.message || "❌ Failed to create Seller");
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
        <Button>+ Add Seller</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Add Seller</SheetTitle>
          <SheetDescription>
            Fill in the details to create a new Seller.
          </SheetDescription>
        </SheetHeader>
        <form
          onSubmit={handleAddSeller}
          className="grid flex-1 auto-rows-min gap-6 px-4"
        >
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
            required
          />
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
          />
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
          />
          <Input
            id="phoneNumber"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="Phone Number"
          />
          <Input
            id="storeName"
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            placeholder="Store Name"
          />
          <Input
            id="city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="City"
          /> 
          <Input
            id="estimatedMonthlyOrders"
            type="number"
            value={estimatedMonthlyOrders}
            onChange={(e) => setEstimatedMonthlyOrders(e.target.value)}
            placeholder="Estimated Monthly Orders"
          />

          <div className="grid gap-3">
            <p className="text-sm font-medium">Currently Selling Online?</p>
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="sellingOnline"
                  value="yes"
                  checked={isCurrentlySellingOnline === true}
                  onChange={() => setIsCurrentlySellingOnline(true)}
                />
                <span>Yes</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="sellingOnline"
                  value="no"
                  checked={isCurrentlySellingOnline === false}
                  onChange={() => setIsCurrentlySellingOnline(false)}
                />
                <span>No</span>
              </label>
            </div>
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
