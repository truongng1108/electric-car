"use client"

import { useState, useEffect, useCallback } from "react"
import { Package, ShoppingCart, Users, DollarSign, TrendingUp, TrendingDown, ArrowUpRight, Loader2 } from "lucide-react"
import { AdminHeader } from "@/components/admin/admin-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ordersApi, productsApi, usersApi } from "@/lib/api"
import { formatCurrency, getStatusLabel } from "@/lib/utils"
import { getErrorMessage } from "@/lib/error-handler"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import type { Order, Product, User } from "@/lib/types"

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
  confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
  shipping: "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400",
  delivered: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
}

export default function AdminDashboardPage() {
  const { toast } = useToast()
  const [orders, setOrders] = useState<Order[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)
      const [ordersResponse, productsResponse, usersResponse] = await Promise.all([
        ordersApi.getAll(),
        productsApi.getAllAdmin(),
        usersApi.getAll(),
      ])
      setOrders(ordersResponse.orders)
      setProducts(productsResponse.products)
      setUsers(usersResponse.users)
    } catch (error) {
      toast({
        title: "Lỗi",
        description: getErrorMessage(error),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  const totalRevenue = orders.reduce((sum, order) => sum + order.finalTotal, 0)
  const recentOrders = orders.slice(0, 5).sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
    return dateB - dateA
  })

  const topProducts = products
    .map((product) => {
      const productOrders = orders.filter((order) =>
        order.orderItems.some((item) => {
          const productId = typeof item.product === "string" ? item.product : item.product._id
          return productId === product._id
        }),
      )
      const totalSold = productOrders.reduce((sum, order) => {
        const item = order.orderItems.find((item) => {
          const productId = typeof item.product === "string" ? item.product : item.product._id
          return productId === product._id
        })
        return sum + (item ? item.quantity : 0)
      }, 0)
      return { product, totalSold }
    })
    .sort((a, b) => b.totalSold - a.totalSold)
    .slice(0, 5)
    .map((item) => item.product)

  const stats = [
    {
      name: "Tổng doanh thu",
      value: formatCurrency(totalRevenue),
      change: "+12.5%",
      trend: "up" as const,
      icon: DollarSign,
    },
    {
      name: "Đơn hàng",
      value: orders.length.toString(),
      change: "+8.2%",
      trend: "up" as const,
      icon: ShoppingCart,
    },
    {
      name: "Sản phẩm",
      value: products.length.toString(),
      change: "+2",
      trend: "up" as const,
      icon: Package,
    },
    {
      name: "Người dùng",
      value: users.filter((u) => u.role === "user").length.toString(),
      change: "+5.1%",
      trend: "up" as const,
      icon: Users,
    },
  ]

  if (isLoading) {
    return (
      <>
        <AdminHeader title="Dashboard" description="Tổng quan hệ thống" />
        <main className="p-6 flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </main>
      </>
    )
  }

  return (
    <>
      <AdminHeader title="Dashboard" description="Tổng quan hệ thống" />
      <main className="p-6 space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.name}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <stat.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div
                    className={`flex items-center gap-1 text-sm font-medium ${
                      stat.trend === "up" ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {stat.change}
                    {stat.trend === "up" ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.name}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Đơn hàng gần đây</CardTitle>
              <a href="/admin/orders" className="text-sm text-primary hover:underline flex items-center gap-1">
                Xem tất cả
                <ArrowUpRight className="h-4 w-4" />
              </a>
            </CardHeader>
            <CardContent>
              {recentOrders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">Chưa có đơn hàng nào</div>
              ) : (
                <div className="space-y-4">
                  {recentOrders.map((order) => (
                    <div key={order._id} className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{order._id.slice(-8).toUpperCase()}</p>
                          <Badge className={statusColors[order.status]} variant="secondary">
                            {getStatusLabel(order.status)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{order.userName}</p>
                      </div>
                      <p className="font-semibold">{formatCurrency(order.finalTotal)}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Sản phẩm bán chạy</CardTitle>
              <a href="/admin/products" className="text-sm text-primary hover:underline flex items-center gap-1">
                Xem tất cả
                <ArrowUpRight className="h-4 w-4" />
              </a>
            </CardHeader>
            <CardContent>
              {topProducts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">Chưa có sản phẩm nào</div>
              ) : (
                <div className="space-y-4">
                  {topProducts.map((product, index) => (
                    <div key={product._id} className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted font-semibold">
                        #{index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{product.name}</p>
                        <p className="text-sm text-muted-foreground">Còn {product.stock} xe</p>
                      </div>
                      <p className="font-semibold text-primary">{formatCurrency(product.price)}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Toaster />
    </>
  )
}
