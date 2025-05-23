var express = require("express");
var router = express.Router();

const productModel = require("../models/product");
const orderModel = require("../models/order");
const tokenMiddleware = require("../middleware/token.middleware");
const adminMiddleware = require("../middleware/admin.middleware")

router.get("/",  async function (req, res, next) {
  try {
    const products = await productModel.find({});
    return res.status(200).json({
      status: "200",
      message: "Get Products Successful",
      data: products,
    });
  } catch (error) {
    return res.status(500).json({
      status: "500",
      message: error.message,
      data: [],
    });
  }
});
router.post("/", async function (req, res, next) { // [tokenMiddleware,adminMiddleware]
  try {
    const { name, price, stock, image } = req.body;

    const existingProduct = await productModel.findOne({ name });
    if (existingProduct) {
      return res.status(400).json({
        status: 400,
        message: "This menu name is already in use",
      });
    }

    const newProduct = new productModel({
      name,
      price,
      stock,
      image
    });

    const product = await newProduct.save();

    res.status(201).json({
      status: "201",
      message: "Insert Product Successful",
      data: product,
    });
  } catch (error) {
    return res.status(500).json({
      status: "500",
      message: error.message,
      data: [],
    });
  }
});
router.put("/:id", async function (req, res, next) { //[tokenMiddleware,adminMiddleware]
  try {
    const { name, price, stock, image } = req.body;
    const { id } = req.params;

    const product = await productModel.findByIdAndUpdate(
      id,
      { name, price, stock, image },
      { new: true }
    );

    return res.status(200).json({
      status: "200",
      message: "Updated Product Successful",
      data: product,
    });
  } catch (error) {
    return res.status(500).json({
      status: "500",
      message: error.message,
      data: [],
    });
  }
});

router.delete("/:id", async function (req, res, next) { // [tokenMiddleware,adminMiddleware]
  try {
    const { id } = req.params; 

    const product = await productModel.findByIdAndDelete(id);

    return res.status(200).json({
      status: "200",
      message: "Delete Product Successful",
      data: product,
    });
  } catch (error) {
    return res.status(500).json({
      status: "500",
      message: error.message,
      data: [],
    });
  }
});

router.get("/:id", [tokenMiddleware], async function (req, res, next) {
  try {
    const { id } = req.params;

    const product = await productModel.findById(id);

    return res.status(200).json({
      status: "200",
      message: "Get Product By id Successful",
      data: product,
    });
  } catch (error) {
    return res.status(500).json({
      status: "500",
      message: error.message,
      data: [],
    });
  }
});

router.get("/:id/orders", [tokenMiddleware], async function (req, res, next) {
  try {
    const { id } = req.params;

    const orders = await orderModel
      .find({ "items.product": id }) // หาทุก order ที่มี product นี้
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
      message: "Get all orders of this product successful",
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

router.post("/:id/orders", [tokenMiddleware], async function (req, res, next) {
  try {
    const productId = req.params.id;
    const { quantity } = req.body;
    const userId = req.user.userId; // ✅ ดึงจาก token

    const product = await productModel.findById(productId);
    if (!product) {
      return res.status(404).json({
        status: "404",
        message: "Product not found",
      });
    }

    if (quantity > product.stock) {
      return res.status(400).json({
        status: "400",
        message: "Product out of stock",
      });
    }

    // หาว่า user มี order เดิมไหม
    let order = await orderModel.findOne({ user: userId });

    if (!order) {
      // ถ้ายังไม่มี order เดิม → สร้างใหม่
      order = new orderModel({
        user: userId,
        items: [{ product: productId, quantity }],
      });
    } else {
      // มี order เดิม → เช็คว่าเคยเพิ่ม product นี้ไหม
      const existingItem = order.items.find(
        (item) => item.product.toString() === productId
      );

      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        order.items.push({ product: productId, quantity });
      }
    }

    // ลด stock ของ product
    product.stock -= quantity;
    await product.save();
    await order.save();

    return res.status(201).json({
      status: "201",
      message: "Order created successfully",
      data: order,
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
