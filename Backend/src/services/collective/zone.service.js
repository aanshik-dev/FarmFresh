import Zone from "../../models/zone.model.js";
import Membership from "../../models/membership.model.js";
import throwErr from "../../utils/throwErr.js";

// ── Add Zone
const addZone = async (
  collectiveId,
  { name, area, direction, description, color },
) => {
  if (!name || !name.trim()) throwErr(400, "Zone name is required !!");

  const existing = await Zone.findOne({
    collective: collectiveId,
    name: name.trim(),
    status: "ACTIVE",
  });
  if (existing) throwErr(409, `A zone named "${name}" already exists !!`);

  const zone = new Zone({
    collective: collectiveId,
    name: name.trim(),
    area: area?.trim() || "",
    direction: direction?.trim() || "",
    description: description?.trim() || "",
    color: color || "#10b981",
  });
  await zone.save();

  return { success: true, message: "Zone added successfully !!", zone };
};

// ── Get Zones ─────────────────────────────────────────────────────────────────
const getZones = async (collectiveId) => {
  const zones = await Zone.find({
    collective: collectiveId,
    status: "ACTIVE",
  }).lean();

  // For each zone, count how many memberships are assigned to it
  const zoneIds = zones.map((z) => z._id);
  const membershipCounts = await Membership.aggregate([
    { $match: { zone: { $in: zoneIds } } },
    { $group: { _id: "$zone", count: { $sum: 1 } } },
  ]);
  const countMap = {};
  for (const mc of membershipCounts) countMap[mc._id.toString()] = mc.count;

  const zonesWithCount = zones.map((z) => ({
    ...z,
    farmerGroupCount: countMap[z._id.toString()] || 0,
  }));

  return {
    success: true,
    message: "Zones fetched successfully",
    zones: zonesWithCount,
  };
};

// ── Edit Zone ─────────────────────────────────────────────────────────────────
const editZone = async (collectiveId, zoneId, { name, area, direction, description, color }) => {
  const zone = await Zone.findOne({
    _id: zoneId,
    collective: collectiveId,
    status: "ACTIVE",
  });
  if (!zone) throwErr(404, "Zone not found !!");

  if (name) zone.name = name.trim();
  if (area !== undefined) zone.area = area.trim();
  if (direction !== undefined) zone.direction = direction.trim();
  if (description !== undefined) zone.description = description.trim();
  if (color) zone.color = color;

  await zone.save();
  return { success: true, message: "Zone updated successfully !!", zone };
};

// ── Delete (Soft) Zone ────────────────────────────────────────────────────────
const deleteZone = async (collectiveId, zoneId) => {
  const zone = await Zone.findOne({
    _id: zoneId,
    collective: collectiveId,
    status: "ACTIVE",
  });
  if (!zone) throwErr(404, "Zone not found !!");

  // Remove zone reference from all memberships assigned to it
  await Membership.updateMany({ zone: zoneId }, { $set: { zone: null } });

  zone.status = "INACTIVE";
  await zone.save();

  return { success: true, message: "Zone deleted successfully !!" };
};

// ── Assign Zone to a Membership ───────────────────────────────────────────────
const assignZone = async (collectiveId, membershipId, zoneId) => {
  const membership = await Membership.findOne({
    _id: membershipId,
    collective: collectiveId,
  });
  if (!membership) throwErr(404, "Membership not found !!");

  if (zoneId) {
    const zone = await Zone.findOne({
      _id: zoneId,
      collective: collectiveId,
      status: "ACTIVE",
    });
    if (!zone) throwErr(404, "Zone not found !!");
    membership.zone = zoneId;
  } else {
    membership.zone = null;
  }

  await membership.save();
  return {
    success: true,
    message: "Zone assigned successfully !!",
    membership,
  };
};

export default { addZone, getZones, editZone, deleteZone, assignZone };
