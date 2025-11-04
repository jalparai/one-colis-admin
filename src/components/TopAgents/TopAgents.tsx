"use client"

import React, { useEffect, useState } from "react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { TrendingUp } from "lucide-react"
import DownloadTopAgentPdf from "../ReportsPdf/DownloadTopAgentPdf"

interface Agent {
  orders: number
  revenue: number
  agentId: string | null
  agentName: string
  agentEmail: string
}

export default function TopAgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([])

  useEffect(() => {
    const token = localStorage.getItem("token") // or from cookies
    if (!token) return

    fetch("https://cod-ecommerce-two.vercel.app/api/admin/getTopAgents", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((res) => setAgents(res.data))
      .catch((err) => console.error(err))
  }, [])

  if (!agents.length) return <p>Loading...</p>

  // ✅ Prepare chart data
  const chartData = agents.map((agent) => ({
    name: agent.agentName || "Unknown",
    orders: agent.orders,
    revenue: agent.revenue,
  }))

  return (
    <div className="lg:p-6 space-y-6 p-0">
      {/* Title */}
      <div className="flex justify-between">
   <h1 className="text-2xl font-bold">Top Agents</h1>
<DownloadTopAgentPdf />
      </div>
   
      {/* ✅ Cards */}
      <div
        className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card 
        dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 
        *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs 
        @xl/main:grid-cols-2 @5xl/main:grid-cols-4"
      >
        {agents.map((agent, index) => (
          <Card key={index} className="@container/card" data-slot="card">
            <CardHeader>
              <CardDescription>{agent.agentName || "Unknown"}</CardDescription>
              <CardTitle className="text-3xl font-semibold">
                {agent.orders} Orders
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Revenue: PKR {agent.revenue.toLocaleString()}
              </p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                Performing well
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* ✅ Chart */}
      <Card className="bg-gradient-to-t from-[#60A5FA]/5 to-[#34D399]/5 shadow-sm border rounded-2xl">
        <CardHeader>
          <CardTitle>Agents Performance Chart</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="orders" fill="#E0B660" radius={[8, 8, 0, 0]} />
                <Bar dataKey="revenue" fill="#2BC3F1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
