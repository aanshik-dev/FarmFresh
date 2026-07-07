import User from "../models/user.model.js";
import FarmerGroup from "../models/farmerGroup.model.js";
import Collective from "../models/collective.model.js";

// Helper to generate IDs
const generateId = (prefix) => `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;

export const createFarmerGroup = async (req, res) => {
  try {
    const { name, leadfarmer, email, phone, desc } = req.body;
    const uid = generateId('FF-FG');
    
    // Create User first
    const user = new User({
      uid,
      username: email,
      phone,
      password: "password123", // default
      role: "FARMER"
    });
    await user.save();

    // Create FarmerGroup
    const fg = new FarmerGroup({
      _id: user._id,
      fid: uid.replace('FF-', ''),
      name,
      leadfarmer,
      email,
      phone,
      desc,
      address: { district: "Rudraprayag", state: "Uttarakhand" } // default for now
    });
    await fg.save();

    res.status(201).json({ message: "Farmer Group created successfully", data: fg });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateFarmerGroup = async (req, res) => {
  try {
    const { id } = req.params; // this is the fid, e.g. FG-001
    const updateData = req.body;
    
    const fg = await FarmerGroup.findOneAndUpdate({ fid: id }, updateData, { new: true });
    if (!fg) return res.status(404).json({ error: "Not found" });
    
    res.status(200).json({ message: "Updated successfully", data: fg });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteFarmerGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const fg = await FarmerGroup.findOneAndDelete({ fid: id });
    if (!fg) return res.status(404).json({ error: "Not found" });
    
    // Also delete user
    await User.findByIdAndDelete(fg._id);
    
    res.status(200).json({ message: "Deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createCollective = async (req, res) => {
  try {
    const { name, email, phone, desc } = req.body;
    const uid = generateId('FF-COL');
    
    const user = new User({
      uid,
      username: email,
      phone,
      password: "password123",
      role: "COLLECTIVE"
    });
    await user.save();

    const col = new Collective({
      _id: user._id,
      cid: uid.replace('FF-', ''),
      name,
      email,
      phone,
      desc,
      address: { city: "Rudraprayag", state: "Uttarakhand" }
    });
    await col.save();

    res.status(201).json({ message: "Collective created successfully", data: col });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateCollective = async (req, res) => {
  try {
    const { id } = req.params; // cid
    const updateData = req.body;
    
    const col = await Collective.findOneAndUpdate({ cid: id }, updateData, { new: true });
    if (!col) return res.status(404).json({ error: "Not found" });
    
    res.status(200).json({ message: "Updated successfully", data: col });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteCollective = async (req, res) => {
  try {
    const { id } = req.params;
    const col = await Collective.findOneAndDelete({ cid: id });
    if (!col) return res.status(404).json({ error: "Not found" });
    
    await User.findByIdAndDelete(col._id);
    
    res.status(200).json({ message: "Deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
