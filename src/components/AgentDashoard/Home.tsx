"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { IconPackage } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function Home() {
  const [totalPickups, setTotalPickups] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchPickups = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setLoading(false);
          return;
        }

        const response = await axios.get(
          "https://cod-ecommerce-two.vercel.app/api/delivery-agent/pickups/my-assignments",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const pickups = response.data?.data || [];
        setTotalPickups(pickups.length);
      } catch (error) {
        console.error("Error fetching pickups:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPickups();
  }, []);

  return (
    <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:shadow-xs">
      <Card className="@container/card" data-slot="card">
        <CardHeader>
          <CardDescription>Total Pickups</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {loading ? "Loading..." : totalPickups ?? 0}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="flex items-center gap-1">
              <IconPackage className="w-4 h-4" /> Active
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Pickups assigned to you
          </div>
          <div className="text-muted-foreground">
            Includes all assigned pickup orders
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
