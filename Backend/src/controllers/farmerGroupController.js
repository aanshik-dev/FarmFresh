import { readDB, writeDB } from "../config/db.js";

const getAllGroups = (req, res) => {
  try {
    const db = readDB();
    const { zone, status } = req.query;

    let groups = db.farmerGroups;

    if (zone) {
      groups = groups.filter(
        (g) => g.zone.toLowerCase() === zone.toLowerCase()
      );
    }

    if (status) {
      groups = groups.filter(
        (g) => g.status.toLowerCase() === status.toLowerCase()
      );
    }

    res.status(200).json(groups);
  } catch (err) {
    res.status(500).json({ message: "Could not fetch farmer groups" });
  }
};

const getGroupById = (req, res) => {
  try {
    const db = readDB();
    const group = db.farmerGroups.find((g) => g.id === req.params.id);

    if (!group) {
      return res.status(404).json({ message: "Farmer group not found" });
    }

    res.status(200).json(group);
  } catch (err) {
    res.status(500).json({ message: "Could not fetch farmer group" });
  }
};

const createGroup = (req, res) => {
  try {
    const {
      groupName,
      address,
      distance,
      leadFarmer,
      phone,
      email,
      zone,
      crops,
    } = req.body;

    if (!groupName || !leadFarmer || !zone || !email) {
      return res
        .status(400)
        .json({ message: "groupName, leadFarmer, zone, and email are required" });
    }

    const db = readDB();

    const newGroup = {
      id: "fg" + Date.now(),
      groupName,
      address: address || "",
      distance: distance || "",
      leadFarmer,
      yield: "0 kg",
      phone: phone || "",
      email,
      zone,
      status: "Monitoring",
      crops: crops || [],
      lastUpdated: new Date().toISOString(),
      profile: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400",
      banner: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1200",
    };

    db.farmerGroups.push(newGroup);
    writeDB(db);

    res.status(201).json(newGroup);
  } catch (err) {
    res.status(500).json({ message: "Could not create farmer group" });
  }
};

const updateGroupStatus = (req, res) => {
  try {
    const db = readDB();
    const groupIndex = db.farmerGroups.findIndex((g) => g.id === req.params.id);

    if (groupIndex === -1) {
      return res.status(404).json({ message: "Farmer group not found" });
    }

    const { status, yield: yieldKg, crops } = req.body;

    const VALID_STATUSES = ["Ready", "Monitoring", "Collected"];
    if (status && !VALID_STATUSES.includes(status)) {
      return res
        .status(400)
        .json({ message: `Status must be one of: ${VALID_STATUSES.join(", ")}` });
    }

    if (status) db.farmerGroups[groupIndex].status = status;
    if (yieldKg) db.farmerGroups[groupIndex].yield = yieldKg;
    if (crops) db.farmerGroups[groupIndex].crops = crops;
    db.farmerGroups[groupIndex].lastUpdated = new Date().toISOString();

    writeDB(db);

    res.status(200).json(db.farmerGroups[groupIndex]);
  } catch (err) {
    res.status(500).json({ message: "Could not update farmer group" });
  }
};

const deleteGroup = (req, res) => {
  try {
    const db = readDB();
    const groupIndex = db.farmerGroups.findIndex((g) => g.id === req.params.id);

    if (groupIndex === -1) {
      return res.status(404).json({ message: "Farmer group not found" });
    }

    db.farmerGroups.splice(groupIndex, 1);
    writeDB(db);

    res.status(200).json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Could not delete farmer group" });
  }
};

export { getAllGroups, getGroupById, createGroup, updateGroupStatus, deleteGroup };
