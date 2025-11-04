"use client"

import * as React from "react"
import axios from "axios"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export function DeliveryCollectionTable() {
  const [statusSummary, setStatusSummary] = React.useState<any>({})
  const [collection, setCollection] = React.useState<any>({})
  const [loading, setLoading] = React.useState(true)

  const fetchStats = React.useCallback(async () => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
      const res = await axios.get(
        "https://cod-ecommerce-two.vercel.app/api/seller/stats/delivery-collection",
        { headers: { Authorization: `Bearer ${token}` } }
      )

      setStatusSummary(res.data?.data?.statusSummary || {})
      setCollection(res.data?.data?.collection || {})
    } catch (err) {
      console.error("❌ Error fetching delivery/collection stats:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchStats()
  }, [fetchStats])

  if (loading) return <p className="p-4">Loading delivery & collection stats...</p>

  return (
    <div className="w-full space-y-6">
      {/* Delivery Status Table */}
      <Card>
        <CardHeader>
          <CardTitle>Delivery Status Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Count</TableHead>
                <TableHead>Total Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(statusSummary).map(([status, values]: any) => (
                <TableRow key={status}>
                  <TableCell className="capitalize">{status}</TableCell>
                  <TableCell>{values.count}</TableCell>
                  <TableCell>${values.totalAmount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Collection Info */}
      {/* <Card>
        <CardHeader>
          <CardTitle>Collection Info</CardTitle>
        </CardHeader>
        <CardContent>
          <p><strong>Supported:</strong> {collection.supported ? "Yes" : "No"}</p>
          <p><strong>Message:</strong> {collection.message}</p>
        </CardContent>
      </Card> */}
    </div>
  )
}
