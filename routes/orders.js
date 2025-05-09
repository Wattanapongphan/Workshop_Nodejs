var express = require("express");
var router = express.Router();
const orderModel = require("../models/order");
const jwt = require("jsonwebtoken");
const tokenMiddleware = require("../middleware/token.middleware");

router.get("/", [tokenMiddleware], async function (req, res, next) {
  try {
    const orders = await orderModel
      .find({})
      .populate("user", "username _id")
      .populate("items.product", "name price");

    const formatted = orders.map((order) => ({
      user: {
        user_id: order.user?._id,
        username: order.user?.username,
      },
      products: order.items.map((item) => ({
        name: item.product?.name,
        price: item.product?.price,
        quantity: item.quantity,
      })),
    }));

    res.status(200).json({
      status: "200",
      message: "Get orders Successful",
      data: formatted,
    });
  } catch (error) {
    res.status(500).json({
      status: "500",
      message: error.message,
      data: [],
    });
  }
});

module.exports = router;
