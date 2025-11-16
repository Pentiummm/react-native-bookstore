import express from "express";
import User from "../models/User.js";
import jwt from "jsonwebtoken";

const router = express.Router();

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields are required." });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters long." });
    }

    if (username.length < 3) {
      return res
        .status(400)
        .json({ message: "Username must be at least 3 characters long." });
    }

    // check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Username or email already in use." });
    }

    // create new user
    const newUser = new User({ username, email, password });
    await newUser.save();

    const tokken = generateToken(newUser._id);

    res.status(201).json({
      message: "User registered successfully.",
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
      },
      token: tokken,
    });
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid email or password./ User does not exist." });
    }

    //check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ message: "Invalid email or password./ User does not exist." });
    }

    const tokken = generateToken(user._id);

    res.status(200).json({
      message: "Login successful.",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
      token: tokken,
    });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
});

export default router;
