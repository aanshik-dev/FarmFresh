import express from "express";
import cors from "cors";
import "dotenv/config";
import dbConnect from "./config/dbConnect.js";
import seedCounters from "./scripts/seedCounters.js";
import seedCrops from "./scripts/seedData.js";
import seedAdmin from "./scripts/seedAdmin.js";

import authRoutes from "./routes/auth.route.js";
import collectiveRoutes from "./routes/collective.route.js";
import farmerGroupRoutes from "./routes/farmerGroup.route.js";
import commonRoutes from "./routes/common.route.js";
import userRoutes from "./routes/user.route.js";
import aiRoutes from "./routes/ai.route.js";

await dbConnect();
await seedCounters();
await seedCrops();
await seedAdmin();

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

import passport from "./config/passport.js";
app.use(passport.initialize());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/data", commonRoutes);
app.use("/api/user", userRoutes);
app.use("/api/collective", collectiveRoutes);
app.use("/api/farmer", farmerGroupRoutes);
app.use("/api/ai", aiRoutes);

app.get("/", (req, res) => {
  res.json({ message: "FarmFresh backend is running" });
});

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err);

  if (err.name === "ZodError") {
    return res.status(400).json({
      success: false,
      message: err.issues[0].message,
    });
  }

  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: `Invalid ID format for ${err.path || "field"}`,
    });
  }

  res.status(err.statusCode || 500).json({
    success: err.success ?? false,
    message: err.message || "Internal server error",
  });
});

// Server
const PORT = process.env.PORT || 6000;

app.listen(PORT, () => {
  console.log(`Server is running at port ${PORT}`);
});
