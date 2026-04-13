const mongoose = require("mongoose");

async function connectDB() {
  const mongoURI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/techchain_dashboard";

  await mongoose.connect(mongoURI, {
    autoIndex: true,
  });

  console.log("Connected MongoDB");
}

module.exports = connectDB;
