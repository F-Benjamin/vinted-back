const express = require("express");
const router = express.Router();
const cloudinary = require("cloudinary").v2;
const isAuthenticated = require("../middleware/isAuthenticated");

const Offer = require("../models/offer");
const User = require("../models/user");

router.get("/offers", async (req, res) => {
  try {
    const { title, priceMax, priceMin } = req.query;

    let filters = {};

    if (title) {
      filters.product_name = new RegExp(title, "i");
    }
    if (priceMin) {
      filters.product_price = {
        $gte: priceMin,
      };
    }
    if (priceMax) {
      if (filters.product_price) {
        filters.product_price.$lte = priceMax;
      } else {
        filters.product_price = {
          $lte: priceMax,
        };
      }
    }

    let sort = {};

    if (req.query.sort === "price-desc") {
      sort = { product_price: -1 };
    } else if (req.query.sort === "price-asc") {
      sort = { product_price: 1 };
    }

    let page;
    if (Number(req.query.page) < 1) {
      page = 1;
    } else {
      page = Number(req.query.page);
    }

    let limit = Number(req.query.limit);

    const offers = await Offer.find(filters)
      .populate({
        path: "owner",
        select: "account",
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
    const offers = await Offer.findById(req.params.id).populate({
      path: "owner",
      select: "account.username account.phone account.avatar",
    });
    res.status(200).json(offers);
  } catch (error) {
    res.status(400).json(error.message);
  }
});

router.post("/offer/publish", isAuthenticated, async (req, res) => {
  try {
    const { title, description, price, brand, size, condition, color, city } =
      req.fields;

    if (title && price && req.files.picture.path) {
      const newOffer = new Offer({
        product_name: title,
        product_description: description,
        product_price: price,
        product_details: [
          { marque: brand },
          { taille: size },
          { etat: condition },
          { couleur: color },
          { emplacement: city },
        ],
        owner: req.user,
      });

      const result = await cloudinary.uploader.upload(req.files.picture.path, {
        folder: `/vinted/offers/${newOffer._id}`,
        public_id: title,
      });
      newOffer.product_image = result;

      await newOffer.save();
      res.status(200).json(newOffer);
    } else {
    }
  } catch (error) {
    res.status(400).json(error.message);
  }
});

module.exports = router;
