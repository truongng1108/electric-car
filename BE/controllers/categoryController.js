const Category = require("../models/categoryModel")
const { StatusCodes } = require("http-status-codes")
const CustomError = require("../errors")

const buildSlug = (name = "") =>
  name
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")

const createCategory = async (req, res) => {
  const { name, slug } = req.body
  if (!name) {
    throw new CustomError.BadRequestError("Please provide category name")
  }

  const finalSlug = slug || buildSlug(name)
  const existing = await Category.findOne({ slug: finalSlug })
  if (existing) {
    throw new CustomError.BadRequestError("Category slug already exists")
  }

  const category = await Category.create({ ...req.body, slug: finalSlug })
  res.status(StatusCodes.CREATED).json({ category })
}

const getAllCategories = async (req, res) => {
  const categories = await Category.find({}).sort("name")
  res.status(StatusCodes.OK).json({ total_categories: categories.length, categories })
}

const getSingleCategory = async (req, res) => {
  const { id } = req.params
  const category = await Category.findById(id)
  if (!category) {
    throw new CustomError.NotFoundError("Category not found")
  }
  res.status(StatusCodes.OK).json({ category })
}

const updateCategory = async (req, res) => {
  const { id } = req.params
  const update = { ...req.body }
  if (update.name && !update.slug) {
    update.slug = buildSlug(update.name)
  }
  if (update.slug) update.slug = buildSlug(update.slug)
  const category = await Category.findOneAndUpdate({ _id: id }, update, {
    new: true,
    runValidators: true,
  })
  if (!category) {
    throw new CustomError.NotFoundError("Category not found")
  }
  res.status(StatusCodes.OK).json({ category })
}

const deleteCategory = async (req, res) => {
  const { id } = req.params
  const category = await Category.findOneAndDelete({ _id: id })
  if (!category) {
    throw new CustomError.NotFoundError("Category not found")
  }
  res.status(StatusCodes.OK).json({ msg: "Category deleted" })
}

module.exports = {
  createCategory,
  getAllCategories,
  getSingleCategory,
  updateCategory,
  deleteCategory,
}
