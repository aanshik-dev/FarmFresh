import { readDB, writeDB } from "../config/db.js";

const getAllCollections = (req, res) => {
  try {
    const db = readDB();
    const { status, zone } = req.query;

    let collections = db.collections;

    if (status) {
      collections = collections.filter(
        (c) => c.status.toLowerCase() === status.toLowerCase()
      );
    }

    if (zone) {
      collections = collections.filter(
        (c) => c.zone.toLowerCase() === zone.toLowerCase()
      );
    }

    res.status(200).json(collections);
  } catch (err) {
    res.status(500).json({ message: "Could not fetch collections" });
  }
};

const scheduleCollection = (req, res) => {
  try {
    const { farmerGroupId, crops, quantityKg, scheduledDate, coordinatorNote } =
      req.body;

    if (!farmerGroupId || !crops || !quantityKg || !scheduledDate) {
      return res.status(400).json({
        message: "farmerGroupId, crops, quantityKg, and scheduledDate are required",
      });
    }

    const db = readDB();

    const group = db.farmerGroups.find((g) => g.id === farmerGroupId);
    if (!group) {
      return res
        .status(404)
        .json({ message: "Farmer group not found with that id" });
    }

    const newCollection = {
      id: "col" + Date.now(),
      farmerGroupId,
      farmerGroupName: group.groupName,
      zone: group.zone,
      crops,
      quantityKg,
      scheduledDate,
      status: "Scheduled",
      coordinatorNote: coordinatorNote || "",
      createdAt: new Date().toISOString(),
    };

    db.collections.push(newCollection);
    writeDB(db);

    res.status(201).json(newCollection);
  } catch (err) {
    res.status(500).json({ message: "Could not schedule collection" });
  }
};

const updateCollectionStatus = (req, res) => {
  try {
    const db = readDB();
    const colIndex = db.collections.findIndex((c) => c.id === req.params.id);

    if (colIndex === -1) {
      return res.status(404).json({ message: "Collection not found" });
    }

    const VALID_STATUSES = ["Scheduled", "In Transit", "Completed", "Cancelled"];
    const { status, coordinatorNote } = req.body;

    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        message: `Status must be one of: ${VALID_STATUSES.join(", ")}`,
      });
    }

    if (status) db.collections[colIndex].status = status;
    if (coordinatorNote !== undefined)
      db.collections[colIndex].coordinatorNote = coordinatorNote;

    writeDB(db);

    res.status(200).json(db.collections[colIndex]);
  } catch (err) {
    res.status(500).json({ message: "Could not update collection" });
  }
};

export { getAllCollections, scheduleCollection, updateCollectionStatus };
