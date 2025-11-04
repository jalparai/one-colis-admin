"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { IconPackage } from "@tabler/icons-react"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export function Home() {
  const [totalProducts, setTotalProducts] = useState<number | null>(null)

  useEffect(() => {
    const fetchWarehouseProducts = async () => {
      try {
        const token = localStorage.getItem("token")
        if (!token) return

        const response = await axios.get(
          "https://cod-ecommerce-two.vercel.app/api/warehouse/e/getMyProducts",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        )

        // Use count field from API
        const count = response.data?.data?.count || 0
        setTotalProducts(count)
      } catch (error) {
        console.error("❌ Error fetching warehouse products:", error)
        setTotalProducts(0)
      }
    }

    fetchWarehouseProducts()
  }, [])

  return (
    <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:shadow-xs">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Products</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {totalProducts !== null ? totalProducts : "Loading..."}
          </CardTitle>
        </CardHeader>

        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Products assigned to your warehouse <IconPackage className="size-4" />
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
