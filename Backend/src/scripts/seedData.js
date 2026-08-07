import Crop from "../models/crop.model.js";
import generateId from "../services/idGenerator.service.js";

const crops = [
  // Cereals / Grains
  {
    name: "Rice",
    category: "Grain",
    season: "Kharif",
    image: "https://loremflickr.com/800/600/rice,crop",
  },
  {
    name: "Wheat",
    category: "Grain",
    season: "Rabi",
    image: "https://loremflickr.com/800/600/wheat,crop",
  },
  {
    name: "Maize",
    category: "Grain",
    season: "Kharif",
    image: "https://loremflickr.com/800/600/maize,crop",
  },
  {
    name: "Barley",
    category: "Grain",
    season: "Rabi",
    image: "https://loremflickr.com/800/600/barley,crop",
  },
  {
    name: "Jowar (Sorghum)",
    category: "Grain",
    season: "Kharif",
    image: "https://loremflickr.com/800/600/sorghum,crop",
  },
  {
    name: "Bajra (Pearl Millet)",
    category: "Grain",
    season: "Kharif",
    image: "https://loremflickr.com/800/600/pearl,millet,crop",
  },
  {
    name: "Ragi (Finger Millet)",
    category: "Grain",
    season: "Kharif",
    image: "https://loremflickr.com/800/600/finger,millet,crop",
  },
  {
    name: "Oats",
    category: "Grain",
    season: "Rabi",
    image: "https://loremflickr.com/800/600/oats,crop",
  },

  // Pulses
  {
    name: "Chickpea (Gram)",
    category: "Pulse",
    season: "Rabi",
    image: "https://loremflickr.com/800/600/chickpea,crop",
  },
  {
    name: "Pigeon Pea (Arhar)",
    category: "Pulse",
    season: "Kharif",
    image: "https://loremflickr.com/800/600/pigeon,pea,crop",
  },
  {
    name: "Green Gram (Moong)",
    category: "Pulse",
    season: "Kharif",
    image: "https://loremflickr.com/800/600/mung,bean,crop",
  },
  {
    name: "Black Gram (Urad)",
    category: "Pulse",
    season: "Kharif",
    image: "https://loremflickr.com/800/600/black,gram,crop",
  },
  {
    name: "Lentil (Masoor)",
    category: "Pulse",
    season: "Rabi",
    image: "https://loremflickr.com/800/600/lentil,crop",
  },
  {
    name: "Field Pea",
    category: "Pulse",
    season: "Rabi",
    image: "https://loremflickr.com/800/600/field,pea,crop",
  },
  {
    name: "Cowpea",
    category: "Pulse",
    season: "Kharif",
    image: "https://loremflickr.com/800/600/cowpea,crop",
  },

  // Oilseeds
  {
    name: "Mustard",
    category: "Oilseed",
    season: "Rabi",
    image: "https://loremflickr.com/800/600/mustard,field",
  },
  {
    name: "Soybean",
    category: "Oilseed",
    season: "Kharif",
    image: "https://loremflickr.com/800/600/soybean,crop",
  },
  {
    name: "Groundnut",
    category: "Oilseed",
    season: "Kharif",
    image: "https://loremflickr.com/800/600/groundnut,peanut,crop",
  },
  {
    name: "Sunflower",
    category: "Oilseed",
    season: "Rabi",
    image: "https://loremflickr.com/800/600/sunflower,crop",
  },
  {
    name: "Sesame (Til)",
    category: "Oilseed",
    season: "Kharif",
    image: "https://loremflickr.com/800/600/sesame,crop",
  },
  {
    name: "Castor",
    category: "Oilseed",
    season: "Kharif",
    image: "https://loremflickr.com/800/600/castor,plant",
  },
  {
    name: "Safflower",
    category: "Oilseed",
    season: "Rabi",
    image: "https://loremflickr.com/800/600/safflower,crop",
  },
  {
    name: "Linseed",
    category: "Oilseed",
    season: "Rabi",
    image: "https://loremflickr.com/800/600/flax,linseed,crop",
  },

  // Cash Crops
  {
    name: "Sugarcane",
    category: "Cash Crop",
    season: "Annual",
    image: "https://loremflickr.com/800/600/sugarcane,field",
  },
  {
    name: "Cotton",
    category: "Cash Crop",
    season: "Kharif",
    image: "https://loremflickr.com/800/600/cotton,plant",
  },
  {
    name: "Jute",
    category: "Cash Crop",
    season: "Kharif",
    image: "https://loremflickr.com/800/600/jute,plant",
  },
  {
    name: "Tobacco",
    category: "Cash Crop",
    season: "Rabi",
    image: "https://loremflickr.com/800/600/tobacco,plant",
  },

  // Plantation Crops
  {
    name: "Tea",
    category: "Plantation",
    season: "Perennial",
    image: "https://loremflickr.com/800/600/tea,plantation",
  },
  {
    name: "Coffee",
    category: "Plantation",
    season: "Perennial",
    image: "https://loremflickr.com/800/600/coffee,plantation",
  },
  {
    name: "Rubber",
    category: "Plantation",
    season: "Perennial",
    image: "https://loremflickr.com/800/600/rubber,plantation",
  },
  {
    name: "Coconut",
    category: "Plantation",
    season: "Perennial",
    image: "https://loremflickr.com/800/600/coconut,palm",
  },
  {
    name: "Arecanut",
    category: "Plantation",
    season: "Perennial",
    image: "https://loremflickr.com/800/600/areca,palm",
  },
  {
    name: "Cocoa",
    category: "Plantation",
    season: "Perennial",
    image: "https://loremflickr.com/800/600/cocoa,plant",
  },

  // Vegetables
  {
    name: "Potato",
    category: "Vegetable",
    season: "Rabi",
    image: "https://loremflickr.com/800/600/potato,crop",
  },
  {
    name: "Onion",
    category: "Vegetable",
    season: "Rabi",
    image: "https://loremflickr.com/800/600/onion,crop",
  },
  {
    name: "Tomato",
    category: "Vegetable",
    season: "Rabi",
    image: "https://loremflickr.com/800/600/tomato,plant",
  },
  {
    name: "Brinjal (Eggplant)",
    category: "Vegetable",
    season: "Rabi",
    image: "https://loremflickr.com/800/600/eggplant,brinjal",
  },
  {
    name: "Chilli",
    category: "Vegetable",
    season: "Rabi",
    image: "https://loremflickr.com/800/600/chilli,pepper,plant",
  },
  {
    name: "Capsicum",
    category: "Vegetable",
    season: "Rabi",
    image: "https://loremflickr.com/800/600/bell,pepper,plant",
  },
  {
    name: "Cabbage",
    category: "Vegetable",
    season: "Rabi",
    image: "https://loremflickr.com/800/600/cabbage,vegetable",
  },
  {
    name: "Cauliflower",
    category: "Vegetable",
    season: "Rabi",
    image: "https://loremflickr.com/800/600/cauliflower,vegetable",
  },
  {
    name: "Peas",
    category: "Vegetable",
    season: "Rabi",
    image: "https://loremflickr.com/800/600/green,peas",
  },
  {
    name: "Carrot",
    category: "Vegetable",
    season: "Rabi",
    image: "https://loremflickr.com/800/600/carrot,crop",
  },
  {
    name: "Radish",
    category: "Vegetable",
    season: "Rabi",
    image: "https://loremflickr.com/800/600/radish,crop",
  },
  {
    name: "Beetroot",
    category: "Vegetable",
    season: "Rabi",
    image: "https://loremflickr.com/800/600/beetroot,crop",
  },
  {
    name: "Spinach",
    category: "Vegetable",
    season: "Rabi",
    image: "https://loremflickr.com/800/600/spinach,plant",
  },
  {
    name: "Fenugreek (Methi)",
    category: "Vegetable",
    season: "Rabi",
    image: "https://loremflickr.com/800/600/fenugreek,methi",
  },
  {
    name: "Okra (Lady Finger)",
    category: "Vegetable",
    season: "Kharif",
    image: "https://loremflickr.com/800/600/okra,ladyfinger",
  },
  {
    name: "Bottle Gourd",
    category: "Vegetable",
    season: "Kharif",
    image: "https://loremflickr.com/800/600/bottle,gourd",
  },
  {
    name: "Bitter Gourd",
    category: "Vegetable",
    season: "Kharif",
    image: "https://loremflickr.com/800/600/bitter,gourd",
  },
  {
    name: "Ridge Gourd",
    category: "Vegetable",
    season: "Kharif",
    image: "https://loremflickr.com/800/600/ridge,gourd",
  },
  {
    name: "Pumpkin",
    category: "Vegetable",
    season: "Kharif",
    image: "https://loremflickr.com/800/600/pumpkin,crop",
  },
  {
    name: "Cucumber",
    category: "Vegetable",
    season: "Kharif",
    image: "https://loremflickr.com/800/600/cucumber,plant",
  },
  {
    name: "Beans",
    category: "Vegetable",
    season: "Kharif",
    image: "https://loremflickr.com/800/600/green,beans,plant",
  },
  {
    name: "Garlic",
    category: "Vegetable",
    season: "Rabi",
    image: "https://loremflickr.com/800/600/garlic,crop",
  },
  {
    name: "Ginger",
    category: "Vegetable",
    season: "Kharif",
    image: "https://loremflickr.com/800/600/ginger,plant",
  },

  // Fruits
  {
    name: "Mango",
    category: "Fruit",
    season: "Summer",
    image: "https://loremflickr.com/800/600/mango,fruit",
  },
  {
    name: "Banana",
    category: "Fruit",
    season: "Perennial",
    image: "https://loremflickr.com/800/600/banana,fruit",
  },
  {
    name: "Apple",
    category: "Fruit",
    season: "Temperate",
    image: "https://loremflickr.com/800/600/apple,fruit",
  },
  {
    name: "Orange",
    category: "Fruit",
    season: "Winter",
    image: "https://loremflickr.com/800/600/orange,fruit",
  },
  {
    name: "Lemon",
    category: "Fruit",
    season: "Perennial",
    image: "https://loremflickr.com/800/600/lemon,fruit",
  },
  {
    name: "Guava",
    category: "Fruit",
    season: "Winter",
    image: "https://loremflickr.com/800/600/guava,fruit",
  },
  {
    name: "Papaya",
    category: "Fruit",
    season: "Perennial",
    image: "https://loremflickr.com/800/600/papaya,fruit",
  },
  {
    name: "Pomegranate",
    category: "Fruit",
    season: "Perennial",
    image: "https://loremflickr.com/800/600/pomegranate,fruit",
  },
  {
    name: "Grapes",
    category: "Fruit",
    season: "Winter",
    image: "https://loremflickr.com/800/600/grapes,fruit",
  },
  {
    name: "Watermelon",
    category: "Fruit",
    season: "Summer",
    image: "https://loremflickr.com/800/600/watermelon,fruit",
  },
  {
    name: "Muskmelon",
    category: "Fruit",
    season: "Summer",
    image: "https://loremflickr.com/800/600/muskmelon,fruit",
  },
  {
    name: "Pineapple",
    category: "Fruit",
    season: "Perennial",
    image: "https://loremflickr.com/800/600/pineapple,fruit",
  },
  {
    name: "Litchi",
    category: "Fruit",
    season: "Summer",
    image: "https://loremflickr.com/800/600/lychee,litchi,fruit",
  },
  {
    name: "Jackfruit",
    category: "Fruit",
    season: "Summer",
    image: "https://loremflickr.com/800/600/jackfruit,fruit",
  },
  {
    name: "Custard Apple",
    category: "Fruit",
    season: "Monsoon",
    image: "https://loremflickr.com/800/600/custard,apple,fruit",
  },
  {
    name: "Pear",
    category: "Fruit",
    season: "Temperate",
    image: "https://loremflickr.com/800/600/pear,fruit",
  },
  {
    name: "Peach",
    category: "Fruit",
    season: "Temperate",
    image: "https://loremflickr.com/800/600/peach,fruit",
  },
  {
    name: "Plum",
    category: "Fruit",
    season: "Temperate",
    image: "https://loremflickr.com/800/600/plum,fruit",
  },
  {
    name: "Kiwi",
    category: "Fruit",
    season: "Temperate",
    image: "https://loremflickr.com/800/600/kiwi,fruit",
  },
  {
    name: "Strawberry",
    category: "Fruit",
    season: "Winter",
    image: "https://loremflickr.com/800/600/strawberry,fruit",
  },

  // Spices
  {
    name: "Turmeric",
    category: "Spice",
    season: "Kharif",
    image: "https://loremflickr.com/800/600/turmeric,plant",
  },
  {
    name: "Black Pepper",
    category: "Spice",
    season: "Perennial",
    image: "https://loremflickr.com/800/600/black,pepper,plant",
  },
  {
    name: "Cardamom",
    category: "Spice",
    season: "Perennial",
    image: "https://loremflickr.com/800/600/cardamom,plant",
  },
  {
    name: "Coriander",
    category: "Spice",
    season: "Rabi",
    image: "https://loremflickr.com/800/600/coriander,plant",
  },
  {
    name: "Cumin",
    category: "Spice",
    season: "Rabi",
    image: "https://loremflickr.com/800/600/cumin,plant",
  },
  {
    name: "Fennel",
    category: "Spice",
    season: "Rabi",
    image: "https://loremflickr.com/800/600/fennel,plant",
  },
  {
    name: "Clove",
    category: "Spice",
    season: "Perennial",
    image: "https://loremflickr.com/800/600/clove,spice",
  },
  {
    name: "Cinnamon",
    category: "Spice",
    season: "Perennial",
    image: "https://loremflickr.com/800/600/cinnamon,tree",
  },

  // Fodder
  {
    name: "Napier Grass",
    category: "Fodder",
    season: "Perennial",
    image: "https://loremflickr.com/800/600/napier,grass",
  },
  {
    name: "Berseem",
    category: "Fodder",
    season: "Rabi",
    image: "https://loremflickr.com/800/600/berseem,grass",
  },
  {
    name: "Lucerne",
    category: "Fodder",
    season: "Perennial",
    image: "https://loremflickr.com/800/600/lucerne,alfalfa",
  },

  // Tubers
  {
    name: "Sweet Potato",
    category: "Tuber",
    season: "Kharif",
    image: "https://loremflickr.com/800/600/sweet,potato,crop",
  },
  {
    name: "Cassava (Tapioca)",
    category: "Tuber",
    season: "Perennial",
    image: "https://loremflickr.com/800/600/cassava,tapioca",
  },
  {
    name: "Yam",
    category: "Tuber",
    season: "Kharif",
    image: "https://loremflickr.com/800/600/yam,tuber",
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
