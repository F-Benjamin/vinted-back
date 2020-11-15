require("dotenv").config();
const express = require("express");
const formidable = require("express-formidable");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(formidable());

// Import des routes

const userRoutes = require("./route/user");
app.use(userRoutes);
const offerRoutes = require("./route/offer.");
app.use(offerRoutes);

mongoose.connect(process.env.BDD_ADRESS, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
});

app.all("*", (req, res) => {
  res.status(404).json({ message: "Cette route n'existe pas !" });
});

app.listen(process.env.PORT, () => {
  console.log("Started :))");
});
