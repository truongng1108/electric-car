const Order = require("../models/orderModel")
const Product = require("../models/productModel")
const User = require("../models/userModel")
const { StatusCodes } = require("http-status-codes")

const defaultStatusCounts = { pending: 0, confirmed: 0, shipping: 0, delivered: 0, cancelled: 0 }

const getAdminStats = async (req, res) => {
  const [
    orderStatusAggregation,
    revenueAggregation,
    productCount,
    customerCount,
    recentOrders,
    topProductsAggregation,
    revenueByMonthAggregation,
  ] = await Promise.all([
    Order.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Order.aggregate([
      { $match: { paymentStatus: "paid", status: { $ne: "cancelled" } } },
      { $group: { _id: null, totalRevenue: { $sum: "$finalTotal" }, paidOrders: { $sum: 1 } } },
    ]),
    Product.countDocuments(),
    User.countDocuments({ role: "user" }),
    Order.find({})
      .select("userName userEmail finalTotal status paymentStatus createdAt")
      .sort({ createdAt: -1 })
      .limit(5),
    Order.aggregate([
      { $match: { status: { $ne: "cancelled" } } },
      { $unwind: "$orderItems" },
      { $match: { "orderItems.product": { $ne: null } } },
      {
        $group: {
          _id: "$orderItems.product",
          quantity: { $sum: "$orderItems.quantity" },
          revenue: { $sum: { $multiply: ["$orderItems.quantity", "$orderItems.price"] } },
        },
      },
      { $sort: { quantity: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          productId: "$_id",
          name: "$product.name",
          image: { $arrayElemAt: ["$product.images", 0] },
          quantity: 1,
          revenue: 1,
        },
      },
    ]),
    Order.aggregate([
      { $match: { paymentStatus: "paid", status: { $ne: "cancelled" } } },
      {
        $group: {
          _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
          revenue: { $sum: "$finalTotal" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
      { $limit: 6 },
    ]),
  ])

  const orderStatusCounts = { ...defaultStatusCounts }
  for (const item of orderStatusAggregation) {
    orderStatusCounts[item._id] = item.count
  }

  const totalOrders = Object.values(orderStatusCounts).reduce((sum, value) => sum + value, 0)
  const revenueTotals = revenueAggregation[0] || { totalRevenue: 0, paidOrders: 0 }
  const revenueByMonth = revenueByMonthAggregation
    .map((item) => ({
      year: item._id.year,
      month: item._id.month,
      revenue: item.revenue,
      orders: item.orders,
    }))
    .reverse()

  const topProducts = topProductsAggregation.map((item) => ({
    productId: item.productId,
    name: item.name || "Unknown product",
    image: item.image || "",
    quantitySold: item.quantity,
    revenue: item.revenue,
  }))

  res.status(StatusCodes.OK).json({
    totals: {
      revenue: revenueTotals.totalRevenue || 0,
      orders: totalOrders,
      paidOrders: revenueTotals.paidOrders || 0,
      products: productCount,
      customers: customerCount,
      averageOrderValue:
        revenueTotals.paidOrders > 0 ? Number((revenueTotals.totalRevenue / revenueTotals.paidOrders).toFixed(2)) : 0,
    },
    orderStatusCounts,
    revenueByMonth,
    topProducts,
    recentOrders: recentOrders.map((order) => ({
      id: order._id,
      userName: order.userName,
      userEmail: order.userEmail,
      finalTotal: order.finalTotal,
      status: order.status,
      paymentStatus: order.paymentStatus,
      createdAt: order.createdAt,
    })),
  })
}

module.exports = { getAdminStats }
