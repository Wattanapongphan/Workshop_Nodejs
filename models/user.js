const mongoose = require("mongoose");
const { Schema } = mongoose;

const userModel = new Schema(
  {
    username: { type: String, required: true },
    password: { type: String, required: true },
    approve: { type: Boolean, default: true },
    role: { type: String, enum: ["user", "admin"], default: "user" }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userModel);
