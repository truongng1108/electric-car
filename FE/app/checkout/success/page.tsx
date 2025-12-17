import Link from "next/link"
import { CheckCircle, ArrowRight, Package } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center py-12">
        <div className="container mx-auto px-4 max-w-lg">
          <Card>
            <CardContent className="pt-8 pb-8 text-center space-y-6">
              <div className="flex justify-center">
                <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="h-10 w-10 text-green-600" />
                </div>
              </div>

              <div className="space-y-2">
                <h1 className="text-2xl font-bold">Đặt hàng thành công!</h1>
                <p className="text-muted-foreground">
                  Cảm ơn bạn đã đặt hàng. Chúng tôi sẽ liên hệ với bạn trong thời gian sớm nhất.
                </p>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Package className="h-4 w-4" />
                  <span>Mã đơn hàng: #ORD{Date.now().toString().slice(-6)}</span>
                </div>
                <p className="text-sm text-muted-foreground">Email xác nhận đã được gửi đến hộp thư của bạn</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Link href="/orders" className="flex-1">
                  <Button variant="outline" className="w-full gap-2 bg-transparent">
                    <Package className="h-4 w-4" />
                    Xem đơn hàng
                  </Button>
                </Link>
                <Link href="/products" className="flex-1">
                  <Button className="w-full gap-2">
                    Tiếp tục mua sắm
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}
