import Driver from "../../models/driver.model.js";
import Zone from "../../models/zone.model.js";
import generateId from "../idGenerator.service.js";
import uploadFile from "../../utils/uploadFile.js";
import throwErr from "../../utils/throwErr.js";

// ── Add Driver ────────────────────────────────────────────────────────────────
const addDriver = async (collectiveId, { name, phone, license, vehicleNumber, capacity, zones }, imageFile) => {
  if (!name || !phone || !license || !vehicleNumber || capacity === undefined)
    throwErr(400, "name, phone, license, vehicleNumber, and capacity are required !!");

  if (typeof zones === "string") {
    try { zones = JSON.parse(zones); } catch { zones = []; }
  }

  // Validate zones belong to this collective
  if (zones && zones.length > 0) {
    const validZones = await Zone.find({
      _id: { $in: zones },
      collective: collectiveId,
      status: "ACTIVE",
    });
    if (validZones.length !== zones.length)
      throwErr(400, "Some zone IDs are invalid or don't belong to your collective !!");
  }

  const driverId = await generateId("driver");
  const driver = new Driver({
    collective: collectiveId,
    driverId,
    name: name.trim(),
    phone: phone.trim(),
    license: license.trim(),
    vehicleNumber: vehicleNumber.trim().toUpperCase(),
    capacity: Number(capacity),
    zones: zones || [],
  });

  await driver.save();

  // Optional driver photo — uploaded under Farmfresh/drivers/[DRIVER_ID]
  if (imageFile) {
    const result = await uploadFile(imageFile.buffer, "Farmfresh/drivers", driverId);
    driver.profile = result.secure_url;
    await driver.save();
  }

  return { success: true, message: "Driver added successfully !!", driver };
};

// ── Get Drivers ───────────────────────────────────────────────────────────────
const getDrivers = async (collectiveId) => {
  const drivers = await Driver.find({ collective: collectiveId, status: { $ne: "INACTIVE" } })
    .populate("zones", "name color")
    .lean();

  return { success: true, message: "Drivers fetched successfully", drivers };
};

// ── Edit Driver ───────────────────────────────────────────────────────────────
const editDriver = async (collectiveId, driverId, updates, imageFile) => {
  const driver = await Driver.findOne({ _id: driverId, collective: collectiveId, status: { $ne: "INACTIVE" } });
  if (!driver) throwErr(404, "Driver not found !!");

  const { name, phone, license, vehicleNumber, capacity, zones, status } = updates;

  if (name) driver.name = name.trim();
  if (phone) driver.phone = phone.trim();
  if (license) driver.license = license.trim();
  if (vehicleNumber) driver.vehicleNumber = vehicleNumber.trim().toUpperCase();
  if (capacity !== undefined) driver.capacity = Number(capacity);
  if (status && ["AVAILABLE", "ASSIGNED", "ONROUTE"].includes(status)) driver.status = status;

  if (typeof zones === "string") {
    try { zones = JSON.parse(zones); } catch { zones = []; }
  }

  if (zones) {
    const validZones = await Zone.find({
      _id: { $in: zones },
      collective: collectiveId,
      status: "ACTIVE",
    });
    if (validZones.length !== zones.length)
      throwErr(400, "Some zone IDs are invalid !!");
    driver.zones = zones;
  }

  // Optional photo replacement — keeps the same public_id so the old file is overwritten
  if (imageFile) {
    const result = await uploadFile(
      imageFile.buffer,
      "Farmfresh/drivers",
      driver.driverId || `DR${driver._id}`,
    );
    driver.profile = result.secure_url;
  }

  await driver.save();
  return { success: true, message: "Driver updated successfully !!", driver };
};

// ── Delete (Soft) Driver ──────────────────────────────────────────────────────
const deleteDriver = async (collectiveId, driverId) => {
  const driver = await Driver.findOne({ _id: driverId, collective: collectiveId, status: { $ne: "INACTIVE" } });
  if (!driver) throwErr(404, "Driver not found !!");

  driver.status = "INACTIVE";
  await driver.save();

  return { success: true, message: "Driver removed successfully !!" };
};

export default { addDriver, getDrivers, editDriver, deleteDriver };
