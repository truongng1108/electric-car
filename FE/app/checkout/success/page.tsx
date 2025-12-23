"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { CheckCircle, XCircle, ArrowRight, Package, Loader2 } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { checkoutApi } from "@/lib/api"
import { logger } from "@/lib/logger"
import { getErrorMessage } from "@/lib/error-handler"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [orderStatus, setOrderStatus] = useState<{
    success: boolean
    orderId?: string
    message?: string
  } | null>(null)

  useEffect(() => {
    const handleVnpayReturn = async () => {
      const vnpParams: Record<string, string> = {}
      searchParams.forEach((value, key) => {
        vnpParams[key] = value
      })

      if (Object.keys(vnpParams).length === 0) {
        setOrderStatus({
          success: true,
          message: "Đơn hàng đã được đặt thành công",
        })
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        const response = await checkoutApi.handleVnpayReturn(vnpParams)
        setOrderStatus({
          success: response.paymentStatus === "paid",
          orderId: response.orderId,
          message: response.msg,
        })
      } catch (error) {
        logger.error("Failed to handle VNPay return:", error)
        setOrderStatus({
          success: false,
          message: getErrorMessage(error),
        })
        toast({
          title: "Lỗi",
          description: getErrorMessage(error),
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    handleVnpayReturn()
  }, [searchParams, toast])

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center py-12">
          <div className="container mx-auto px-4 max-w-lg">
            <Card>
              <CardContent className="pt-8 pb-8 text-center space-y-6">
                <div className="flex justify-center">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                </div>
                <p className="text-muted-foreground">Đang xử lý thanh toán...</p>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const isSuccess = orderStatus?.success ?? true

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center py-12">
        <div className="container mx-auto px-4 max-w-lg">
          <Card>
            <CardContent className="pt-8 pb-8 text-center space-y-6">
              <div className="flex justify-center">
                <div
                  className={`h-20 w-20 rounded-full flex items-center justify-center ${
                    isSuccess ? "bg-green-100 dark:bg-green-900/20" : "bg-red-100 dark:bg-red-900/20"
                  }`}
                >
                  {isSuccess ? (
                    <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
                  ) : (
                    <XCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <h1 className="text-2xl font-bold">
                  {isSuccess ? "Đặt hàng thành công!" : "Thanh toán thất bại"}
                </h1>
                <p className="text-muted-foreground">
                  {orderStatus?.message ||
                    (isSuccess
                      ? "Cảm ơn bạn đã đặt hàng. Chúng tôi sẽ liên hệ với bạn trong thời gian sớm nhất."
                      : "Có lỗi xảy ra trong quá trình thanh toán. Vui lòng thử lại.")}
                </p>
              </div>

              {orderStatus?.orderId && (
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Package className="h-4 w-4" />
                    <span>Mã đơn hàng: #{orderStatus.orderId.slice(-8).toUpperCase()}</span>
                  </div>
                  {isSuccess && (
                    <p className="text-sm text-muted-foreground">Email xác nhận đã được gửi đến hộp thư của bạn</p>
                  )}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                {isSuccess && (
                  <Link href="/orders" className="flex-1">
                    <Button variant="outline" className="w-full gap-2 bg-transparent">
                      <Package className="h-4 w-4" />
                      Xem đơn hàng
                    </Button>
                  </Link>
                )}
                <Link href="/products" className="flex-1">
                  <Button className="w-full gap-2">
                    {isSuccess ? "Tiếp tục mua sắm" : "Quay lại"}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
      <Toaster />
    </div>
  )
}
