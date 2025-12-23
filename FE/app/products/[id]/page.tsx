"use client"

import { useState, useEffect, use, useMemo } from "react"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft, Star, Minus, Plus, ShoppingCart, Check, Truck, Shield, RotateCcw, MessageSquare, Pencil } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { productsApi, reviewsApi } from "@/lib/api"
import { formatCurrency, getProductImageUrl } from "@/lib/utils"
import { formatDate } from "@/lib/date-helpers"
import { getErrorMessage } from "@/lib/error-handler"
import { logger } from "@/lib/logger"
import { hasDiscount, calculateDiscountPercent } from "@/lib/product-helpers"
import type { Product, Review } from "@/lib/types"
import { useCart } from "@/lib/cart-context"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"

interface ProductPageProps {
  readonly params: Promise<{ id: string }>
}

export default function ProductPage({ params }: ProductPageProps) {
  const resolvedParams = use(params)
  const [product, setProduct] = useState<Product | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingReviews, setIsLoadingReviews] = useState(false)
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null)
  const [selectedColor, setSelectedColor] = useState<{ name: string; hex: string; image?: string } | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    title: "",
    comment: "",
  })
  const [editingReview, setEditingReview] = useState<Review | null>(null)
  const [isEditingReview, setIsEditingReview] = useState(false)
  const { addItem } = useCart()
  const { isAuthenticated, user } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setIsLoading(true)
        const response = await productsApi.getById(resolvedParams.id)
        const productData = response.product
        setProduct(productData)
        
        if (productData.colors && productData.colors.length > 0) {
          const firstColor = productData.colors[0]
          setSelectedColor({
            name: firstColor.name,
            hex: firstColor.hex,
            image: firstColor.image || undefined,
          })
          setSelectedImageIndex(null)
        } else {
          setSelectedColor(null)
        }
      } catch {
        notFound()
      } finally {
        setIsLoading(false)
      }
    }

    void fetchProduct()
  }, [resolvedParams.id])

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setIsLoadingReviews(true)
        const response = await productsApi.getReviews(resolvedParams.id)
        setReviews(response.reviews)
      } catch (error) {
        logger.error("Failed to fetch reviews:", error)
      } finally {
        setIsLoadingReviews(false)
      }
    }

    void fetchReviews()
  }, [resolvedParams.id])

  const allThumbnailImages = useMemo(() => {
    if (!product) {
      return ["/placeholder.svg"]
    }

    const productImages = Array.isArray(product.images) ? product.images.filter((img) => img && img.trim() !== "") : []
    const uniqueImages = new Set<string>(productImages)
    
    if (product.colors && Array.isArray(product.colors)) {
      product.colors.forEach((color) => {
        if (color.image && color.image.trim() !== "") {
          uniqueImages.add(color.image.trim())
        }
      })
    }

    const imagesArray = Array.from(uniqueImages)
    return imagesArray.length > 0 ? imagesArray : ["/placeholder.svg"]
  }, [product])

  const previewImage = useMemo(() => {
    if (!product) {
      return "/placeholder.svg"
    }

    if (selectedColor?.image && selectedColor.image.trim() !== "") {
      return selectedColor.image.trim()
    }

    if (selectedImageIndex !== null && allThumbnailImages[selectedImageIndex]) {
      return allThumbnailImages[selectedImageIndex]
    }

    return allThumbnailImages[0] || "/placeholder.svg"
  }, [product, selectedColor, selectedImageIndex, allThumbnailImages])

  const userReview = reviews.find((review) => {
    const userId = typeof review.user === "string" ? review.user : review.user._id
    return user && (user._id === userId || user.userId === userId)
  })
  const hasUserReviewed = !!userReview

  const handleSubmitReview = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Vui lòng đăng nhập",
        description: "Bạn cần đăng nhập để viết đánh giá",
        variant: "destructive",
      })
      return
    }

    if (!reviewForm.title || !reviewForm.comment) {
      toast({
        title: "Vui lòng điền đầy đủ thông tin",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmittingReview(true)
      if (editingReview) {
        await reviewsApi.update(editingReview._id, {
          rating: reviewForm.rating,
          title: reviewForm.title,
          comment: reviewForm.comment,
        })
        toast({ title: "Đánh giá đã được cập nhật thành công" })
      } else {
        await reviewsApi.create({
          product: resolvedParams.id,
          rating: reviewForm.rating,
          title: reviewForm.title,
          comment: reviewForm.comment,
        })
        toast({ title: "Đánh giá đã được gửi thành công" })
      }
      setReviewForm({ rating: 5, title: "", comment: "" })
      setEditingReview(null)
      setIsEditingReview(false)
      const response = await productsApi.getReviews(resolvedParams.id)
      setReviews(response.reviews)
      if (product) {
        const productResponse = await productsApi.getById(resolvedParams.id)
        setProduct(productResponse.product)
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: getErrorMessage(error),
        variant: "destructive",
      })
    } finally {
      setIsSubmittingReview(false)
    }
  }

  const handleEditReview = (review: Review) => {
    setEditingReview(review)
    setIsEditingReview(true)
    setReviewForm({
      rating: review.rating,
      title: review.title,
      comment: review.comment,
    })
  }

  const handleCancelEdit = () => {
    setEditingReview(null)
    setIsEditingReview(false)
    setReviewForm({ rating: 5, title: "", comment: "" })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">Đang tải...</div>
        </main>
        <Footer />
      </div>
    )
  }

  if (!product) {
    notFound()
  }

  const hasColors = product.colors && product.colors.length > 0

  const productHasDiscount = hasDiscount(product)
  const discountPercent = productHasDiscount && product.originalPrice
    ? calculateDiscountPercent(product.originalPrice, product.price)
    : 0

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Vui lòng đăng nhập",
        description: "Bạn cần đăng nhập để thêm sản phẩm vào giỏ hàng",
        variant: "destructive",
      })
      return
    }

    try {
      const colorName = selectedColor?.name || "Mặc định"
      await addItem(product, quantity, colorName)
      const productName = `${quantity}x ${product.name}`
      const colorSuffix = selectedColor ? ` (${selectedColor.name})` : ""
      const description = `${productName}${colorSuffix}`
      toast({
        title: "Đã thêm vào giỏ hàng",
        description,
      })
    } catch (error) {
      toast({
        title: "Lỗi",
        description: getErrorMessage(error),
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          {/* Breadcrumb */}
          <div className="mb-6">
            <Link
              href="/products"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Quay lại sản phẩm
            </Link>
          </div>

          <div className="grid lg:grid-cols-2 gap-10">
            {/* Images */}
            <div className="space-y-4">
              <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted">
                <Image
                  src={getProductImageUrl(previewImage)}
                  alt={selectedColor ? `${product.name} - ${selectedColor.name}` : product.name}
                  fill
                  className="object-cover transition-opacity duration-300"
                  priority
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                {productHasDiscount && discountPercent > 0 && (
                  <Badge variant="destructive" className="absolute top-4 left-4 text-sm">
                    -{discountPercent}%
                  </Badge>
                )}
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {allThumbnailImages.map((image, index) => {
                  const isSelected = previewImage === image
                  return (
                    <button
                      key={`thumbnail-${index}-${image}`}
                      type="button"
                      onClick={() => {
                        setSelectedImageIndex(index)
                        setSelectedColor(null)
                      }}
                      className={`relative aspect-[4/3] w-24 shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                        isSelected
                          ? "border-primary ring-2 ring-primary/20"
                          : "border-transparent hover:border-primary/50"
                      }`}
                      aria-label={`Xem ảnh ${index + 1}`}
                    >
                      <Image
                        src={getProductImageUrl(image || "")}
                        alt={`${product.name} ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="96px"
                      />
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star
                        key={`star-${i}`}
                        className={`h-5 w-5 ${
                          i < Math.floor(product.rating)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-muted-foreground/30"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {product.rating > 0 ? product.rating.toFixed(1) : "0.0"} ({product.reviews} đánh giá)
                  </span>
                </div>
              </div>

              {/* Price */}
              <div className="space-y-1">
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-bold text-primary">{formatCurrency(product.price)}</span>
                  {productHasDiscount && product.originalPrice && (
                    <span className="text-lg text-muted-foreground line-through">
                      {formatCurrency(product.originalPrice)}
                    </span>
                  )}
                </div>
                {product.stock > 0 ? (
                  <p className="text-sm text-green-600 flex items-center gap-1">
                    <Check className="h-4 w-4" />
                    Còn {product.stock} xe trong kho
                  </p>
                ) : (
                  <p className="text-sm text-destructive">Hết hàng</p>
                )}
              </div>

              {/* Colors */}
              {hasColors && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Màu sắc</span>
                    {selectedColor && (
                      <span className="text-sm text-muted-foreground">{selectedColor.name}</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {product.colors.map((color) => {
                      const isSelected = selectedColor?.name === color.name
                      return (
                        <button
                          key={color.name}
                          type="button"
                          onClick={() => {
                            setSelectedColor({
                              name: color.name,
                              hex: color.hex,
                              image: color.image || undefined,
                            })
                            setSelectedImageIndex(null)
                          }}
                          className={`relative h-10 w-10 rounded-full border-2 transition-all ${
                            isSelected
                              ? "border-primary ring-2 ring-primary/20 scale-110"
                              : "border-border hover:border-primary/50"
                          }`}
                          style={{ backgroundColor: color.hex }}
                          title={color.name}
                          aria-label={`Chọn màu ${color.name}`}
                          aria-pressed={isSelected}
                        >
                          {isSelected && (
                            <Check
                              className={`absolute inset-0 m-auto h-5 w-5 ${
                                color.hex === "#FFFFFF" || color.hex === "#F5F5F5" || color.hex === "#F8F8F8"
                                  ? "text-foreground"
                                  : "text-white"
                              }`}
                            />
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div className="space-y-3">
                <span className="font-medium">Số lượng</span>
                <div className="flex items-center gap-3">
                  <div className="flex items-center border rounded-lg">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 rounded-r-none"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-12 text-center font-medium">{quantity}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 rounded-l-none"
                      onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                      disabled={quantity >= product.stock}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Add to Cart */}
              <div className="flex gap-4">
                <Button size="lg" className="flex-1 gap-2" onClick={handleAddToCart} disabled={product.stock === 0}>
                  <ShoppingCart className="h-5 w-5" />
                  Thêm vào giỏ hàng
                </Button>
              </div>

              {/* Features */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div className="flex flex-col items-center text-center gap-2">
                  <Truck className="h-6 w-6 text-primary" />
                  <span className="text-xs text-muted-foreground">Giao hàng toàn quốc</span>
                </div>
                <div className="flex flex-col items-center text-center gap-2">
                  <Shield className="h-6 w-6 text-primary" />
                  <span className="text-xs text-muted-foreground">Bảo hành 5 năm</span>
                </div>
                <div className="flex flex-col items-center text-center gap-2">
                  <RotateCcw className="h-6 w-6 text-primary" />
                  <span className="text-xs text-muted-foreground">Đổi trả 30 ngày</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-12">
            <Tabs defaultValue="description">
              <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
                <TabsTrigger
                  value="description"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                >
                  Mô tả
                </TabsTrigger>
                <TabsTrigger
                  value="specs"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                >
                  Thông số kỹ thuật
                </TabsTrigger>
                <TabsTrigger
                  value="reviews"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                >
                  Đánh giá ({reviews.length})
                </TabsTrigger>
              </TabsList>
              <TabsContent value="description" className="pt-6">
                <p className="text-muted-foreground leading-relaxed">{product.description}</p>
              </TabsContent>
              <TabsContent value="specs" className="pt-6">
                {product.specs.length > 0 ? (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {product.specs.map((spec) => (
                      <div key={`${spec.label}-${spec.value}`} className="flex justify-between py-3 border-b">
                        <span className="text-muted-foreground">{spec.label}</span>
                        <span className="font-medium">{spec.value}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Chưa có thông số kỹ thuật</p>
                )}
              </TabsContent>
              <TabsContent value="reviews" className="pt-6 space-y-6">
                {isAuthenticated && (isEditingReview || !hasUserReviewed) && (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">{isEditingReview ? "Sửa đánh giá" : "Viết đánh giá"}</h3>
                        {isEditingReview && (
                          <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                            Hủy
                          </Button>
                        )}
                      </div>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Đánh giá sao</Label>
                          <div className="flex gap-1">
                            {Array.from({ length: 5 }, (_, i) => {
                              const starIndex = i + 1
                              const isFilled = starIndex <= reviewForm.rating
                              return (
                                <button
                                  key={`review-form-star-${starIndex}`}
                                  type="button"
                                  onClick={() => setReviewForm((prev) => ({ ...prev, rating: starIndex }))}
                                  className="focus:outline-none"
                                >
                                  <Star
                                    className={`h-6 w-6 ${
                                      isFilled ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                                    }`}
                                  />
                                </button>
                              )
                            })}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="review-title">Tiêu đề *</Label>
                          <Input
                            id="review-title"
                            value={reviewForm.title}
                            onChange={(e) => setReviewForm((prev) => ({ ...prev, title: e.target.value }))}
                            placeholder="Nhập tiêu đề đánh giá"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="review-comment">Nội dung đánh giá *</Label>
                          <Textarea
                            id="review-comment"
                            value={reviewForm.comment}
                            onChange={(e) => setReviewForm((prev) => ({ ...prev, comment: e.target.value }))}
                            placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này"
                            rows={4}
                          />
                        </div>
                        <div className="flex gap-2">
                          {(() => {
                            let buttonText = "Gửi đánh giá"
                            if (isSubmittingReview) {
                              buttonText = "Đang lưu..."
                            } else if (isEditingReview) {
                              buttonText = "Cập nhật đánh giá"
                            }
                            return (
                              <>
                                <Button onClick={handleSubmitReview} disabled={isSubmittingReview}>
                                  {buttonText}
                                </Button>
                                {isEditingReview && (
                                  <Button variant="outline" onClick={handleCancelEdit} disabled={isSubmittingReview}>
                                    Hủy
                                  </Button>
                                )}
                              </>
                            )
                          })()}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {!isAuthenticated && (
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground mb-4">Vui lòng đăng nhập để viết đánh giá</p>
                      <Link href="/login">
                        <Button>Đăng nhập</Button>
                      </Link>
                    </CardContent>
                  </Card>
                )}

                {isLoadingReviews && <div className="text-center py-8 text-muted-foreground">Đang tải đánh giá...</div>}
                {!isLoadingReviews && reviews.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">Chưa có đánh giá nào</div>
                )}
                {!isLoadingReviews && reviews.length > 0 && (
                  <div className="space-y-4">
                    {reviews.map((review) => {
                      const reviewerName = typeof review.user === "string" ? "Người dùng" : review.user.name
                      const reviewerId = typeof review.user === "string" ? review.user : review.user._id
                      const isOwnReview = user && (user._id === reviewerId || user.userId === reviewerId)
                      return (
                        <Card key={review._id}>
                          <CardContent className="pt-6">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold">{reviewerName}</p>
                                  {isOwnReview && (
                                    <Badge variant="outline" className="text-xs">Đánh giá của bạn</Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 mt-1">
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
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {review.createdAt && (
                                  <p className="text-sm text-muted-foreground">
                                    {formatDate(review.createdAt)}
                                  </p>
                                )}
                                {isOwnReview && !isEditingReview && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => handleEditReview(review)}
                                    title="Sửa đánh giá"
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                            <h4 className="font-medium mb-2">{review.title}</h4>
                            <p className="text-muted-foreground">{review.comment}</p>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
      <Footer />
      <Toaster />
    </div>
  )
}
