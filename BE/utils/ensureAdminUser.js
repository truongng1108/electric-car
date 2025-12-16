const User = require("../models/userModel")

const ensureAdminUser = async () => {
  const adminExists = await User.exists({ role: "admin" })
  if (adminExists) return

  const defaultAdmin = {
    name: "admin",
    email: "admin@gmail.com",
    password: "admin123",
    role: "admin",
  }

  const existingUser = await User.findOne({ email: defaultAdmin.email })
  if (existingUser) {
    existingUser.name = defaultAdmin.name
    existingUser.password = defaultAdmin.password
    existingUser.role = defaultAdmin.role
    await existingUser.save()
    console.log("Updated admin@gmail.com account to admin role")
    return
  }

  await User.create(defaultAdmin)
  console.log("Created default admin account admin@gmail.com")
}

module.exports = ensureAdminUser
