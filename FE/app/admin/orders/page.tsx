"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { Search, MoreHorizontal, Eye, Trash2, Package, Truck, CheckCircle, XCircle, Clock, Loader2, Plus } from "lucide-react"
import { AdminHeader } from "@/components/admin/admin-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { ordersApi, productsApi, usersApi, discountsApi } from "@/lib/api"
import type { Order, Product, User, Discount } from "@/lib/types"
import { formatCurrency, getStatusLabel, getPaymentStatusLabel } from "@/lib/utils"
import { formatDate } from "@/lib/date-helpers"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { getErrorMessage } from "@/lib/error-handler"
import { getProductName, getProductImage } from "@/lib/product-helpers"

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

const statusIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  pending: Clock,
  confirmed: Package,
  shipping: Truck,
  delivered: CheckCircle,
  cancelled: XCircle,
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [discounts, setDiscounts] = useState<Discount[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [orderForm, setOrderForm] = useState({
    userId: "",
    userName: "",
    userEmail: "",
    userPhone: "",
    shippingAddress: "",
    discountCode: "",
    status: "confirmed" as Order["status"],
    paymentStatus: "paid" as Order["paymentStatus"],
    paymentMethod: "OFFLINE",
    items: [] as Array<{ productId: string; quantity: number; color: string }>,
  })
  const [newItem, setNewItem] = useState({ productId: "", quantity: 1, color: "" })
  const { toast } = useToast()

  const fetchOrders = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await ordersApi.getAll()
      setOrders(response.orders)
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

  const fetchProducts = useCallback(async () => {
    try {
      const response = await productsApi.getAllAdmin()
      setProducts(response.products)
    } catch (error) {
      toast({
        title: "Lỗi",
        description: getErrorMessage(error),
        variant: "destructive",
      })
    }
  }, [toast])

  const fetchUsers = useCallback(async () => {
    try {
      const response = await usersApi.getAll()
      setUsers(response.users)
    } catch (error) {
      toast({
        title: "Lỗi",
        description: getErrorMessage(error),
        variant: "destructive",
      })
    }
  }, [toast])

  const fetchDiscounts = useCallback(async () => {
    try {
      const response = await discountsApi.getAll()
      setDiscounts(response.discounts.filter((d) => d.isActive))
    } catch (error) {
      toast({
        title: "Lỗi",
        description: getErrorMessage(error),
        variant: "destructive",
      })
    }
  }, [toast])

  useEffect(() => {
    void fetchOrders()
    void fetchProducts()
    void fetchUsers()
    void fetchDiscounts()
  }, [fetchOrders, fetchProducts, fetchUsers, fetchDiscounts])

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order._id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.userEmail.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = filterStatus === "all" || order.status === filterStatus

    return matchesSearch && matchesStatus
  })

  const openViewDialog = (order: Order) => {
    setSelectedOrder(order)
    setIsViewDialogOpen(true)
  }

  const openDeleteDialog = (order: Order) => {
    setSelectedOrder(order)
    setIsDeleteDialogOpen(true)
  }

  const updateOrderStatus = async (orderId: string, newStatus: Order["status"]) => {
    try {
      await ordersApi.update(orderId, { status: newStatus })
      setOrders((prev) => prev.map((order) => (order._id === orderId ? { ...order, status: newStatus } : order)))
      toast({ title: `Đã cập nhật trạng thái đơn hàng thành "${getStatusLabel(newStatus)}"` })
    } catch (error) {
      toast({
        title: "Lỗi",
        description: getErrorMessage(error),
        variant: "destructive",
      })
    }
  }

  const handleDelete = async () => {
    if (selectedOrder) {
      try {
        await ordersApi.delete(selectedOrder._id)
        setOrders((prev) => prev.filter((o) => o._id !== selectedOrder._id))
        toast({ title: "Xóa đơn hàng thành công" })
        setIsDeleteDialogOpen(false)
      } catch (error) {
        toast({
          title: "Lỗi",
          description: getErrorMessage(error),
          variant: "destructive",
        })
      }
    }
  }

  const openCreateDialog = () => {
    setOrderForm({
      userId: "",
      userName: "",
      userEmail: "",
      userPhone: "",
      shippingAddress: "",
      discountCode: "",
      status: "confirmed",
      paymentStatus: "paid",
      paymentMethod: "OFFLINE",
      items: [],
    })
    setNewItem({ productId: "", quantity: 1, color: "" })
    setIsCreateDialogOpen(true)
  }

  const addItemToOrder = () => {
    if (!newItem.productId || !newItem.color) {
      toast({
        title: "Vui lòng chọn sản phẩm và màu sắc",
        variant: "destructive",
      })
      return
    }
    setOrderForm((prev) => ({
      ...prev,
      items: [...prev.items, { ...newItem }],
    }))
    setNewItem({ productId: "", quantity: 1, color: "" })
  }

  const removeItemFromOrder = (index: number) => {
    setOrderForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }))
  }

  const handleCreateOrder = async () => {
    if (!orderForm.userName || !orderForm.userEmail || !orderForm.shippingAddress) {
      toast({
        title: "Vui lòng điền đầy đủ thông tin khách hàng",
        variant: "destructive",
      })
      return
    }

    if (orderForm.items.length === 0) {
      toast({
        title: "Vui lòng thêm ít nhất một sản phẩm",
        variant: "destructive",
      })
      return
    }

    try {
      setIsCreating(true)
      await ordersApi.createOfflineAdmin({
        items: orderForm.items,
        discountCode: orderForm.discountCode || undefined,
        userId: orderForm.userId || undefined,
        userName: orderForm.userName,
        userEmail: orderForm.userEmail,
        userPhone: orderForm.userPhone || undefined,
        shippingAddress: orderForm.shippingAddress,
        paymentStatus: orderForm.paymentStatus,
        status: orderForm.status,
        paymentMethod: orderForm.paymentMethod,
      })
      toast({ title: "Tạo đơn hàng thành công" })
      setIsCreateDialogOpen(false)
      void fetchOrders()
    } catch (error) {
      toast({
        title: "Lỗi",
        description: getErrorMessage(error),
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const selectedProduct = products.find((p) => p._id === newItem.productId)

  const orderCounts = {
    all: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    confirmed: orders.filter((o) => o.status === "confirmed").length,
    shipping: orders.filter((o) => o.status === "shipping").length,
    delivered: orders.filter((o) => o.status === "delivered").length,
    cancelled: orders.filter((o) => o.status === "cancelled").length,
  }

  return (
    <>
      <AdminHeader title="Quản lý đơn hàng" description={`${orders.length} đơn hàng`} />

      <main className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex flex-col gap-4 flex-1">
            <Tabs value={filterStatus} onValueChange={setFilterStatus}>
            <TabsList className="h-auto flex-wrap">
              <TabsTrigger value="all" className="gap-2">
                Tất cả <Badge variant="secondary">{orderCounts.all}</Badge>
              </TabsTrigger>
              <TabsTrigger value="pending" className="gap-2">
                Chờ xác nhận <Badge variant="secondary">{orderCounts.pending}</Badge>
              </TabsTrigger>
              <TabsTrigger value="confirmed" className="gap-2">
                Đã xác nhận <Badge variant="secondary">{orderCounts.confirmed}</Badge>
              </TabsTrigger>
              <TabsTrigger value="shipping" className="gap-2">
                Đang giao <Badge variant="secondary">{orderCounts.shipping}</Badge>
              </TabsTrigger>
              <TabsTrigger value="delivered" className="gap-2">
                Đã giao <Badge variant="secondary">{orderCounts.delivered}</Badge>
              </TabsTrigger>
              <TabsTrigger value="cancelled" className="gap-2">
                Đã hủy <Badge variant="secondary">{orderCounts.cancelled}</Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Tìm kiếm đơn hàng..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
          <Button onClick={openCreateDialog} className="gap-2">
            <Plus className="h-4 w-4" />
            Tạo đơn hàng offline
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã đơn</TableHead>
                    <TableHead>Khách hàng</TableHead>
                    <TableHead>Sản phẩm</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Thanh toán</TableHead>
                    <TableHead className="text-right">Tổng tiền</TableHead>
                    <TableHead>Ngày đặt</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => {
                    const StatusIcon = statusIcons[order.status]
                    return (
                      <TableRow key={order._id}>
                        <TableCell className="font-medium">{order._id.slice(-8).toUpperCase()}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{order.userName}</p>
                            <p className="text-sm text-muted-foreground">{order.userPhone || order.userEmail}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {order.orderItems.slice(0, 2).map((item, index) => {
                              const productId = typeof item.product === "string" ? item.product : item.product._id
                              return (
                                <Badge key={`${order._id}-${productId}-${index}-${item.color}`} variant="outline" className="text-xs">
                                  {getProductName(item).length > 15
                                    ? getProductName(item).substring(0, 15) + "..."
                                    : getProductName(item)}
                                </Badge>
                              )
                            })}
                            {order.orderItems.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{order.orderItems.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={order.status}
                            onValueChange={(value) => updateOrderStatus(order._id, value as Order["status"])}
                          >
                            <SelectTrigger className="w-36 h-8">
                              <div className="flex items-center gap-2">
                                <StatusIcon className="h-4 w-4" />
                                <SelectValue />
                              </div>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Chờ xác nhận</SelectItem>
                              <SelectItem value="confirmed">Đã xác nhận</SelectItem>
                              <SelectItem value="shipping">Đang giao</SelectItem>
                              <SelectItem value="delivered">Đã giao</SelectItem>
                              <SelectItem value="cancelled">Đã hủy</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Badge className={paymentStatusColors[order.paymentStatus]}>
                            {getPaymentStatusLabel(order.paymentStatus)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold">{formatCurrency(order.finalTotal)}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(order.createdAt)}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openViewDialog(order)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Chi tiết
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onClick={() => openDeleteDialog(order)}>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Xóa
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}

            {!isLoading && filteredOrders.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">Không tìm thấy đơn hàng nào</div>
            )}
          </CardContent>
        </Card>
      </main>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết đơn hàng {selectedOrder?._id.slice(-8).toUpperCase()}</DialogTitle>
            <DialogDescription>
              Ngày đặt: {formatDate(selectedOrder?.createdAt)}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Badge className={statusColors[selectedOrder.status]}>{getStatusLabel(selectedOrder.status)}</Badge>
                <Badge className={paymentStatusColors[selectedOrder.paymentStatus]}>
                  {getPaymentStatusLabel(selectedOrder.paymentStatus)}
                </Badge>
              </div>

              <Separator />

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Thông tin khách hàng</h4>
                  <div className="text-sm space-y-1 text-muted-foreground">
                    <p>
                      <span className="text-foreground">{selectedOrder.userName}</span>
                    </p>
                    <p>{selectedOrder.userEmail}</p>
                    <p>{selectedOrder.userPhone}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Địa chỉ giao hàng</h4>
                  <p className="text-sm text-muted-foreground">{selectedOrder.shippingAddress}</p>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-3">Sản phẩm</h4>
                <div className="space-y-3">
                  {selectedOrder.orderItems.map((item, index) => {
                    const productId = typeof item.product === "string" ? item.product : item.product._id
                    return (
                      <div key={`${selectedOrder._id}-${productId}-${index}-${item.color}`} className="flex items-center gap-3">
                      <div className="relative h-12 w-12 rounded-lg overflow-hidden bg-muted shrink-0">
                        <img
                          src={getProductImage(item)}
                          alt={getProductName(item)}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{getProductName(item)}</p>
                        <p className="text-sm text-muted-foreground">
                          Màu: {item.color} | SL: {item.quantity}
                        </p>
                      </div>
                      <p className="font-medium shrink-0">{formatCurrency(item.price * item.quantity)}</p>
                    </div>
                    )
                  })}
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tạm tính</span>
                  <span>{formatCurrency(selectedOrder.subtotal)}</span>
                </div>
                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                    <span>Giảm giá</span>
                    <span>-{formatCurrency(selectedOrder.discount)}</span>
                  </div>
                )}
                {selectedOrder.shippingFee > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Phí vận chuyển</span>
                    <span>{formatCurrency(selectedOrder.shippingFee)}</span>
                  </div>
                )}
                {selectedOrder.tax > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Thuế</span>
                    <span>{formatCurrency(selectedOrder.tax)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                  <span>Tổng cộng</span>
                  <span className="text-primary">{formatCurrency(selectedOrder.finalTotal)}</span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa đơn hàng "{selectedOrder?._id.slice(-8).toUpperCase()}"? Hành động này không
              thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tạo đơn hàng offline</DialogTitle>
            <DialogDescription>Tạo đơn hàng trực tiếp cho khách hàng</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="user-select">Chọn người dùng (tùy chọn)</Label>
                <Select
                  value={orderForm.userId}
                  onValueChange={(value) => {
                    const user = users.find((u) => u._id === value)
                    setOrderForm((prev) => ({
                      ...prev,
                      userId: value,
                      userName: user?.name || prev.userName,
                      userEmail: user?.email || prev.userEmail,
                      userPhone: user?.phone || prev.userPhone,
                      shippingAddress: user?.address || prev.shippingAddress,
                    }))
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn người dùng" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Không chọn</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user._id || user.userId} value={user._id || user.userId || ""}>
                        {user.name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="discount-code">Mã giảm giá (tùy chọn)</Label>
                <Select value={orderForm.discountCode} onValueChange={(value) => setOrderForm((prev) => ({ ...prev, discountCode: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn mã giảm giá" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Không sử dụng</SelectItem>
                    {discounts.map((discount) => (
                      <SelectItem key={discount._id} value={discount.code}>
                        {discount.code} ({discount.discountType === "percent" ? `${discount.discountValue}%` : formatCurrency(discount.discountValue)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="user-name">Tên khách hàng *</Label>
                <Input
                  id="user-name"
                  value={orderForm.userName}
                  onChange={(e) => setOrderForm((prev) => ({ ...prev, userName: e.target.value }))}
                  placeholder="Nhập tên khách hàng"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="user-email">Email *</Label>
                <Input
                  id="user-email"
                  type="email"
                  value={orderForm.userEmail}
                  onChange={(e) => setOrderForm((prev) => ({ ...prev, userEmail: e.target.value }))}
                  placeholder="Nhập email"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="user-phone">Số điện thoại</Label>
                <Input
                  id="user-phone"
                  type="tel"
                  value={orderForm.userPhone}
                  onChange={(e) => setOrderForm((prev) => ({ ...prev, userPhone: e.target.value }))}
                  placeholder="Nhập số điện thoại"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="shipping-address">Địa chỉ giao hàng *</Label>
                <Input
                  id="shipping-address"
                  value={orderForm.shippingAddress}
                  onChange={(e) => setOrderForm((prev) => ({ ...prev, shippingAddress: e.target.value }))}
                  placeholder="Nhập địa chỉ giao hàng"
                />
              </div>
            </div>

            <Separator />

            <div>
              <Label className="mb-3 block">Sản phẩm</Label>
              <div className="space-y-3">
                {orderForm.items.map((item, index) => {
                  const product = products.find((p) => p._id === item.productId)
                  return (
                    <div key={`order-item-${item.productId}-${item.color}-${index}`} className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{product?.name || "Sản phẩm không tồn tại"}</p>
                        <p className="text-sm text-muted-foreground">
                          Màu: {item.color} | Số lượng: {item.quantity}
                        </p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => removeItemFromOrder(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )
                })}

                <div className="grid gap-3 p-3 border rounded-lg">
                  <div className="grid gap-2 sm:grid-cols-3">
                    <div className="grid gap-2">
                      <Label>Sản phẩm</Label>
                      <Select value={newItem.productId} onValueChange={(value) => setNewItem((prev) => ({ ...prev, productId: value, color: "" }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn sản phẩm" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product._id} value={product._id}>
                              {product.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {selectedProduct && (
                      <div className="grid gap-2">
                        <Label>Màu sắc</Label>
                        <Select value={newItem.color} onValueChange={(value) => setNewItem((prev) => ({ ...prev, color: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn màu" />
                          </SelectTrigger>
                          <SelectContent>
                            {selectedProduct.colors.map((color) => (
                              <SelectItem key={color.name} value={color.name}>
                                {color.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <div className="grid gap-2">
                      <Label>Số lượng</Label>
                      <Input
                        type="number"
                        min={1}
                        max={selectedProduct?.stock || 1}
                        value={newItem.quantity}
                        onChange={(e) => setNewItem((prev) => ({ ...prev, quantity: Number(e.target.value) }))}
                      />
                    </div>
                  </div>
                  <Button onClick={addItemToOrder} disabled={!newItem.productId || !newItem.color} className="w-full">
                    Thêm sản phẩm
                  </Button>
                </div>
              </div>
            </div>

            <Separator />

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="grid gap-2">
                <Label htmlFor="status">Trạng thái</Label>
                <Select
                  value={orderForm.status}
                  onValueChange={(value) => setOrderForm((prev) => ({ ...prev, status: value as Order["status"] }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Chờ xác nhận</SelectItem>
                    <SelectItem value="confirmed">Đã xác nhận</SelectItem>
                    <SelectItem value="shipping">Đang giao</SelectItem>
                    <SelectItem value="delivered">Đã giao</SelectItem>
                    <SelectItem value="cancelled">Đã hủy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="payment-status">Trạng thái thanh toán</Label>
                <Select
                  value={orderForm.paymentStatus}
                  onValueChange={(value) => setOrderForm((prev) => ({ ...prev, paymentStatus: value as Order["paymentStatus"] }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Chờ thanh toán</SelectItem>
                    <SelectItem value="paid">Đã thanh toán</SelectItem>
                    <SelectItem value="failed">Thất bại</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="payment-method">Phương thức thanh toán</Label>
                <Input
                  id="payment-method"
                  value={orderForm.paymentMethod}
                  onChange={(e) => setOrderForm((prev) => ({ ...prev, paymentMethod: e.target.value }))}
                  placeholder="VD: OFFLINE, TIỀN MẶT"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleCreateOrder} disabled={isCreating}>
              {isCreating ? "Đang tạo..." : "Tạo đơn hàng"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster />
    </>
  )
}
