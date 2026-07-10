import Crop from "../models/crop.model.js";
import generateId from "../services/idGenerator.service.js";

const crops = [
  {
    name: "Rice",
    category: "Grain",
    season: "Kharif",
    image: "",
  },
  {
    name: "Wheat",
    category: "Grain",
    season: "Rabi",
    image: "",
  },
  {
    name: "Maize",
    category: "Grain",
    season: "Kharif",
    image: "",
  },
  {
    name: "Mustard",
    category: "Oilseed",
    season: "Rabi",
    image: "",
  },
  {
    name: "Soybean",
    category: "Oilseed",
    season: "Kharif",
    image: "",
  },
  {
    name: "Sugarcane",
    category: "Cash Crop",
    season: "Kharif",
    image: "",
  },
  {
    name: "Potato",
    category: "Tuber",
    season: "Rabi",
    image: "",
  },
  {
    name: "Onion",
    category: "Vegetable",
    season: "Rabi",
    image: "",
  },
  {
    name: "Tomato",
    category: "Vegetable",
    season: "Rabi",
    image: "",
  },
  {
    name: "Brinjal",
    category: "Vegetable",
    season: "Rabi",
    image: "",
  },
  {
    name: "Chilli",
    category: "Vegetable",
    season: "Rabi",
    image: "",
  },
  {
    name: "Cabbage",
    category: "Vegetable",
    season: "Rabi",
    image: "",
  },
  {
    name: "Cauliflower",
    category: "Vegetable",
    season: "Rabi",
    image: "",
  },
  {
    name: "Peas",
    category: "Vegetable",
    season: "Rabi",
    image: "",
  },
  {
    name: "Cotton",
    category: "Cash Crop",
    season: "Kharif",
    image: "",
  },
  {
    name: "Jute",
    category: "Cash Crop",
    season: "Kharif",
    image: "",
  },
];

const seedCrops = async () => {
  try {
    for (const crop of crops) {
      const existingCrop = await Crop.findOne({ name: crop.name });
      if (existingCrop) {
        continue;
      }
      const code = await generateId("crop");
      await Crop.create({
        code: code,
        name: crop.name,
        category: crop.category,
        season: crop.season,
        image: crop.image,
      });
    }
    console.log("✅ Crop seeding completed.");
  } catch (error) {
    console.error("❌ Crop seeding failed.", error);
  }
};

export default seedCrops;
