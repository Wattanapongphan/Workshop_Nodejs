var express = require("express");
var router = express.Router();
const userModel = require("../models/user");

/* GET users listing. */
router.get("/list", async function (req, res, next) {
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
      data:[]
    });
  }
});
router.put("/:id/approve", async function (req, res, next) {
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

    res.status(201).json({
      status:"201",
      message:"User approved Successfully",
      data:user
    })
  } catch (error) {
    res.status(400).json({
      status: "400",
      message: error.message,
      data:[]
    });
  }
});

module.exports = router;
