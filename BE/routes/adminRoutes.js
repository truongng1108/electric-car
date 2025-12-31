const express = require("express")
const router = express.Router()
const { authenticateUser, authorizePermissions } = require("../middleware/authentication")
const { getAdminStats } = require("../controllers/adminStatsController")

router.route("/stats").get(authenticateUser, authorizePermissions("admin"), getAdminStats)

module.exports = router
