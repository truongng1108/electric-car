"use client"

import { useState, useEffect, useCallback } from "react"
import { Search, MoreHorizontal, Trash2, Star, Loader2, Eye } from "lucide-react"
import { AdminHeader } from "@/components/admin/admin-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { reviewsApi, productsApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import type { Review, Product } from "@/lib/types"
import { getErrorMessage } from "@/lib/error-handler"
import { formatDate } from "@/lib/date-helpers"

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [products, setProducts] = useState<Record<string, Product>>({})
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedReview, setSelectedReview] = useState<Review | null>(null)
  const { toast } = useToast()

  const fetchReviews = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await reviewsApi.getAll()
      const reviewsList = response.reviews || []
      setReviews(reviewsList)
      
      const productIds = [...new Set(reviewsList.map((review) => {
        return typeof review.product === "string" ? review.product : review.product._id
      }))]
      
      const productPromises = productIds.map(async (id) => {
        try {
          const productResponse = await productsApi.getById(id)
          return { id, product: productResponse.product }
        } catch {
          return null
        }
      })
      
      const productResults = await Promise.all(productPromises)
      const productMap: Record<string, Product> = {}
      productResults.forEach((result) => {
        if (result) {
          productMap[result.id] = result.product
        }
      })
      setProducts(productMap)
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
    void fetchReviews()
  }, [fetchReviews])

  const filteredReviews = reviews.filter((review) => {
    const productId = typeof review.product === "string" ? review.product : review.product._id
    const product = products[productId]
    const productName = product?.name || ""
    const reviewerName = typeof review.user === "string" ? "" : review.user.name || ""
    
    return (
      review.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.comment.toLowerCase().includes(searchQuery.toLowerCase()) ||
      productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reviewerName.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })

  const openDeleteDialog = (review: Review) => {
    setSelectedReview(review)
    setIsDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (selectedReview) {
      try {
        await reviewsApi.delete(selectedReview._id)
        toast({ title: "Xóa đánh giá thành công" })
        setIsDeleteDialogOpen(false)
        void fetchReviews()
      } catch (error) {
        toast({
          title: "Lỗi",
          description: getErrorMessage(error),
          variant: "destructive",
        })
      }
    }
  }

  const getProductName = (review: Review): string => {
    const productId = typeof review.product === "string" ? review.product : review.product._id
    return products[productId]?.name || "Sản phẩm không tồn tại"
  }

  const getReviewerName = (review: Review): string => {
    if (typeof review.user === "string") return "Người dùng"
    return review.user.name || "Người dùng"
  }

  return (
    <>
      <AdminHeader title="Quản lý đánh giá" description={`${reviews.length} đánh giá`} />

      <main className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Tìm kiếm đánh giá..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
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
                    <TableHead>Sản phẩm</TableHead>
                    <TableHead>Người đánh giá</TableHead>
                    <TableHead>Đánh giá</TableHead>
                    <TableHead>Tiêu đề</TableHead>
                    <TableHead>Nội dung</TableHead>
                    <TableHead>Ngày tạo</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReviews.map((review) => (
                    <TableRow key={review._id}>
                      <TableCell>
                        <div className="max-w-xs">
                          <p className="font-medium truncate">{getProductName(review)}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{getReviewerName(review)}</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }, (_, i) => {
                            const starIndex = i + 1
                            const isFilled = starIndex <= review.rating
                            return (
                              <Star
                                key={`review-${review._id}-star-${starIndex}`}
                                className={`h-4 w-4 ${
                                  isFilled ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                                }`}
                              />
                            )
                          })}
                          <span className="ml-1 text-sm">({review.rating})</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <p className="truncate">{review.title}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <p className="truncate text-sm text-muted-foreground">{review.comment}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatDate(review.createdAt)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <a href={`/products/${typeof review.product === "string" ? review.product : review.product._id}`} target="_blank" rel="noreferrer">
                                <Eye className="h-4 w-4 mr-2" />
                                Xem sản phẩm
                              </a>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => openDeleteDialog(review)}>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Xóa
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {!isLoading && filteredReviews.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">Không tìm thấy đánh giá nào</div>
            )}
          </CardContent>
        </Card>
      </main>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa đánh giá "{selectedReview?.title}"? Hành động này không thể hoàn tác.
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

      <Toaster />
    </>
  )
}
