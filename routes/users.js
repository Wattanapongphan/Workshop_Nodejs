var express = require("express");
var router = express.Router();
const userModel = require("../models/user");
const jwt = require("jsonwebtoken");
const adminMiddleware = require("../middleware/admin.middleware");
const tokenMiddleware = require("../middleware/token.middleware");

/* GET users listing. */
router.get("/list",[tokenMiddleware,adminMiddleware], async function (req, res, next) {
  try {
    const users = await userModel.find({});

    res.status(200).json({
      status: "200",
      message: "Get Users list Success",
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      status: "500",
      message: error.message,
      data: [],
    });
  }
});
router.put(
  "/:id/approve",
  [tokenMiddleware, adminMiddleware],
  async function (req, res, next) {
    try {
      const userId = req.params.id;

      const user = await userModel.findByIdAndUpdate(
        userId,
        { approve: true },
        { new: true }
      );

      if (!user) {
        res.status(400).json({
          status: "400",
          message: "User not found",
        });
      }

      const JWT_SECRET = process.env.JWT_SECRET;
      const token = jwt.sign(
        {
          userId: user._id,
          username: user.username,
          approve: user.approve,
          role: user.role,
        },
        JWT_SECRET,
        { expiresIn: "1d" }
      );

      if (user.approve === true) {
        return res.status(200).json({
          status: "200",
          message: "User is already approved",
          token: token,
        });
      }

      res.status(200).json({
        status: "200",
        message: "User approved Successfully",
        data: user,
        token: token,
      });
    } catch (error) {
      res.status(400).json({
        status: "400",
        message: error.message,
        data: [],
      });
    }
  }
);

module.exports = router;
