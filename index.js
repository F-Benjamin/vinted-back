require("dotenv").config();
const express = require("express");
const formidable = require("express-formidable");
const mongoose = require("mongoose");
const cors = require("cors");
const cloudinary = require("cloudinary").v2;

const app = express();
app.use(cors());
app.use(formidable());

mongoose.connect(process.env.BDD_ADRESS, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

// Import des routes

const userRoutes = require("./route/user");
app.use(userRoutes);
const offerRoutes = require("./route/offer");
app.use(offerRoutes);
const paymentRoutes = require("./route/payment");
app.use(paymentRoutes);

app.get("/", (req, res) => {
  res.json("Welcome on Vinted API");
});

app.all("*", (req, res) => {
  res.status(404).json({ message: "Cette route n'existe pas !" });
});

app.listen(process.env.PORT, () => {
  console.log("Started :))");
});
