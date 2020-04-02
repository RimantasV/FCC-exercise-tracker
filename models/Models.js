const mongoose = require("mongoose");
const Schema = mongoose.Schema;
// Create Schema
const UserSchema = new Schema({
  username: { type: String, required: true },
  log: [
    {
      description: { type: String, required: true },
      duration: { type: Number, required: true },
      date: { type: Date, required: true, default: Date.now }
    }
  ]
});
const User = mongoose.model("users", UserSchema);
module.exports = User;
