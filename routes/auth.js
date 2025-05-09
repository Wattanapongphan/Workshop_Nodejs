var express = require("express");
var router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const tokenMiddleware = require("../middleware/token.middleware");
const orderModel = require("../models/order");

var userModel = require("../models/user");

router.post("/login", async function (req, res, next) {
  try {
    const { username, password } = req.body;

    const user = await userModel.findOne({ username });
    if (!user) {
      return res.status(400).json({
        status: 400,
        message: "User not found !! Please register",
        data: user,
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        status: "400",
        message: "Password Invalid !!",
      });
    }

    if (!user.approve) {
      return res.status(200).json({
        status: "200",
        message: `Login Successful but approve is not yet`,
        data: {
          username: user.username,
          approve: user.approve,
        },
      });
    }

    const orders = await orderModel
      .find({ user: user._id })
      .populate("items.product", "name");

    const formattedOrders = orders.flatMap((order) =>
      order.items.map((item) => ({
        productName: item.product?.name,
        quantity: item.quantity,
      }))
    );

    const JWT_SECRET = process.env.JWT_SECRET
    const token = jwt.sign(
      { userId: user._id, username: user.username, approve: user.approve },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.status(200).json({
      status: "200",
      message: "Login successful",
      data: {
        username: user.username,
        approve: user.approve,
        token:token
      },
      order: formattedOrders,
    });
  } catch (error) {
    res.status(500).json({
      status: "500",
      message: error.message,
      data: [],
    });
  }
});
router.post("/register", async function (req, res, next) {
  try {
    const { username, password } = req.body;
    const exists = await userModel.findOne({ username });
    if (exists)
      return res.status(400).json({
        message: "User already exists",
      });

    const hashPassword = await bcrypt.hash(password, 10);
    const newUser = new userModel({
      username,
      password: hashPassword,
    });
    const user = await newUser.save();
    return res.status(201).json({
      status: 201,
      message: "Register Successful!",
      data: user,
    });
  } catch (error) {
    res.status(400).json({
      status: "400",
      message: error.message,
      data: [],
    });
  }
});

module.exports = router;
