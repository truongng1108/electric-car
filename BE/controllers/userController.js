const User = require("../models/userModel")
const { StatusCodes } = require("http-status-codes")
const CustomError = require("../errors")
const { createTokenUser, attachCookiesToResponse, checkPermissions } = require("../utils")

// Get all users (admin/owner)
const getAllUsers = async (req, res) => {
  const users = await User.find({ role: "user" }).select("-password")
  res.status(StatusCodes.OK).json({ total_users: users.length, users })
}

// Create user (admin)
const createUserAdmin = async (req, res) => {
  const { name, email, password, role = "user", phone, address, avatar, gender, dateOfBirth } = req.body
  if (!name || !email || !password) {
    throw new CustomError.BadRequestError("Please provide name, email, and password")
  }
  const existing = await User.findOne({ email })
  if (existing) {
    throw new CustomError.BadRequestError("Email already exists")
  }
  const user = await User.create({ name, email, password, role, phone, address, avatar, gender, dateOfBirth })
  const sanitized = user.toObject()
  delete sanitized.password
  res.status(StatusCodes.CREATED).json({ user: sanitized })
}

// Get single user
const getSingleUser = async (req, res) => {
  const { id: userId } = req.params
  const user = await User.findOne({ _id: userId }).select("-password")
  if (!user) {
    throw new CustomError.NotFoundError("User does not exist")
  }
  checkPermissions(req.user, user._id)
  res.status(StatusCodes.OK).json({ user })
}

// Show current user
const showCurrentUser = async (req, res) => {
  res.status(StatusCodes.OK).json({ user: req.user })
}

// Update user (self)
const updateUser = async (req, res) => {
  const allowedFields = ["name", "email", "phone", "address", "avatar", "gender", "dateOfBirth"]
  const updates = {}
  for (const key of allowedFields) {
    if (req.body[key] !== undefined) updates[key] = req.body[key]
  }

  if (Object.keys(updates).length === 0) {
    throw new CustomError.BadRequestError("Please provide value")
  }

  const user = await User.findOne({ _id: req.user.userId })
  Object.assign(user, updates)
  await user.save()
  const tokenUser = createTokenUser(user)
  attachCookiesToResponse({ res, user: tokenUser })
  res.status(StatusCodes.OK).json({ user: tokenUser })
}

// Update user (admin)
const updateUserAdmin = async (req, res) => {
  const { id: userId } = req.params
  const allowedFields = ["name", "email", "phone", "address", "avatar", "gender", "dateOfBirth", "role", "password"]
  const updates = {}
  for (const key of allowedFields) {
    if (req.body[key] !== undefined) updates[key] = req.body[key]
  }
  if (Object.keys(updates).length === 0) {
    throw new CustomError.BadRequestError("Please provide value")
  }

  const user = await User.findById(userId)
  if (!user) throw new CustomError.NotFoundError("User does not exist")

  Object.assign(user, updates)
  await user.save()
  const sanitized = user.toObject()
  delete sanitized.password
  res.status(StatusCodes.OK).json({ user: sanitized })
}

// Update user password
const updateUserPassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body
  if (!oldPassword || !newPassword) {
    throw new CustomError.BadRequestError("Please provide both values")
  }
  const user = await User.findOne({ _id: req.user.userId })
  const isPasswordCorrect = await user.comparePassword(oldPassword)
  if (!isPasswordCorrect) {
    throw new CustomError.UnauthenticatedError("Wrong password provided")
  }
  user.password = newPassword
  await user.save()
  res.status(StatusCodes.OK).json({ msg: "Success! Password Updated" })
}

// Delete user (admin)
const deleteUserAdmin = async (req, res) => {
  const { id: userId } = req.params
  const user = await User.findByIdAndDelete(userId)
  if (!user) {
    throw new CustomError.NotFoundError("User does not exist")
  }
  res.status(StatusCodes.OK).json({ msg: "User deleted" })
}

module.exports = {
  getAllUsers,
  createUserAdmin,
  getSingleUser,
  showCurrentUser,
  updateUser,
  updateUserAdmin,
  updateUserPassword,
  deleteUserAdmin,
}
