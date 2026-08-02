import Crop from "../models/crop.model.js";
import generateId from "../services/idGenerator.service.js";

const crops = [
  // Cereals / Grains
  { name: "Rice", category: "Grain", season: "Kharif", image: "" },
  { name: "Wheat", category: "Grain", season: "Rabi", image: "" },
  { name: "Maize", category: "Grain", season: "Kharif", image: "" },
  { name: "Barley", category: "Grain", season: "Rabi", image: "" },
  { name: "Jowar (Sorghum)", category: "Grain", season: "Kharif", image: "" },
  {
    name: "Bajra (Pearl Millet)",
    category: "Grain",
    season: "Kharif",
    image: "",
  },
  {
    name: "Ragi (Finger Millet)",
    category: "Grain",
    season: "Kharif",
    image: "",
  },
  { name: "Oats", category: "Grain", season: "Rabi", image: "" },

  // Pulses
  { name: "Chickpea (Gram)", category: "Pulse", season: "Rabi", image: "" },
  {
    name: "Pigeon Pea (Arhar)",
    category: "Pulse",
    season: "Kharif",
    image: "",
  },
  {
    name: "Green Gram (Moong)",
    category: "Pulse",
    season: "Kharif",
    image: "",
  },
  { name: "Black Gram (Urad)", category: "Pulse", season: "Kharif", image: "" },
  { name: "Lentil (Masoor)", category: "Pulse", season: "Rabi", image: "" },
  { name: "Field Pea", category: "Pulse", season: "Rabi", image: "" },
  { name: "Cowpea", category: "Pulse", season: "Kharif", image: "" },

  // Oilseeds
  { name: "Mustard", category: "Oilseed", season: "Rabi", image: "" },
  { name: "Soybean", category: "Oilseed", season: "Kharif", image: "" },
  { name: "Groundnut", category: "Oilseed", season: "Kharif", image: "" },
  { name: "Sunflower", category: "Oilseed", season: "Rabi", image: "" },
  { name: "Sesame (Til)", category: "Oilseed", season: "Kharif", image: "" },
  { name: "Castor", category: "Oilseed", season: "Kharif", image: "" },
  { name: "Safflower", category: "Oilseed", season: "Rabi", image: "" },
  { name: "Linseed", category: "Oilseed", season: "Rabi", image: "" },

  // Cash Crops
  { name: "Sugarcane", category: "Cash Crop", season: "Annual", image: "" },
  { name: "Cotton", category: "Cash Crop", season: "Kharif", image: "" },
  { name: "Jute", category: "Cash Crop", season: "Kharif", image: "" },
  { name: "Tobacco", category: "Cash Crop", season: "Rabi", image: "" },

  // Plantation Crops
  { name: "Tea", category: "Plantation", season: "Perennial", image: "" },
  { name: "Coffee", category: "Plantation", season: "Perennial", image: "" },
  { name: "Rubber", category: "Plantation", season: "Perennial", image: "" },
  { name: "Coconut", category: "Plantation", season: "Perennial", image: "" },
  { name: "Arecanut", category: "Plantation", season: "Perennial", image: "" },
  { name: "Cocoa", category: "Plantation", season: "Perennial", image: "" },

  // Vegetables
  { name: "Potato", category: "Vegetable", season: "Rabi", image: "" },
  { name: "Onion", category: "Vegetable", season: "Rabi", image: "" },
  { name: "Tomato", category: "Vegetable", season: "Rabi", image: "" },
  {
    name: "Brinjal (Eggplant)",
    category: "Vegetable",
    season: "Rabi",
    image: "",
  },
  { name: "Chilli", category: "Vegetable", season: "Rabi", image: "" },
  { name: "Capsicum", category: "Vegetable", season: "Rabi", image: "" },
  { name: "Cabbage", category: "Vegetable", season: "Rabi", image: "" },
  { name: "Cauliflower", category: "Vegetable", season: "Rabi", image: "" },
  { name: "Peas", category: "Vegetable", season: "Rabi", image: "" },
  { name: "Carrot", category: "Vegetable", season: "Rabi", image: "" },
  { name: "Radish", category: "Vegetable", season: "Rabi", image: "" },
  { name: "Beetroot", category: "Vegetable", season: "Rabi", image: "" },
  { name: "Spinach", category: "Vegetable", season: "Rabi", image: "" },
  {
    name: "Fenugreek (Methi)",
    category: "Vegetable",
    season: "Rabi",
    image: "",
  },
  {
    name: "Okra (Lady Finger)",
    category: "Vegetable",
    season: "Kharif",
    image: "",
  },
  { name: "Bottle Gourd", category: "Vegetable", season: "Kharif", image: "" },
  { name: "Bitter Gourd", category: "Vegetable", season: "Kharif", image: "" },
  { name: "Ridge Gourd", category: "Vegetable", season: "Kharif", image: "" },
  { name: "Pumpkin", category: "Vegetable", season: "Kharif", image: "" },
  { name: "Cucumber", category: "Vegetable", season: "Kharif", image: "" },
  { name: "Beans", category: "Vegetable", season: "Kharif", image: "" },
  { name: "Garlic", category: "Vegetable", season: "Rabi", image: "" },
  { name: "Ginger", category: "Vegetable", season: "Kharif", image: "" },

  // Fruits
  { name: "Mango", category: "Fruit", season: "Summer", image: "" },
  { name: "Banana", category: "Fruit", season: "Perennial", image: "" },
  { name: "Apple", category: "Fruit", season: "Temperate", image: "" },
  { name: "Orange", category: "Fruit", season: "Winter", image: "" },
  { name: "Lemon", category: "Fruit", season: "Perennial", image: "" },
  { name: "Guava", category: "Fruit", season: "Winter", image: "" },
  { name: "Papaya", category: "Fruit", season: "Perennial", image: "" },
  { name: "Pomegranate", category: "Fruit", season: "Perennial", image: "" },
  { name: "Grapes", category: "Fruit", season: "Winter", image: "" },
  { name: "Watermelon", category: "Fruit", season: "Summer", image: "" },
  { name: "Muskmelon", category: "Fruit", season: "Summer", image: "" },
  { name: "Pineapple", category: "Fruit", season: "Perennial", image: "" },
  { name: "Litchi", category: "Fruit", season: "Summer", image: "" },
  { name: "Jackfruit", category: "Fruit", season: "Summer", image: "" },
  { name: "Custard Apple", category: "Fruit", season: "Monsoon", image: "" },
  { name: "Pear", category: "Fruit", season: "Temperate", image: "" },
  { name: "Peach", category: "Fruit", season: "Temperate", image: "" },
  { name: "Plum", category: "Fruit", season: "Temperate", image: "" },
  { name: "Kiwi", category: "Fruit", season: "Temperate", image: "" },
  { name: "Strawberry", category: "Fruit", season: "Winter", image: "" },

  // Spices
  { name: "Turmeric", category: "Spice", season: "Kharif", image: "" },
  { name: "Black Pepper", category: "Spice", season: "Perennial", image: "" },
  { name: "Cardamom", category: "Spice", season: "Perennial", image: "" },
  { name: "Coriander", category: "Spice", season: "Rabi", image: "" },
  { name: "Cumin", category: "Spice", season: "Rabi", image: "" },
  { name: "Fennel", category: "Spice", season: "Rabi", image: "" },
  { name: "Clove", category: "Spice", season: "Perennial", image: "" },
  { name: "Cinnamon", category: "Spice", season: "Perennial", image: "" },

  // Fodder
  { name: "Napier Grass", category: "Fodder", season: "Perennial", image: "" },
  { name: "Berseem", category: "Fodder", season: "Rabi", image: "" },
  { name: "Lucerne", category: "Fodder", season: "Perennial", image: "" },

  // Tubers
  { name: "Sweet Potato", category: "Tuber", season: "Kharif", image: "" },
  {
    name: "Cassava (Tapioca)",
    category: "Tuber",
    season: "Perennial",
    image: "",
  },
  { name: "Yam", category: "Tuber", season: "Kharif", image: "" },
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
