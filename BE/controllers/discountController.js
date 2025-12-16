const Discount = require("../models/discountModel")
const CustomError = require("../errors")
const { StatusCodes } = require("http-status-codes")

const normalizeCode = (code) => code.toString().trim().toUpperCase()

// Create discount (Admin)
const createDiscount = async (req, res) => {
  const payload = { ...req.body }
  if (!payload.code || !payload.discountType || payload.discountValue === undefined) {
    throw new CustomError.BadRequestError("Please provide code, discountType, and discountValue")
  }
  payload.code = normalizeCode(payload.code)

  const exists = await Discount.findOne({ code: payload.code })
  if (exists) {
    throw new CustomError.BadRequestError("Discount code already exists")
  }

  const discount = await Discount.create(payload)
  res.status(StatusCodes.CREATED).json({ discount })
}

// Get all discounts (Admin)
const getAllDiscounts = async (req, res) => {
  const discounts = await Discount.find({}).sort("-createdAt")
  res.status(StatusCodes.OK).json({ total_discounts: discounts.length, discounts })
}

// Get single discount (Admin)
const getSingleDiscount = async (req, res) => {
  const { id } = req.params
  const discount = await Discount.findById(id)
  if (!discount) throw new CustomError.NotFoundError("Discount not found")
  res.status(StatusCodes.OK).json({ discount })
}

// Update discount (Admin)
const updateDiscount = async (req, res) => {
  const { id } = req.params
  const update = { ...req.body }
  if (update.code) update.code = normalizeCode(update.code)

  const discount = await Discount.findByIdAndUpdate(id, update, {
    new: true,
    runValidators: true,
  })
  if (!discount) throw new CustomError.NotFoundError("Discount not found")
  res.status(StatusCodes.OK).json({ discount })
}

// Delete discount (Admin)
const deleteDiscount = async (req, res) => {
  const { id } = req.params
  const discount = await Discount.findByIdAndDelete(id)
  if (!discount) throw new CustomError.NotFoundError("Discount not found")
  res.status(StatusCodes.OK).json({ msg: "Discount deleted" })
}

module.exports = {
  createDiscount,
  getAllDiscounts,
  getSingleDiscount,
  updateDiscount,
  deleteDiscount,
}
