const mongoose = require('mongoose')
const {Schema} = mongoose

const orderModel = new Schema({
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    items: [
      {
        product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
        quantity: { type: Number, required: true }
      }
    ]
},{
    timestamps:true
})

module.exports = mongoose.model('Order',orderModel)