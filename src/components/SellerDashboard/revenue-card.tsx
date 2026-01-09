import { useEffect, useState } from "react"
import axios from "axios"
import { IconTrendingUp, IconArrowUpRight } from "@tabler/icons-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

/* ---------- Types ---------- */

type DateFilter =
  | "today"
  | "yesterday"
  | "this_week"
  | "last_week"
  | "this_month"
  | "last_month"
  | "custom"

interface RevenueCardProps {
  dateFilter: DateFilter
  fromDate?: string | null
  toDate?: string | null
  deliveredOrdersCount?: number
  loading?: boolean
}


interface RevenueTotals {
  revenue: number
  netRevenue: number
  cityFees: number
  profit: number
  orderCount: number
}

interface CityDelivered {
  city: string
  orderCount: number
  totalFees: number
}

interface RevenueResponse {
  totals: RevenueTotals
  citiesDelivered?: CityDelivered[]
}

/* ---------- Component ---------- */

export function RevenueCard({
  dateFilter,
  fromDate,
  toDate,
  deliveredOrdersCount,
  loading = false,
}: RevenueCardProps) {
  const [revenueData, setRevenueData] = useState<RevenueResponse | null>(null)
  const [loadingRevenue, setLoadingRevenue] = useState<boolean>(false)

const getFilterType = (): string => {
  switch (dateFilter) {
    case "today":
      return "today"
    case "yesterday":
      return "yesterday"
    case "this_week":
      return "thisWeek"
    case "last_week":
      return "lastWeek"
    case "this_month":
      return "thisMonth"
    case "last_month":
      return "lastMonth"
    default:
      return "custom"
  }
}


  const fetchRevenueData = async (): Promise<void> => {
    const token = localStorage.getItem("token")
    if (!token) return

    setLoadingRevenue(true)

    try {
      const filterType = getFilterType()
      const params = new URLSearchParams()

      if (filterType !== "custom") {
        params.append("filterType", filterType)
      } else {
        params.append("filterType", "custom")
        if (fromDate) params.append("startDate", fromDate)
        if (toDate) params.append("endDate", toDate)
      }

      params.append("interval", "daily")

      const res = await axios.get<RevenueResponse>(
        `https://cod-ecommerce-two.vercel.app/api/seller/revenue-report?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      setRevenueData(res.data)
    } catch (error) {
      console.error("Error fetching revenue data:", error)
      setRevenueData(null)
    } finally {
      setLoadingRevenue(false)
    }
  }

  useEffect(() => {
    fetchRevenueData()
  }, [dateFilter, fromDate, toDate])

  const totalRevenue = revenueData?.totals?.revenue ?? 0
  const netRevenue = revenueData?.totals?.netRevenue ?? 0
  const cityFees = revenueData?.totals?.cityFees ?? 0
  const profit = revenueData?.totals?.profit ?? 0
  const orderCount = revenueData?.totals?.orderCount ?? 0

  const ProgressBar = ({ value }: { value: number }) => (
    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
      <div
        className="h-2 rounded-full transition-all"
        style={{
          width: `${Math.max(0, Math.min(100, value))}%`,
          background: "linear-gradient(90deg,#60a5fa,#34d399)",
        }}
      />
    </div>
  )

  return (
    <Card className="hover:shadow-lg transition-all duration-200 h-full">
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Total Revenue</CardTitle>
        <IconTrendingUp className="text-green-500 h-6 w-6" />
      </CardHeader>

      <CardContent className="flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-baseline justify-between">
            <div className="text-3xl font-semibold">
              {loading || loadingRevenue
                ? "..."
                : totalRevenue.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
              DH
            </div>

            <div className="text-sm text-muted-foreground text-right">
              <div>{`${orderCount} delivered`}</div>

              <div className="text-xs mt-1">
                {loadingRevenue
                  ? "..."
                  : `Net: ${netRevenue.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })} DH`}
              </div>

              {cityFees > 0 && (
                <div className="text-xs mt-1 text-orange-600">
                  City Fees:{" "}
                  {cityFees.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  DH
                </div>
              )}
            </div>
          </div>

          <div className="mt-3 text-sm text-muted-foreground flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IconArrowUpRight className="h-4 w-4 text-green-500" />
              <span>{`${profit.toFixed(2)} DH profit`}</span>
            </div>
            <div className="text-xs">Revenue</div>
          </div>

          {revenueData?.citiesDelivered &&
            revenueData.citiesDelivered.length > 0 && (
              <div className="mt-4 pt-3 border-t">
                <div className="text-xs font-semibold mb-2">
                  Cities Delivered:
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {revenueData.citiesDelivered.slice(0, 4).map((city, idx) => (
                    <div key={idx} className="text-xs">
                      <div className="font-medium">{city.city}</div>
                      <div className="text-muted-foreground">
                        {city.orderCount} orders •{" "}
                        {city.totalFees.toFixed(2)} DH
                      </div>
                    </div>
                  ))}
                </div>

                {revenueData.citiesDelivered.length > 4 && (
                  <div className="text-xs text-muted-foreground mt-2">
                    +{revenueData.citiesDelivered.length - 4} more cities
                  </div>
                )}
              </div>
            )}
        </div>

        <div className="mt-3">
          <ProgressBar value={totalRevenue % 100} />
        </div>
      </CardContent>
    </Card>
  )
}
