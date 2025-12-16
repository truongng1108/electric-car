const express = require("express")
const router = express.Router()

const { authenticateUser, authorizePermissions } = require("../middleware/authentication")
const {
  createDiscount,
  getAllDiscounts,
  getSingleDiscount,
  updateDiscount,
  deleteDiscount,
} = require("../controllers/discountController")

router
  .route("/")
  .post(authenticateUser, authorizePermissions("admin"), createDiscount)
  .get(authenticateUser, authorizePermissions("admin"), getAllDiscounts)

router
  .route("/:id")
  .get(authenticateUser, authorizePermissions("admin"), getSingleDiscount)
  .patch(authenticateUser, authorizePermissions("admin"), updateDiscount)
  .delete(authenticateUser, authorizePermissions("admin"), deleteDiscount)

module.exports = router
