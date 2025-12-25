const crypto = require("crypto")

const encodeParam = (value) => encodeURIComponent(String(value)).replace(/%20/g, "+")

const buildSignedQuery = (params) => {
  const entries = Object.entries(params)
    .filter(([, value]) => value != null && value !== "")
    .map(([key, value]) => [encodeURIComponent(key), encodeParam(value)])
    .sort((a, b) => a[0].localeCompare(b[0]))

  const signData = entries.map(([key, value]) => `${key}=${value}`).join("&")
  return { signData, query: signData }
}

// Build payment URL for VNPay sandbox
const createPaymentUrl = ({ amount, orderId, orderInfo, ipAddr, returnUrl, bankCode }) => {
  const date = new Date()
  const createDate =
    date.getFullYear() +
    ("0" + (date.getMonth() + 1)).slice(-2) +
    ("0" + date.getDate()).slice(-2) +
    ("0" + date.getHours()).slice(-2) +
    ("0" + date.getMinutes()).slice(-2) +
    ("0" + date.getSeconds()).slice(-2)

  const vnpParams = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: process.env.VNPAY_TMN_CODE,
    vnp_Locale: "vn",
    vnp_CurrCode: "VND",
    vnp_TxnRef: orderId,
    vnp_OrderInfo: orderInfo,
    vnp_OrderType: "other",
    vnp_Amount: Math.floor(amount * 100),
    vnp_ReturnUrl: returnUrl,
    vnp_IpAddr: ipAddr || "127.0.0.1",
    vnp_CreateDate: createDate,
  }

  if (bankCode) {
    vnpParams.vnp_BankCode = bankCode
  }

  const { signData, query } = buildSignedQuery(vnpParams)

  const hmac = crypto.createHmac("sha512", process.env.VNPAY_HASH_SECRET)
  const secureHash = hmac.update(Buffer.from(signData, "utf-8")).digest("hex")

  const vnpUrl = process.env.VNPAY_URL || "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html"
  // Add SecureHashType only on the URL (not in signed data) per VNPay docs
  return `${vnpUrl}?${query}&vnp_SecureHashType=SHA512&vnp_SecureHash=${secureHash}`
}

// Verify return data from VNPay
const verifyReturn = (query) => {
  let vnp_Params = query
  const secureHash = vnp_Params.vnp_SecureHash

  delete vnp_Params.vnp_SecureHash
  delete vnp_Params.vnp_SecureHashType

  const { signData } = buildSignedQuery(vnp_Params)

  const hmac = crypto.createHmac("sha512", process.env.VNPAY_HASH_SECRET)
  const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex")

  return signed === secureHash
}

module.exports = {
  createPaymentUrl,
  verifyReturn,
}
