require("dotenv").config();
const express = require("express");
const router = express.Router();
const cloudinary = require("cloudinary").v2;
const isAuthenticated = require("../middleware/isAuthenticated");

const Offer = require("../models/offer");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

router.post("/offer/publish", isAuthenticated, async (req, res) => {
  try {
    // console.log(result);

    const newOffer = new Offer({
      product_name: req.fields.title,
      product_description: req.fields.description,
      product_price: req.fields.price,
      product_details: {
        marque: req.fields.marque,
        taille: req.fields.taille,
        etat: req.fields.etat,
        couleur: req.fields.couleur,
        emplacement: req.fields.emplacement,
      },
      owner: req.user,
    });

    const pictureToUpload = req.files.picture.path;
    const result = await cloudinary.uploader.upload(pictureToUpload, {
      folder: `/vinted/offers/${newOffer._id}`,
    });
    newOffer.product_image = result;

    await newOffer.save();
    res.status(200).json(newOffer);
  } catch (error) {
    res.status(400).json(error.message);
  }
});

router.get("/offers", async (req, res) => {
  try {
    const { title, priceMax, priceMin } = req.query;
    // const offers = await Offer.find();
    const filters = {};
    if (title || priceMax || priceMin) {
      {
        (filters.product_name = new RegExp(title, "i")),
          (filters.product_price = {
            $gte: priceMin ? priceMin : 0,
            $lte: priceMax ? priceMax : 1000,
          });
      }
    }
    let sort = {};

    if (req.query.sort === "price-desc") {
      sort = { product_price: -1 };
    } else if (req.query.sort === "price-asc") sort = { product_price: 1 };

    let page;
    if (Number(req.query.page) < 1) {
      page = 1;
    } else {
      page = Number(req.query.page);
    }

    let limit = Number(req.query.limit);

    const offers = await Offer.find(filters)
      // .select("product_name product_price product_description")
      .populate({
        path: "owner",
        select: "product_name product_price product_description",
      })
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit);

    const count = await Offer.countDocuments(filters);

    res.status(200).json({
      count: count,
      offers: offers,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/offer/:id", async (req, res) => {
  try {
    const offers = await Offer.findById(req.params.id).populated({
      path: "owner",
      select: "product_details",
    });

    res.json(offers);
  } catch (error) {
    res.status(400).json(error.message);
  }
});

module.exports = router;
