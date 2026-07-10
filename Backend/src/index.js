import express from "express";
import cors from "cors";
import "dotenv/config";
import dbConnect from "./config/dbConnect.js";
import seedCounters from "./scripts/seedCounters.js";
import seedCrops from "./scripts/seedData.js";

import authRoutes from "./routes/auth.routes.js";
import collectiveRoutes from "./routes/collective.routes.js";
import commonRoutes from "./routes/common.routes.js";

await dbConnect();
await seedCounters();
await seedCrops();

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
app.use("/api/user/collective", collectiveRoutes);
app.use("/api/data", commonRoutes);

app.get("/", (req, res) => {
  res.json({ message: "FarmFresh backend is running" });
});

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err);

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
