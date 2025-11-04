"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { UploadCloud, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

interface CityFee {
  _id?: string;
  city: string;
  fee: number;
}

export default function CityFeePage() {
  const [cityFees, setCityFees] = useState<CityFee[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);

  const [newCity, setNewCity] = useState("");
  const [newFee, setNewFee] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState(Date.now());

  // ✅ Fetch city fees
  useEffect(() => {
    async function fetchCityFees() {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("https://cod-ecommerce-two.vercel.app/api/admin/city-fees", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to fetch city fees");
        const resData = await res.json();
        setCityFees(resData || []);
      } catch (err) {
        toast.error("Unable to load city fees");
      } finally {
        setLoading(false);
      }
    }

    fetchCityFees();
  }, []);

  // ✅ Add single city fee
 const handleAddCityFee = async () => {
  if (!newCity || !newFee) return toast.error("Please enter both city and fee");

  try {
    const token = localStorage.getItem("token");
    if (!token) return toast.error("Authentication token missing");

    const res = await fetch(
      "https://cod-ecommerce-two.vercel.app/api/admin/city-fee",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ city: newCity.trim(), fee: Number(newFee) }),
      }
    );

    const result = await res.json();
    if (!res.ok) throw new Error(result.message || "Failed to add city fee");

    toast.success(result.message || `Added ${newCity}`);

    // ✅ Fetch latest list immediately (no full page refresh)
    const refresh = await fetch(
      "https://cod-ecommerce-two.vercel.app/api/admin/city-fees",
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const refreshedData = await refresh.json();
    setCityFees(refreshedData || []);

    // ✅ Reset inputs
    setNewCity("");
    setNewFee("");
  } catch (err: any) {
    console.error(err);
    toast.error(err.message || "Failed to add city fee");
  }
};



  // ✅ Delete city fee (by city name)
  const handleDeleteCityFee = async (cityName: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `https://cod-ecommerce-two.vercel.app/api/admin/delete-city-fees/${encodeURIComponent(cityName)}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await res.json();
      if (res.ok) {
        setCityFees((prev) => prev.filter((item) => item.city !== cityName));
        toast.success(`Deleted delivery fee for ${cityName}`);
      } else {
        throw new Error(data.message || "Failed to delete city fee");
      }
    } catch (err: any) {
      console.error("Error deleting city fee:", err);
      toast.error(err.message || "Error deleting city fee");
    }
  };

  // ✅ Bulk CSV upload
  const handleFileUpload = async () => {
    if (!selectedFile) return toast.error("Please select a CSV file");

    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      setUploading(true);
      setUploadMessage(null);

      const res = await fetch("https://cod-ecommerce-two.vercel.app/api/admin/city-fee/bulk-upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const result = await res.json();
      if (res.ok) {
        toast.success(result.message || "Bulk upload successful");

        // Refresh data
        const refresh = await fetch("https://cod-ecommerce-two.vercel.app/api/admin/city-fees", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const refreshedData = await refresh.json();
        setCityFees(refreshedData || []);
        setSelectedFile(null);
        setFileInputKey(Date.now());
      } else {
        throw new Error(result.message || "Upload failed");
      }
    } catch (err: any) {
      console.error("Upload failed:", err);
      toast.error(err.message || "Failed to upload");
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <p className="p-6">Loading city fees...</p>;

  return (
    <div className="min-h-screen bg-white lg:p-5 p-3">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Add City Fee Form */}
        <Card className="shadow-sm border border-gray-200">
          <CardHeader>
            <CardTitle>Add City Fee</CardTitle>
            <CardDescription>Enter a new city and delivery fee manually</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="City Name"
              value={newCity}
              onChange={(e) => setNewCity(e.target.value)}
            />
            <Input
              placeholder="Fee"
              type="number"
              value={newFee}
              onChange={(e) => setNewFee(e.target.value)}
            />
            <Button onClick={handleAddCityFee}>Add</Button>
          </CardContent>
        </Card>

        {/* Bulk Import Section */}
        <Card className="shadow-sm border border-gray-200">
          <CardHeader>
            <CardTitle>Bulk Import City Fees</CardTitle>
            <CardDescription>Upload a CSV file containing multiple city fees.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row items-center gap-3">
            <Input
              key={fileInputKey}
              type="file"
              accept=".csv"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            />
            <Button
              onClick={handleFileUpload}
              disabled={uploading}
              className="flex items-center gap-2"
            >
              <UploadCloud className="w-4 h-4" />
              {uploading ? "Uploading..." : "Upload CSV"}
            </Button>
          </CardContent>
        </Card>

        {/* City Fee List with Delete */}
        <Card className="shadow-sm border border-gray-200">
          <CardHeader>
            <CardTitle>City Fees</CardTitle>
            <CardDescription>List of all cities with delivery fees</CardDescription>
          </CardHeader>
          <CardContent>
            {cityFees.length === 0 ? (
              <p className="text-gray-500">No city fees available.</p>
            ) : (
              <div className="divide-y">
                {cityFees.map((item, index) => (
                  <div
                    key={item._id || index}
                    className="flex items-center justify-between py-3"
                  >
                    <span className="font-medium text-gray-800 capitalize">{item.city}</span>
                    <div className="flex items-center gap-3">
                      <Badge className="text-sm px-3 py-1 bg-gray-100 text-gray-700">
                        DH {item.fee}
                      </Badge>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="flex items-center gap-1 cursor-pointer"
                        onClick={() => handleDeleteCityFee(item.city)}
                      >
                        <Trash2 className="w-4 h-4" />
                        
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
