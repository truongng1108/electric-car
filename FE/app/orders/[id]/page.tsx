"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Package, MapPin, Phone, Mail, Loader2 } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ordersApi } from "@/lib/api"
import { formatCurrency, getStatusLabel, getPaymentStatusLabel } from "@/lib/utils"
import { formatDate } from "@/lib/date-helpers"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { getErrorMessage } from "@/lib/error-handler"
import { getProductName, getProductImage } from "@/lib/product-helpers"
import type { Order } from "@/lib/types"
import Image from "next/image"

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
  confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
  shipping: "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400",
  delivered: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
}

const paymentStatusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
  paid: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
  failed: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
}

interface OrderDetailPageProps {
  readonly params: Promise<{ id: string }>
}

export default function OrderDetailPage({ params }: OrderDetailPageProps) {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const { toast } = useToast()
  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login")
      return
    }

    const fetchOrder = async () => {
      try {
        setIsLoading(true)
        const resolvedParams = await params
        const response = await ordersApi.getById(resolvedParams.id)
        setOrder(response.order)
      } catch (error) {
        toast({
          title: "Lỗi",
          description: getErrorMessage(error),
          variant: "destructive",
        })
        router.push("/orders")
      } finally {
        setIsLoading(false)
      }
    }

    if (isAuthenticated) {
      void fetchOrder()
    }
  }, [params, isAuthenticated, authLoading, router, toast])

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </main>
        <Footer />
      </div>
    )
  }

  if (!order) {
    return null
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-muted/30">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="mb-6">
            <Link href="/orders">
              <Button variant="ghost" className="gap-2 mb-4">
                <ArrowLeft className="h-4 w-4" />
                Quay lại danh sách đơn hàng
              </Button>
            </Link>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-3xl font-bold">Chi tiết đơn hàng</h1>
                <p className="text-muted-foreground mt-1">
                  Mã đơn: {order._id.slice(-8).toUpperCase()} | Ngày đặt: {formatDate(order.createdAt)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={statusColors[order.status]}>{getStatusLabel(order.status)}</Badge>
                <Badge className={paymentStatusColors[order.paymentStatus]}>
                  {getPaymentStatusLabel(order.paymentStatus)}
                </Badge>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Sản phẩm
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {order.orderItems.map((item, index) => {
                      const productName = getProductName(item)
                      const productImage = getProductImage(item)
                      return (
                        <div key={`${order._id}-${index}`} className="flex gap-4 pb-4 border-b last:border-0 last:pb-0">
                          <div className="relative h-20 w-20 rounded-lg overflow-hidden bg-muted shrink-0">
                            <Image src={productImage} alt={productName} fill className="object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium mb-1">{productName}</h3>
                            <p className="text-sm text-muted-foreground mb-2">
                              Màu: {item.color} | Số lượng: {item.quantity}
                            </p>
                            <p className="font-semibold text-primary">{formatCurrency(item.price * item.quantity)}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Thông tin giao hàng
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Người nhận</p>
                    <p className="font-medium">{order.userName}</p>
                  </div>
                  {order.userEmail && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        Email
                      </p>
                      <p className="font-medium">{order.userEmail}</p>
                    </div>
                  )}
                  {order.userPhone && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        Số điện thoại
                      </p>
                      <p className="font-medium">{order.userPhone}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Địa chỉ giao hàng</p>
                    <p className="font-medium">{order.shippingAddress}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Thông tin thanh toán</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tạm tính</span>
                    <span>{formatCurrency(order.subtotal)}</span>
                  </div>
                  {order.discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                      <span>Giảm giá</span>
                      <span>-{formatCurrency(order.discount)}</span>
                    </div>
                  )}
                  {order.shippingFee > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Phí vận chuyển</span>
                      <span>{formatCurrency(order.shippingFee)}</span>
                    </div>
                  )}
                  {order.tax > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Thuế</span>
                      <span>{formatCurrency(order.tax)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Tổng cộng</span>
                    <span className="text-primary">{formatCurrency(order.finalTotal)}</span>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Phương thức thanh toán</span>
                      <span className="font-medium">{order.paymentMethod || "VNPAY"}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <Toaster />
    </>
  )
}
