require("dotenv").config();
const path = require("path");
const express = require("express");
const morgan = require("morgan");
const connectDB = require("./config/db");
const dashboardRoutes = require("./routes/dashboard");

const app = express();
const PORT = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(morgan("dev"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));
app.use("/", dashboardRoutes);

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).send("Internal Server Error");
});

async function bootstrap() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

bootstrap().catch((error) => {
  console.error("Cannot start server:", error.message);
  process.exit(1);
});
