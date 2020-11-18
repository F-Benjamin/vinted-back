require("dotenv").config();
const express = require("express");
const router = express.Router();
const uid2 = require("uid2");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

// Import model

const User = require("../models/user");

// Routes

router.post("/user/signup", async (req, res) => {
  const salt = uid2(16);

  const hash = SHA256(req.fields.password + salt).toString(encBase64);

  const token = uid2(16);

  try {
    const user = await User.findOne({ email: req.fields.email });

    if (user) {
      res.status(409).json({
        message: "Email already exist",
      });
    } else {
      if (req.fields.email && req.fields.username && req.fields.password) {
        const newUser = new User({
          email: req.fields.email,
          account: {
            username: req.fields.username,
            phone: req.fields.phone,
          },
          hash: hash,
          token: token,
          salt: salt,
        });

        await cloudinary.uploader.upload(req.files.avatar, {
          folder: "/vinted/user",
          public_id: "avatar",
        });
        newUser.account.avatar = result;

        await newUser.save();
        res.status(200).json({
          _id: newUser._id,
          email: newUser.email,
          account: newUser.account,
          token: newUser.token,
        });
      } else {
        res.status(400).json({ message: "Missing parameters" });
      }
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post("/user/login", async (req, res) => {
  try {
    // const logIn = (req.fields.email, req.fields.password);
    const email = req.fields.email;
    const user = await User.findOne({ email: email });
    // console.log(user);
    const password = req.fields.password;
    const userSalt = await user.salt;
    const userHash = await user.hash;

    const hash = SHA256(password + userSalt).toString(encBase64);
    if (user) {
      if (userHash === hash) {
        res.status(200).json({
          _id: user._id,
          token: user.token,
          account: user.account,
        });
      } else {
        res.status(401).json({ message: "Unauthorized" });
      }
    } else {
      res.status(400).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
