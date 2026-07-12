import express from "express";
import getAllCrops from "../controllers/common.controller.js";

const router = express.Router();

router.get("/crops", getAllCrops);

export default router;
