import express from "express";
import cors from "cors";
import "dotenv/config"
import dbConnect from "./config/dbConnect.js";
// dotenv.config();
dbConnect();

import seedCounters from "./scripts/seedCounters.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

seedCounters();

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PATCH", "DELETE"],
    credentials: true,
  }),
);

// Middlewares
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.get("/", (req, res) => {
  res.json({ message: "FarmFresh backend is running" });
});

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Internal server error" });
});

// Server
const PORT = process.env.PORT || 6000;

app.listen(PORT, () => {
  console.log(`Server is running at port ${PORT}`);
});
