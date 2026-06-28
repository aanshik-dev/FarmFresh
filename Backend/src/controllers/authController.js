import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { readDB, writeDB } from "../config/db.js";

const VALID_ROLES = ["ADMIN", "COLLECTIVE", "FARMER_GROUP"];

const register = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({
        message: `Role must be one of: ${VALID_ROLES.join(", ")}`,
      });
    }

    const db = readDB();

    const existingUser = db.users.find(
      (u) => u.username === username || u.email === email
    );
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Username or email already taken" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      id: "u" + Date.now(),
      username,
      email,
      password: hashedPassword,
      role,
      createdAt: new Date().toISOString(),
    };

    db.users.push(newUser);
    writeDB(db);

    res.status(201).json({ message: `Account created for ${username}` });
  } catch (err) {
    res.status(500).json({ message: "Something went wrong" });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const db = readDB();

    const user = db.users.find((u) => u.email === email);
    if (!user) {
      return res.status(404).json({ message: "No account found with this email" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Wrong password" });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.status(200).json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Something went wrong" });
  }
};

export { register, login };
