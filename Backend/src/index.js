import express from "express";
import dotenv from "dotenv";
import dbConnect from "./config/dbConnect.js";

dotenv.config();
dbConnect();


const app = express();

// Middlewares
app.use(express.json());

// Routes

// Server
const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server is running at port ${PORT}`);
});