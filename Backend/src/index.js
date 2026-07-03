// import express from "express";
// import dotenv from "dotenv";
// import authRoutes from "./routes/authRoutes.js";
// import farmerGroupRoutes from "./routes/farmerGroupRoutes.js";
// import collectionRoutes from "./routes/collectionRoutes.js";

// dotenv.config();
// const app = express();

// app.use(cors({
//   origin: "http://localhost:5173",
//   methods: ["GET", "POST", "PATCH", "DELETE"],
// }));

// app.use(express.json());

// app.use("/api/auth", authRoutes);
// app.use("/api/groups", farmerGroupRoutes);
// app.use("/api/collections", collectionRoutes);

// app.get("/", (req, res) => {
//   res.json({ message: "FarmFresh API is running" });
// });

// app.use((req, res) => {
//   res.status(404).json({ message: "Route not found" });
// });

// app.use((err, req, res, next) => {
//   console.error(err.stack);
//   res.status(500).json({ message: "Internal server error" });
// });

// const PORT = process.env.PORT || 5001;

// app.listen(PORT, () => {
//   console.log(`Server running on http://localhost:${PORT}`);
// });


import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import dbConnect from "./config/dbConnect.js";
import authRoutes from "./routes/authRoutes.js"
import userRoutes from "./routes/userRoutes.js"

dotenv.config();
dbConnect();


const app = express();

app.use(cors({
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "PATCH", "DELETE"],
  credentials: true
}));

// Middlewares
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

// Server
const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server is running at port ${PORT}`);
});