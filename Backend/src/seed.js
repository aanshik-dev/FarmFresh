import mongoose from "mongoose";
import "dotenv/config";
import dbConnect from "./config/dbConnect.js";
import User from "./models/user.model.js";
import FarmerGroup from "./models/farmerGroup.model.js";
import Collective from "./models/collective.model.js";

const seedData = async () => {
  await dbConnect();

  try {
    // Clear old data
    await User.deleteMany({});
    await FarmerGroup.deleteMany({});
    await Collective.deleteMany({});

    // ─── Collectives ───────────────────────────────────────
    const userC1 = await User.create({
      uid: "FF-COL-001",
      username: "coordination@mandakini-organic.org",
      phone: "9137226421",
      password: "password123",
      role: "COLLECTIVE",
    });
    const col1 = await Collective.create({
      _id: userC1._id,
      cid: "COL-001",
      name: "Mandakini Organic Collective",
      email: userC1.username,
      phone: userC1.phone,
      profile: "https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=400",
      workers: 45,
      ratingAvg: 4.8,
      desc: "The premier organic produce collective in the Kedarnath corridor, operating since 2018.",
      address: { area: "Rudraprayag District", city: "Uttarakhand", state: "Uttarakhand", pincode: "246171" },
    });

    const userC2 = await User.create({
      uid: "FF-COL-002",
      username: "info@kedarnathvalley.in",
      phone: "9760012345",
      password: "password123",
      role: "COLLECTIVE",
    });
    const col2 = await Collective.create({
      _id: userC2._id,
      cid: "COL-002",
      name: "Kedarnath Valley Organics",
      email: userC2.username,
      phone: userC2.phone,
      profile: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400",
      workers: 28,
      ratingAvg: 4.5,
      desc: "Focused on mid-altitude crops, serving Zone A and B farmer groups.",
      address: { area: "Okhimath", city: "Rudraprayag", state: "Uttarakhand", pincode: "246473" },
    });

    const userC3 = await User.create({
      uid: "FF-COL-003",
      username: "alliance@rudraprayag.in",
      phone: "9876054321",
      password: "password123",
      role: "COLLECTIVE",
    });
    const col3 = await Collective.create({
      _id: userC3._id,
      cid: "COL-003",
      name: "Rudraprayag Farmers Alliance",
      email: userC3.username,
      phone: userC3.phone,
      profile: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
      workers: 32,
      ratingAvg: 4.6,
      desc: "Specializing in fresh vegetables and spices for the Rishikesh-Haridwar market.",
      address: { area: "Agastmuni", city: "Rudraprayag", state: "Uttarakhand", pincode: "246421" },
    });

    // ─── Farmer Groups ─────────────────────────────────────
    const userF1 = await User.create({
      uid: "FF-FG-001",
      username: "debendra@pulsecollective.in",
      phone: "9412078234",
      password: "password123",
      role: "FARMER",
    });
    await FarmerGroup.create({
      _id: userF1._id,
      fid: "FG-001",
      name: "Triyuginarayan Organic Pulse Pioneers",
      leadfarmer: "Debendra Semwal",
      email: userF1.username,
      phone: userF1.phone,
      farmerCount: 12,
      profile: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400",
      desc: "We grow high-altitude organic rajma and red rice in the sacred Triyuginarayan valley.",
      address: { area: "Triyuginarayan", village: "Triyuginarayan", district: "Rudraprayag", state: "Uttarakhand", pinCode: "246453" },
      coord: { lat: "30.7", long: "79.1" },
    });

    const userF2 = await User.create({
      uid: "FF-FG-002",
      username: "anita@mandalgrowers.in",
      phone: "9876543210",
      password: "password123",
      role: "FARMER",
    });
    await FarmerGroup.create({
      _id: userF2._id,
      fid: "FG-002",
      name: "Mandal Valley Growers",
      leadfarmer: "Anita Rawat",
      email: userF2.username,
      phone: userF2.phone,
      farmerCount: 18,
      profile: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400",
      desc: "Family-run collective of 18 farmers growing premium mountain potatoes.",
      address: { area: "Mandal Valley", village: "Mandal", district: "Chamoli", state: "Uttarakhand", pinCode: "246401" },
      coord: { lat: "30.58", long: "79.0" },
    });

    const userF3 = await User.create({
      uid: "FF-FG-003",
      username: "mahesh@kedarcollective.in",
      phone: "9123456789",
      password: "password123",
      role: "FARMER",
    });
    await FarmerGroup.create({
      _id: userF3._id,
      fid: "FG-003",
      name: "Kedar Highlands Collective",
      leadfarmer: "Mahesh Rana",
      email: userF3.username,
      phone: userF3.phone,
      farmerCount: 8,
      profile: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400",
      desc: "High-altitude group known for the finest rajma in the Kedarnath corridor.",
      address: { area: "Kedarnath Route", village: "Kedarnath", district: "Rudraprayag", state: "Uttarakhand", pinCode: "246445" },
      coord: { lat: "30.73", long: "79.07" },
    });

    const userF4 = await User.create({
      uid: "FF-FG-004",
      username: "pooja@guptkashi.in",
      phone: "9988766554",
      password: "password123",
      role: "FARMER",
    });
    await FarmerGroup.create({
      _id: userF4._id,
      fid: "FG-004",
      name: "Guptkashi Green Farms",
      leadfarmer: "Pooja Negi",
      email: userF4.username,
      phone: userF4.phone,
      farmerCount: 24,
      profile: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400",
      desc: "Largest group in Zone A, specializing in fresh green vegetables.",
      address: { area: "Guptkashi", village: "Guptkashi", district: "Rudraprayag", state: "Uttarakhand", pinCode: "246409" },
      coord: { lat: "30.52", long: "79.04" },
    });

    const userF5 = await User.create({
      uid: "FF-FG-005",
      username: "rakesh@sonprayag.in",
      phone: "9765432109",
      password: "password123",
      role: "FARMER",
    });
    await FarmerGroup.create({
      _id: userF5._id,
      fid: "FG-005",
      name: "Sonprayag Mountain Harvesters",
      leadfarmer: "Rakesh Bisht",
      email: userF5.username,
      phone: userF5.phone,
      farmerCount: 15,
      profile: "https://images.unsplash.com/photo-1504593811423-6dd665756598?w=400",
      desc: "Expert growers of organic turmeric and millets at 2,000m elevation.",
      address: { area: "Sonprayag", village: "Sonprayag", district: "Rudraprayag", state: "Uttarakhand", pinCode: "246487" },
      coord: { lat: "30.63", long: "79.02" },
    });

    // ─── Admin ─────────────────────────────────────────────
    await User.create({
      uid: "FF-ADMIN-001",
      username: "admin@farmfresh.com",
      phone: "9999999990",
      password: "password123",
      role: "ADMIN",
    });

    console.log("✅ Database seeded successfully with realistic FarmFresh data!");
  } catch (error) {
    console.error("Error seeding database:", error.message);
  } finally {
    process.exit(0);
  }
};

seedData();
