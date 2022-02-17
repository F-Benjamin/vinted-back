require("dotenv").config();
const express = require("express");
const router = express.Router();
const uid2 = require("uid2");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
// const cloudinary = require("cloudinary").v2;

// Import model

const User = require("../models/user");
const Offer = require("../models/offer");

// Routes

router.post("/user/signup", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.fields.email });

    if (user) {
      res.status(409).json({
        message: "Email already exist",
      });
    } else {
      if (req.fields.email && req.fields.username && req.fields.password) {
        const salt = uid2(16);
        const hash = SHA256(req.fields.password + salt).toString(encBase64);
        const token = uid2(16);

        const newUser = new User({
          email: req.fields.email,
          account: {
            username: req.fields.username,
            phone: req.fields.phone,
          },
          newsletter: req.fields.newsletter,
          hash: hash,
          token: token,
          salt: salt,
        });

        // await cloudinary.uploader.upload(req.files.avatar, {
        //   folder: "/vinted/user",
        //   public_id: "avatar",
        // });
        // newUser.account.avatar = result;

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
    const user = await User.findOne({ email: req.fields.email });

    if (user) {
      const userHash = await user.hash;
      const hash = SHA256(req.fields.password + user.salt).toString(encBase64);
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
