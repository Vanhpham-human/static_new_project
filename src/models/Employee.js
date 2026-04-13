const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    code: { type: String, required: true, unique: true, trim: true },
    position: { type: String, required: true, enum: ["Sales", "Leader", "Manager"] },
    salary: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

employeeSchema.index({ code: 1 }, { unique: true });
employeeSchema.index({ position: 1 });

module.exports = mongoose.model("Employee", employeeSchema);
