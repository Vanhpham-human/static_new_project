const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    address: { type: String, default: "" },
    phone: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

userSchema.index({ email: 1 }, { unique: true });

module.exports = mongoose.model("User", userSchema);
