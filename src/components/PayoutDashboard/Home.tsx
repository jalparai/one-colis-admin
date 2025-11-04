"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { IconTrendingUp } from "@tabler/icons-react"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function Home() {
  const [totalPayouts, setTotalPayouts] = useState<number | null>(null)

  useEffect(() => {
    const fetchTotalPayouts = async () => {
      try {
        const token = localStorage.getItem("token")
        if (!token) return

        const response = await axios.get(
          "https://cod-ecommerce-two.vercel.app/api/payouts-managers/get-my-payouts",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        )

        // ✅ The API gives totalPayouts in response.data.totalPayouts
        setTotalPayouts(response.data?.totalPayouts || 0)
      } catch (error) {
        console.error("Error fetching payouts:", error)
      }
    }

    fetchTotalPayouts()
  }, [])

  return (
    <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:shadow-xs">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Payouts</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {totalPayouts !== null ? totalPayouts : "Loading..."}
          </CardTitle>
          <CardAction>
            {/* Optional analytics badge */}
            {/* <Badge variant="outline">
              <IconTrendingUp className="w-4 h-4 mr-1" /> +5.6%
            </Badge> */}
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Payouts processed by your account <IconTrendingUp className="size-4" />
          </div>
          {/* Optional extra info */}
          {/* <div className="text-muted-foreground">
            Includes both pending and completed payouts
          </div> */}
        </CardFooter>
      </Card>
    </div>
  )
}
