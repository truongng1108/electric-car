const Order = require("../models/orderModel")
const CustomError = require("../errors")
const { StatusCodes } = require("http-status-codes")
const { checkPermissions } = require("../utils")

// ** ===================  GET ALL ORDERS  ===================
const getAllOrders = async (req, res) => {
  const orders = await Order.find({})
    .populate("user", "name email")
    .populate("orderItems.product", "name price images colors")
    .sort("-createdAt")

  res.status(StatusCodes.OK).json({ total_orders: orders.length, orders })
}

// ** ===================  GET SINGLE ORDERS  ===================
const getSingleOrder = async (req, res) => {
  const { id: orderId } = req.params
  const order = await Order.findById(orderId)
    .populate("user", "name email")
    .populate("orderItems.product", "name price images colors")
  if (!order) {
    throw new CustomError.NotFoundError("Order not found")
  }
  checkPermissions(req.user, order.user)
  res.status(StatusCodes.OK).json({ order })
}

// ** ===================  GET CURRENT USER ORDERS  ===================
const getCurrentUserOrder = async (req, res) => {
  const orders = await Order.find({ user: req.user.userId }).sort("-createdAt")
  res.status(StatusCodes.OK).json({ total_orders: orders.length, orders })
}

// ** ===================  CREATE ORDER  ===================
const createOrder = async (req, res) => {
  const { orderItems, subtotal, discount = 0, shippingFee = 0, tax = 0, total, finalTotal, shippingAddress, paymentMethod, userPhone } =
    req.body

  if (!orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
    throw new CustomError.BadRequestError("Please provide order items")
  }
  if (!subtotal || !total || !finalTotal) {
    throw new CustomError.BadRequestError("Please provide subtotal, total, and finalTotal")
  }
  if (!shippingAddress) {
    throw new CustomError.BadRequestError("Please provide shipping address")
  }

  const order = await Order.create({
    user: req.user.userId,
    userName: req.user.name,
    userEmail: req.user.email || "",
    userPhone: userPhone || "",
    shippingAddress,
    orderItems,
    subtotal,
    discount,
    shippingFee,
    tax,
    total,
    finalTotal,
    paymentMethod: paymentMethod || "VNPAY",
  })

  res.status(StatusCodes.CREATED).json({ order })
}

// ** ===================  UPDATE ORDER  ===================
const updateOrder = async (req, res) => {
  const { id: orderId } = req.params
  const { status, paymentStatus } = req.body

  const order = await Order.findById(orderId)
  if (!order) {
    throw new CustomError.NotFoundError("Order not found")
  }

  if (status) {
    const allowedStatus = ["pending", "confirmed", "shipping", "delivered", "cancelled"]
    if (!allowedStatus.includes(status)) {
      throw new CustomError.BadRequestError("Invalid status")
    }
    order.status = status
  }

  if (paymentStatus) {
    const allowedPaymentStatus = ["pending", "paid", "failed"]
    if (!allowedPaymentStatus.includes(paymentStatus)) {
      throw new CustomError.BadRequestError("Invalid payment status")
    }
    order.paymentStatus = paymentStatus
  }

  await order.save()
  res.status(StatusCodes.OK).json({ order })
}

// ** ===================  DELETE ORDER  ===================
const deleteOrder = async (req, res) => {
  const { id: orderId } = req.params
  const order = await Order.findByIdAndDelete(orderId)
  if (!order) {
    throw new CustomError.NotFoundError("Order not found")
  }
  res.status(StatusCodes.OK).json({ msg: "Order deleted" })
}

module.exports = {
  getAllOrders,
  getSingleOrder,
  getCurrentUserOrder,
  createOrder,
  updateOrder,
  deleteOrder,
}
