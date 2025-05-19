var express = require("express");
var router = express.Router();
const orderModel = require("../models/order");
const productModel = require("../models/product");

router.get("/", async function (req, res, next) {
  try {
    const orders = await orderModel
      .find({})
      .populate("user", "username _id")
      .populate("items.product", "name price");

    const formatted = orders.map((order) => ({
      _id: order._id,
      status: order.status,

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

router.post("/", async (req, res) => {
  try {
    const { user, items } = req.body;
    console.log("Received items:", items);

    // 1. ตรวจสอบ stock ทุกชิ้นก่อน ว่าพอไหม
    for (const item of items) {
      const product = await productModel.findById(item.productId);
      if (!product) {
        return res.status(404).json({ success: false, message: `สินค้าไม่พบ` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `สินค้า ${product.name} มีจำนวนไม่พอ`,
        });
      }
    }

    // 2. คำนวณราคารวม
    const totalPrice = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // 3. สร้าง order ใหม่
    const newOrder = new orderModel({
      user,
      items: items.map((item) => ({
        name: item.name,
        product: item.productId,
        quantity: item.quantity,
      })),
      totalPrice,
    });

    const savedOrder = await newOrder.save();

    // 4. ลด stock ทีละรายการ
    for (const item of items) {
      await productModel.findByIdAndUpdate(item.productId, {
        $inc: { stock: -item.quantity },
      });
    }

    res.status(201).json({ success: true, order: savedOrder });
  } catch (err) {
    console.error("Error creating order:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post("/:id/approve", async (req, res) => {
  const order = await orderModel.findByIdAndUpdate(
    req.params.id,
    { status: "approved" },
    { new: true }
  );
  res.json({ message: "Order approved", order });
});

router.post("/:id/cancel", async (req, res) => {
  const order = await orderModel.findByIdAndUpdate(
    req.params.id,
    { status: "cancelled" },
    { new: true }
  );
  res.json({ message: "Order cancelled", order });
});

module.exports = router;
