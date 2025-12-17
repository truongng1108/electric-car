import Link from "next/link"
import { Package, ChevronRight } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { orders, formatCurrency, getStatusLabel, getPaymentStatusLabel } from "@/lib/mock-data"

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  shipping: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
}

export default function OrdersPage() {
  // In a real app, this would filter orders by logged-in user
  const userOrders = orders.filter((order) => order.userId === "2")

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold tracking-tight mb-8">Lịch sử đơn hàng</h1>

          {userOrders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">Chưa có đơn hàng nào</h2>
              <p className="text-muted-foreground mb-4">Bạn chưa có đơn hàng nào. Hãy bắt đầu mua sắm ngay!</p>
              <Link href="/products">
                <Badge variant="default" className="cursor-pointer">
                  Mua sắm ngay
                </Badge>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {userOrders.map((order) => (
                <Card key={order.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold">{order.id}</h3>
                          <Badge className={statusColors[order.status]}>{getStatusLabel(order.status)}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Ngày đặt: {new Date(order.createdAt).toLocaleDateString("vi-VN")}
                        </p>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-semibold text-primary">{formatCurrency(order.finalTotal)}</p>
                          <p className="text-sm text-muted-foreground">{getPaymentStatusLabel(order.paymentStatus)}</p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t">
                      <div className="flex flex-wrap gap-2">
                        {order.items.map((item, index) => (
                          <Badge key={index} variant="secondary">
                            {item.productName} ({item.color}) x{item.quantity}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
