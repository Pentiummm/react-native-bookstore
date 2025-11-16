import express from "express";
import cloudinary from "../lib/cloudinary.js";
import Book from "../models/Book.js";
import protectRoute from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", protectRoute, async (req, res) => {
  try {
    const { title, caption, rating, image } = req.body;

    if (!image || !title || !caption || !rating)
      return res
        .status(400)
        .send({ message: "Image, title, caption, and rating are required" });

    // upload image to cloudinary
    const uploadResult = await cloudinary.uploader.upload(image, {
      folder: "bookstore/books",
    });

    // save book to database
    const newBook = new Book({
      title,
      caption,
      rating,
      image: uploadResult.secure_url, // use the secure URL from Cloudinary
      user: req.user._id, // assuming user is authenticated and user ID is available in req.user
    });

    res.status(201).json({
      message: "Book created successfully",
      book: newBook,
    });
  } catch (error) {
    res.status(500).send("Server error");
  }
});

router.get("/", protectRoute, async (req, res) => {
  try {
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;
    const skip = (page - 1) * limit;

    const books = await Book.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("user", "username email");

    const total = await Book.countDocuments();
    res.status(200).json({
      books,
      currentPage: page,
      totalBooks: total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching books:", error);
    res.status(500).send("Server error");
  }
});

// get recommended books for logged-in user
router.get("/user", protectRoute, async (req, res) => {
  try {
    const books = await Book.find({ user: req.user._id }).sort({
      createdAt: -1,
    });

    res.status(200).json({ books });
  } catch (error) {
    console.error("Error fetching user books:", error);
    res.status(500).send("Server error");
  }
});

router.delete("/:id", protectRoute, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    // check if the logged-in user is the owner of the book
    if (book.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized action" });
    }

    // delete image from cloudinary
    if (book.image && book.image.includes("cloudinary")) {
      try {
        const publicId = book.image
          .split("/")
          .slice(-2)
          .join("/")
          .split(".")[0]; // extract public ID from URL
        //  const publicId = book.image.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(publicId);
      } catch (error) {
        console.error("Cloudinary image deletion error:", error);
      }
    }

    // delete book from database
    await book.deleteOne();

    res.status(200).json({ message: "Book deleted successfully" });
  } catch (error) {
    res.status(500).send("Server error");
  }
});

export default router;
