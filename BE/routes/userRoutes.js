const express = require("express")
const router = express.Router()
const { authenticateUser, authorizePermissions } = require("../middleware/authentication")

const {
  getAllUsers,
  createUserAdmin,
  getSingleUser,
  showCurrentUser,
  updateUser,
  updateUserPassword,
  updateUserAdmin,
  deleteUserAdmin,
} = require("../controllers/userController")

router
  .route("/")
  .get(authenticateUser, authorizePermissions("admin", "owner"), getAllUsers)
  .post(authenticateUser, authorizePermissions("admin"), createUserAdmin)

router.route("/showMe").get(authenticateUser, showCurrentUser)
router.route("/updateUser").patch(authenticateUser, updateUser)
router.route("/updateUserPassword").patch(authenticateUser, updateUserPassword)

router
  .route("/:id")
  .get(authenticateUser, getSingleUser)
  .patch(authenticateUser, authorizePermissions("admin"), updateUserAdmin)
  .delete(authenticateUser, authorizePermissions("admin"), deleteUserAdmin)

module.exports = router
