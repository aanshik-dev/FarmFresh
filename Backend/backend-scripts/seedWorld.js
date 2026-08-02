/**
 * seedWorld.js — Bot-simulated "living" world seed for FarmFresh.
 *
 * Simulates ~12 farmer groups + 5 collectives from Uttarakhand & Himachal
 * registering, completing profiles, growing crops, negotiating memberships,
 * scheduling pickups, and settling payments — at staggered, realistic times
 * spread across the last ~11 months.
 *
 * The seed is IDEMPOTENT: if any FARMER_GROUP user already exists it skips.
 * Use `node backend-scripts/seedWorld.js --reset` to wipe the world first.
 * All bot accounts share the password: Bot@1234
 *
 * Run:   node backend-scripts/seedWorld.js        (from Backend/)
 */

import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { pathToFileURL } from "node:url";

import dbConnect from "../src/config/dbConnect.js";
import seedCounters from "../src/scripts/seedCounters.js";

import User from "../src/models/user.model.js";
import FarmerGroup from "../src/models/farmerGroup.model.js";
import Collective from "../src/models/collective.model.js";
import Crop from "../src/models/crop.model.js";
import FarmerCrop from "../src/models/farmerCrop.model.js";
import CollectedCrop from "../src/models/collectedCrops.model.js";
import Membership from "../src/models/membership.model.js";
import CropDeal from "../src/models/cropDeal.model.js";
import Zone from "../src/models/zone.model.js";
import Driver from "../src/models/driver.model.js";
import Schedule from "../src/models/schedule.model.js";
import ScheduleItem from "../src/models/scheduleItem.model.js";
import PaymentTransaction from "../src/models/paymentTransaction.model.js";
import Announcement from "../src/models/announcement.model.js";
import Notification from "../src/models/notification.model.js";
import Review from "../src/models/review.model.js";
import generateId from "../src/services/idGenerator.service.js";

const BOT_PASSWORD = "Bot@1234";
const DAY = 86400000;

// Every crop referenced by collectives, farmers or stories must exist in the
// master crop list (seeded by seedData.js) — checked before seeding begins.
const REQUIRED_CROPS = [
  "Apple", "Pear", "Plum", "Cabbage", "Cauliflower", "Peas", "Carrot", "Potato",
  "Beans", "Spinach", "Coriander", "Fenugreek (Methi)", "Garlic", "Ginger", "Wheat",
  "Lentil (Masoor)", "Green Gram (Moong)", "Mustard", "Tomato", "Chilli", "Capsicum", "Onion",
  "Radish", "Beetroot", "Maize", "Barley", "Ragi (Finger Millet)", "Black Gram (Urad)", "Rice", "Kiwi",
  "Strawberry", "Peach", "Turmeric", "Cucumber", "Pumpkin",
];
const WORLD_COLLECTIONS = [
  "users",
  "farmergroups",
  "collectives",
  "farmercrops",
  "collectedcrops",
  "memberships",
  "cropdeals",
  "zones",
  "drivers",
  "schedules",
  "scheduleitems",
  "paymenttransactions",
  "announcements",
  "notifications",
  "reviews",
];

// ── tiny helpers ──────────────────────────────────────────────────────────────
const at = (daysAgo, hour = 10, min = 15) => {
  const d = new Date(Date.now() - daysAgo * DAY);
  d.setHours(hour, min, 0, 0);
  return d;
};
const round2 = (n) => Math.round(n * 100) / 100;
const fmt = (n) => n.toLocaleString("en-IN");
const img = (seed) => `https://picsum.photos/seed/${seed}/400/400`;

const mulberry32 = (seed) => {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const pick = (rand, arr) => arr[Math.floor(rand() * arr.length)];

/** Persist with a manual createdAt/updatedAt (mongoose timestamps off for the save). */
const saveAt = async (Model, data, ts) => {
  const doc = new Model(data);
  if (ts) {
    doc.createdAt = ts;
    doc.updatedAt = ts;
  }
  await doc.save({ timestamps: false });
  return doc;
};

/** Patch a document and back-date its updatedAt. */
const touchAt = async (Model, id, patch, ts) => {
  await Model.updateOne(
    { _id: id },
    { $set: { ...patch, updatedAt: ts } },
    { timestamps: false },
  );
};

// ── REGION DATA ───────────────────────────────────────────────────────────────
const LOC = {
  rudraprayag: {
    town: "Rudraprayag", district: "Rudraprayag", state: "Uttarakhand",
    pin: "246171", lat: 30.2899, long: 78.9806,
  },
  ukhimath: {
    town: "Ukhimath", district: "Rudraprayag", state: "Uttarakhand",
    pin: "246469", lat: 30.507, long: 79.21,
  },
  guptkashi: {
    town: "Guptkashi", district: "Rudraprayag", state: "Uttarakhand",
    pin: "246439", lat: 30.532, long: 79.07,
  },
  gopeshwar: {
    town: "Gopeshwar", district: "Chamoli", state: "Uttarakhand",
    pin: "246424", lat: 30.406, long: 79.318,
  },
  joshimath: {
    town: "Joshimath", district: "Chamoli", state: "Uttarakhand",
    pin: "246443", lat: 30.555, long: 79.564,
  },
  bageshwar: {
    town: "Bageshwar", district: "Bageshwar", state: "Uttarakhand",
    pin: "263642", lat: 29.839, long: 79.77,
  },
  almora: {
    town: "Almora", district: "Almora", state: "Uttarakhand",
    pin: "263601", lat: 29.598, long: 79.659,
  },
  kullu: {
    town: "Kullu", district: "Kullu", state: "Himachal Pradesh",
    pin: "175101", lat: 31.958, long: 77.108,
  },
  manali: {
    town: "Manali", district: "Kullu", state: "Himachal Pradesh",
    pin: "175131", lat: 32.243, long: 77.189,
  },
  palampur: {
    town: "Palampur", district: "Kangra", state: "Himachal Pradesh",
    pin: "176061", lat: 32.111, long: 76.536,
  },
  solan: {
    town: "Solan", district: "Solan", state: "Himachal Pradesh",
    pin: "173212", lat: 30.904, long: 77.097,
  },
  dehradun: {
    town: "Dehradun", district: "Dehradun", state: "Uttarakhand",
    pin: "248001", lat: 30.3165, long: 78.0322,
  },
  rishikesh: {
    town: "Rishikesh", district: "Dehradun", state: "Uttarakhand",
    pin: "249201", lat: 30.0869, long: 78.2676,
  },
  haridwar: {
    town: "Haridwar", district: "Haridwar", state: "Uttarakhand",
    pin: "249401", lat: 29.9457, long: 78.1642,
  },
  haldwani: {
    town: "Haldwani", district: "Nainital", state: "Uttarakhand",
    pin: "263139", lat: 29.2225, long: 79.5286,
  },
  shimla: {
    town: "Shimla", district: "Shimla", state: "Himachal Pradesh",
    pin: "171001", lat: 31.1048, long: 77.1734,
  },
};

const mobile = (seed) => {
  const r = mulberry32(seed);
  return `9${[8, 7, 6][Math.floor(r() * 3)]}${String(
    Math.floor(r() * 100000000),
  ).padStart(8, "0")}`;
};

const slugSeed = (slug) => [...slug].reduce((a, c) => a + c.charCodeAt(0), 0);

// ── GLOBAL STATE ──────────────────────────────────────────────────────────────
const CROPS = new Map(); // name -> master crop doc
const WORLD = {
  farmers: [], // { user, profile, uid, email }
  collectives: [], // { user, profile, uid, email, zones: [], drivers: [] }
  memberships: [],
  deals: [],
  schedules: [],
  items: [],
  payments: [],
  notifications: [],
  reviews: [],
};
let rand = mulberry32(42);

// ═════════════════════════════════════════════════════════════════════════════
// BOT REGISTRATION
// ═════════════════════════════════════════════════════════════════════════════
const registerBot = async ({
  role, name, email, phone, leader, uidKey, ts,
}) => {
  const uid = await generateId(uidKey);
  const password = await bcrypt.hash(BOT_PASSWORD, 10);
  const user = await saveAt(
    User,
    {
      uid, username: email, password, role, provider: "LOCAL",
      isActive: true, lastLogin: at(2, 9, 10),
    },
    ts,
  );
  return { user, uid, email, phone, name, leader, registeredAt: ts };
};

const buildFarmer = async (spec, ts) => {
  const bot = await registerBot({
    role: "FARMER_GROUP", uidKey: "farmergroup",
    name: spec.name, email: spec.email, phone: spec.phone,
    leader: spec.leadFarmer, ts,
  });
  const profile = await saveAt(
    FarmerGroup,
    {
      _id: bot.user._id, name: spec.name, email: spec.email,
      phone: spec.phone || mobile(500 + slugSeed(spec.slug)),
      profile: img(`farmer-${spec.slug}`),
      leadFarmer: spec.leadFarmer, farmerCount: spec.farmerCount,
      desc: spec.desc, address: spec.address, coord: spec.coord,
    },
    at(tsDays(bot.registeredAt) - 3, 11, 20),
  );
  const farmer = { ...bot, profile, crops: [] };

  for (const c of spec.crops) {
    const fc = await saveAt(
      FarmerCrop,
      {
        farmer: profile._id, crop: CROPS.get(c.name)._id,
        yield: c.yield, farmland: c.farmland, plantedDate: at(c.plantedDaysAgo, 9, 0),
        status: "ACTIVE",
      },
      at(c.addedDaysAgo, 16, 45),
    );
    farmer.crops.push({ name: c.name, doc: fc, yield: c.yield });
  }
  WORLD.farmers.push(farmer);
  return farmer;
};

const tsDays = (d) => (Date.now() - d.getTime()) / DAY;

const buildCollective = async (spec, ts) => {
  const bot = await registerBot({
    role: "COLLECTIVE", uidKey: "collective",
    name: spec.name, email: spec.email, phone: spec.phone,
    leader: spec.manager, ts,
  });
  const profile = await saveAt(
    Collective,
    {
      _id: bot.user._id, name: spec.name, email: spec.email,
      phone: spec.phone || mobile(2000 + slugSeed(spec.slug)),
      profile: img(`collective-${spec.slug}`),
      manager: spec.manager, workers: spec.workers, desc: spec.desc,
      address: spec.address, coord: spec.coord,
    },
    at(tsDays(bot.registeredAt) - 2, 12, 0),
  );
  const collective = { ...bot, profile, zones: [], drivers: [], crops: [] };

  // zones
  for (const [i, z] of spec.zones.entries()) {
    const zone = await saveAt(
      Zone,
      { collective: profile._id, name: z.name, description: z.desc, area: z.area, direction: z.direction, color: z.color, status: "ACTIVE" },
      at(tsDays(ts) - 3 - i, 10, 30),
    );
    collective.zones.push(zone);
  }

  // drivers
  for (const [i, d] of spec.drivers.entries()) {
    const driverId = await generateId("driver");
    const driver = await saveAt(
      Driver,
      {
        collective: profile._id, driverId, profile: img(`driver-${spec.slug}-${i}`),
        name: d.name, phone: d.phone || mobile(3000 + slugSeed(spec.slug) + i * 13),
        license: d.license,
        vehicleNumber: d.vehicleNumber, capacity: d.capacity,
        zones: collective.zones.map((z) => z._id), status: "AVAILABLE",
      },
      at(tsDays(ts) - 4 - i, 15, 0),
    );
    collective.drivers.push(driver);
  }

  // crops they deal in (buy price)
  for (const c of spec.crops) {
    const cc = await saveAt(
      CollectedCrop,
      {
        collective: profile._id, crop: CROPS.get(c.name)._id,
        quantity: 0, price: c.price, status: "ACTIVE",
      },
      at(tsDays(ts) - 3, 11, 10),
    );
    collective.crops.push({ name: c.name, doc: cc, price: c.price });
  }
  WORLD.collectives.push(collective);
  return collective;
};

// ═════════════════════════════════════════════════════════════════════════════
// BUSINESS-ACTION HELPERS (mirror the services' logic, but write directly)
// ═════════════════════════════════════════════════════════════════════════════
const notify = async ({
  recipient, recipientRole, type, title, body, data = {}, sender, ts,
}) => {
  const n = await saveAt(
    Notification,
    { recipient, recipientRole, type, title, body, data, isRead: false, isDeleted: false, sender },
    ts,
  );
  WORLD.notifications.push(n);
};

/** Farmer sends a membership request for crops. Returns { membership, deals }. */
const requestMembership = async ({
  farmer, collective, crops, note, ts,
}) => {
  const membership = await saveAt(
    Membership,
    { farmer: farmer.profile._id, collective: collective.profile._id, status: "PENDING", note },
    ts,
  );
  const deals = [];
  for (const c of crops) {
    const fc = farmer.crops.find((x) => x.name === c.name);
    const deal = await saveAt(
      CropDeal,
      {
        membership: membership._id, crop: fc.doc._id,
        demandedPrice: c.demandedPrice, requestedQuantity: c.requestQty,
        agreedPrice: 0, status: "REQUESTED",
      },
      ts,
    );
    deals.push({ crop: fc.doc, deal, spec: c });
  }
  WORLD.memberships.push(membership);
  WORLD.deals.push(...deals);
  await notify({
    recipient: collective.user._id, recipientRole: "COLLECTIVE", type: "REQUEST",
    title: "New Membership Request",
    body: `${farmer.profile.name} has sent a new membership request for ${deals.length} crop(s).`,
    data: { farmerId: farmer.profile._id, requestCount: deals.length },
    sender: farmer.user._id, ts: new Date(ts.getTime() + 60000),
  });
  return { membership, deals };
};

/** Collective accepts some deals (with agreed price + zone) and rejects others. */
const acceptMembership = async ({
  farmer, collective, membership, accepted, rejected, zone, route, distance, estTime, ts,
}) => {
  for (const a of accepted) {
    await touchAt(CropDeal, a.deal._id, {
      status: "APPROVED", agreedPrice: a.agreedPrice, approvalDate: ts,
      growth: { stage: "SOWING", expectedQuantity: a.requestQty, queryStatus: "CLOSED", lastUpdated: ts, images: [], message: "" },
      schedule: { expectedPickupDate: null, collectedQuantity: 0, totalCollected: 0, activeSchedule: null, lastPickupDate: null, pickupCount: 0, paymentStatus: "PENDING" },
    }, ts);
  }
  for (const r of rejected) {
    await touchAt(CropDeal, r.deal._id, {
      status: "REJECTED", rejectionReason: r.reason,
    }, ts);
  }
  const update = { status: "ACTIVE", memberSince: ts, zone: zone._id, route, distance, estTime };
  await touchAt(Membership, membership._id, update, ts);
  await notify({
    recipient: farmer.user._id, recipientRole: "FARMER_GROUP", type: "REQUEST",
    title: `Membership Request Processed by ${collective.profile.name}`,
    body: `Your partnership request has been reviewed: ${accepted.length} crop(s) approved, ${rejected.length} crop(s) rejected. Zone: ${zone.name}.`,
    data: { approvedCount: accepted.length, rejectedCount: rejected.length, zoneId: zone._id },
    sender: collective.user._id, ts: new Date(ts.getTime() + 120000),
  });
};

/** Resolve the partner User id from a CropDeal (via its Membership). */
const partnerOf = async (deal, which) => {
  const m = await Membership.findById(deal.membership).select(`${which}`).lean();
  return m ? m[which] : null;
};

/** Farmer posts a growth update on an APPROVED deal. */
const grow = async ({ farmer, deal, stage, message, ts, imgSeed }) => {
  const collectiveId = await partnerOf(deal, "collective");
  await touchAt(CropDeal, deal._id, {
    "growth.stage": stage,
    "growth.queryStatus": "CLOSED",
    "growth.lastUpdated": ts,
    "growth.images": [img(imgSeed || `growth-${deal._id}`)],
    "growth.message": message,
    "growth.expectedQuantity": deal.requestedQuantity || 0,
  }, ts);
  await notify({
    recipient: collectiveId, recipientRole: "COLLECTIVE", type: "STATUS_UPDATE",
    title: "Crop Status Updated",
    body: `${farmer.profile.name} has updated crop status to: ${stage}.`,
    data: { dealId: deal._id, stage },
    sender: farmer.user._id,
    ts,
  });
};

/** Collective opens a status query (OPEN) then farmer responds via grow(). */
const askStatus = async ({ collective, deal, ts }) => {
  const farmerId = await partnerOf(deal, "farmer");
  await touchAt(CropDeal, deal._id, { "growth.queryStatus": "OPEN" }, ts);
  await notify({
    recipient: farmerId, recipientRole: "FARMER_GROUP",
    type: "STATUS_UPDATE", title: "Status Update Requested",
    body: `${collective.profile.name} has requested a status update for your crop.`,
    data: { dealId: deal._id }, sender: collective.user._id, ts,
  });
};

const setPickupDate = async ({ collective, deal, date, ts }) => {
  const farmerId = await partnerOf(deal, "farmer");
  await touchAt(CropDeal, deal._id, { "schedule.expectedPickupDate": date }, ts);
  await notify({
    recipient: farmerId, recipientRole: "FARMER_GROUP", type: "PICKUP",
    title: "Expected Pickup Date Set",
    body: `${collective.profile.name} has set the expected pickup date to ${date.toLocaleDateString("en-IN")}.`,
    data: { dealId: deal._id, expectedPickupDate: date }, sender: collective.user._id, ts,
  });
};

/**
 * Create + complete a pickup in one shot (for historical pickups).
 * items: [{ farmer, deal, cropName, cropCode, agreedPrice, plannedQty, collectQty, remark }]
 * pays: [{ farmer, method, utr, proofSeed, ts }] — subset of farmers settled
 */
const pickup = async ({
  collective, zone, driver, createdAt, pickupDate, time, notes, items, startAt, completeAt, pays = [],
}) => {
  const code = await generateId("schedule");
  let totalAmount = 0;
  let totalQuantity = 0;
  const farmerIds = [...new Set(items.map((i) => i.farmer.profile._id.toString()))];

  const itemDocs = items.map((i) => {
    const collected = i.collectQty;
    const amount = round2(collected * i.agreedPrice);
    totalAmount = round2(totalAmount + amount);
    totalQuantity = round2(totalQuantity + collected);
    return { ...i, collected, amount };
  });

  const schedule = await saveAt(
    Schedule,
    {
      code, collective: collective.profile._id, driver: driver._id, zone: zone._id,
      pickupDate, time, status: "SCHEDULED", totalAmount, totalQuantity,
      paidAmount: 0, farmerCount: farmerIds.length, itemCount: itemDocs.length,
      notes,
    },
    createdAt,
  );

  for (const i of itemDocs) {
    const item = await saveAt(
      ScheduleItem,
      {
        schedule: schedule._id, collective: collective.profile._id,
        farmerGroup: i.farmer.profile._id,
        membership: i.membership._id, cropDeal: i.deal._id,
        cropName: i.cropName, cropCode: i.cropCode,
        plannedQuantity: i.plannedQty, collectedQuantity: i.collected,
        agreedPrice: i.agreedPrice, totalAmount: i.amount,
        status: i.collected > 0 ? "COLLECTED" : "SKIPPED",
        paymentStatus: "PENDING", remark: i.remark || "",
      },
      createdAt,
    );
    i._item = item;
    WORLD.items.push(item);
    await touchAt(CropDeal, i.deal._id, {
      "schedule.activeSchedule": schedule._id,
      "schedule.collectedQuantity": i.plannedQty,
    }, createdAt);
  }

  await touchAt(Schedule, schedule._id, {
    status: "IN_PROGRESS", startedAt: startAt,
  }, startAt);
  await touchAt(Driver, driver._id, { status: "ONROUTE" }, startAt);
  const startNotified = new Set();
  let startOffset = 0;
  for (const i of itemDocs) {
    const key = i.farmer.user._id.toString();
    if (startNotified.has(key)) continue;
    startNotified.add(key);
    await notify({
      recipient: i.farmer.user._id, recipientRole: "FARMER_GROUP",
      type: "PICKUP", title: `Pickup In Progress · ${code}`,
      body: "The driver is on the way for today's collection. Please keep the harvest ready.",
      data: { scheduleId: schedule._id, scheduleCode: code }, sender: collective.user._id,
      ts: new Date(startAt.getTime() + startOffset * 60000),
    });
    startOffset += 1;
  }

  // ── completion side effects (mirror completeSchedule) ──
  const perMembership = new Map();
  const perFarmer = new Map();
  for (const i of itemDocs) {
    if (i.collected > 0) {
      perMembership.set(
        i.membership._id.toString(),
        round2((perMembership.get(i.membership._id.toString()) || 0) + i.amount),
      );
    }
    const key = i.farmer.profile._id.toString();
    const f = perFarmer.get(key) || { amount: 0, quantity: 0, crops: 0 };
    f.amount = round2(f.amount + i.amount);
    f.quantity = round2(f.quantity + i.collected);
    if (i.collected > 0) f.crops += 1;
    perFarmer.set(key, f);

    await touchAt(CropDeal, i.deal._id, {
      "schedule.activeSchedule": null,
      "schedule.collectedQuantity": i.collected,
      "schedule.lastPickupDate": pickupDate,
      "growth.stage": i.collected > 0 ? "OTHER" : "READY",
    }, completeAt);
    await CropDeal.updateOne(
      { _id: i.deal._id },
      { $inc: { "schedule.totalCollected": i.collected, "schedule.pickupCount": i.collected > 0 ? 1 : 0 } },
      { timestamps: false },
    );
    // reduce farmer crop stock + increase collective inventory
    const fc = i.farmer.crops.find((x) => x.doc._id.toString() === i.deal.crop.toString());
    if (fc) {
      fc.yield = Math.max(0, fc.yield - i.collected);
      await touchAt(FarmerCrop, fc.doc._id, { yield: fc.yield }, completeAt);
    }
    await CollectedCrop.updateOne(
      { collective: collective.profile._id, crop: CROPS.get(i.cropName)._id },
      { $inc: { quantity: i.collected } },
      { timestamps: false },
    );
  }

  for (const [mid, amount] of perMembership) {
    await Membership.updateOne(
      { _id: mid }, { $inc: { balance: amount } }, { timestamps: false },
    );
  }
  for (const [fid, s] of perFarmer) {
    const inc = { pendingBalance: s.amount };
    if (s.quantity > 0) inc.totalPickups = 1;
    await FarmerGroup.updateOne({ _id: fid }, { $inc: inc }, { timestamps: false });
  }
  await touchAt(Schedule, schedule._id, {
    status: "COMPLETED", completedAt: completeAt, totalAmount, totalQuantity,
  }, completeAt);
  await touchAt(Driver, driver._id, {
    status: "AVAILABLE", totalDeliveries: driver.totalDeliveries + 1,
  }, completeAt);
  driver.totalDeliveries += 1;

  for (const i of itemDocs) {
    if (i.collected > 0) {
      await notify({
        recipient: i.farmer.user._id, recipientRole: "FARMER_GROUP", type: "PICKUP",
        title: `Pickup Completed · ${code}`,
        body: `${i.cropName} (${i.collected} kg) was collected on ${pickupDate.toLocaleDateString("en-IN")}. ₹${fmt(i.amount)} added to your pending balance.`,
        data: { scheduleId: schedule._id, scheduleCode: code, amount: i.amount },
        sender: collective.user._id, ts: new Date(completeAt.getTime() + 30000),
      });
    }
  }

  // ── payments ──
  for (const p of pays) {
    const paidItems = itemDocs.filter(
      (i) => i.farmer.profile._id.toString() === p.farmer.profile._id.toString() && i.collected > 0,
    );
    if (paidItems.length === 0) continue;
    const totalPayment = round2(paidItems.reduce((s, i) => s + i.amount, 0));
    const membership = WORLD.memberships.find(
      (m) => m.farmer.toString() === p.farmer.profile._id.toString() && m.collective.toString() === collective.profile._id.toString(),
    );
    const membershipDoc = await Membership.findById(membership._id);
    const balanceAfter = round2(Math.max(0, (membershipDoc.balance || 0) - totalPayment));
    const proof = img(p.proofSeed || `receipt-${code}`);
    const pCode = await generateId("payment");

    const tx = await saveAt(
      PaymentTransaction,
      {
        code: pCode, collective: collective.profile._id, farmerGroup: p.farmer.profile._id,
        membership: membership._id, schedule: schedule._id,
        items: paidItems.map((i) => i._item._id), amount: totalPayment,
        balanceAfter, method: p.method || "UPI", paymentProof: proof,
        utrNumber: p.utr || "", remarks: p.remarks || "", paymentDate: p.ts,
      },
      p.ts,
    );
    WORLD.payments.push(tx);

    await ScheduleItem.updateMany(
      { _id: { $in: paidItems.map((i) => i._item._id) } },
      { $set: { paymentStatus: "PAID", paymentProof: proof, paidAt: p.ts, paymentTransaction: tx._id } },
      { timestamps: false },
    );
    await Membership.updateOne(
      { _id: membership._id },
      { $set: { balance: balanceAfter }, $inc: { totalEarnings: totalPayment } },
      { timestamps: false },
    );
    await FarmerGroup.updateOne(
      { _id: p.farmer.profile._id },
      {
        $set: { pendingBalance: round2(Math.max(0, (p.farmer.pendingBalance || 0) - totalPayment)) },
        $inc: { totalEarnings: totalPayment },
      },
      { timestamps: false },
    );
    p.farmer.pendingBalance = round2(Math.max(0, (p.farmer.pendingBalance || 0) - totalPayment));
    p.farmer.totalEarnings = (p.farmer.totalEarnings || 0) + totalPayment;
    await Schedule.updateOne(
      { _id: schedule._id }, { $inc: { paidAmount: totalPayment } }, { timestamps: false },
    );
    for (const i of paidItems) {
      await touchAt(CropDeal, i.deal._id, { "schedule.paymentStatus": "PAID" }, p.ts);
    }
    await notify({
      recipient: p.farmer.user._id, recipientRole: "FARMER_GROUP", type: "PAYMENT",
      title: `Payment Received · ₹${fmt(totalPayment)}`,
      body: `Payment of ₹${fmt(totalPayment)} recorded for pickup ${code} (${paidItems.length} crop(s)). Remaining balance: ₹${fmt(balanceAfter)}.`,
      data: { scheduleId: schedule._id, scheduleCode: code, amount: totalPayment, balanceAfter, transactionId: tx._id },
      sender: collective.user._id, ts: new Date(p.ts.getTime() + 60000),
    });
  }

  WORLD.schedules.push(schedule);
  return schedule;
};

/** Post-review of a collective by an ACTIVE farmer partner. */
const reviewCollective = async ({ farmer, collective, rating, comment, ts }) => {
  const review = await saveAt(
    Review, { fid: farmer.profile._id, cid: collective.profile._id, comment, rating },
    ts,
  );
  WORLD.reviews.push(review);
  const all = await Review.find({ cid: collective.profile._id }).select("rating").lean();
  const avg = all.reduce((s, r) => s + r.rating, 0) / all.length;
  await touchAt(Collective, collective.profile._id, { ratingAvg: Math.round(avg * 10) / 10 }, ts);
};

// ═════════════════════════════════════════════════════════════════════════════
// WORLD COMPOSITION
// ═════════════════════════════════════════════════════════════════════════════
const seedWorld = async () => {
  console.log("🌱 Seeding the FarmFresh bot world ...");

  const existing = await User.findOne({ role: "FARMER_GROUP" });
  if (existing) {
    console.log("⚠️  Bot world already seeded — skipping. Use `--reset` to rebuild it.");
    return false;
  }

  const allCrops = await Crop.find({}).lean();
  for (const c of allCrops) CROPS.set(c.name, c);
  const missingCrops = REQUIRED_CROPS.filter((n) => !CROPS.has(n));
  if (missingCrops.length) {
    console.error(`❌ Master crop list is missing: ${missingCrops.join(", ")}. Run the server once (or seedData.js) first.`);
    process.exit(1);
  }

  // ── COLLECTIVES ────────────────────────────────────────────────────────────
  const mandakini = await buildCollective(
    {
      slug: "mandakini", name: "Mandakini Organic Collective",
      email: "mandakini.organic@gmail.com", manager: "Rajesh Negi",
      workers: 14,
      desc: "Aggregator for organic farmer groups of the Kedarnath valley. Runs bi-weekly pickup routes on NH-7 from Rudraprayag to Rishikesh.",
      address: { locality: "Railway Road", area: "Tapovan", town: "Rishikesh", district: "Dehradun", state: "Uttarakhand", pinCode: "249201" },
      coord: { lat: 30.1326, long: 78.3322 },
      zones: [
        { name: "Kedar Zone", area: "Rudraprayag–Ukhimath belt", direction: "NE", desc: "Covers Rudraprayag, Guptkashi and Ukhimath blocks", color: "#10b981" },
        { name: "Alaknanda Zone", area: "Chamoli belt", direction: "E", desc: "Covers Gopeshwar and Joshimath blocks", color: "#3b82f6" },
      ],
      drivers: [
        { name: "Ravi Kumar Sharma", license: "UK07 20140045678", vehicleNumber: "UK07 PA 4582", capacity: 3000 },
        { name: "Mahendra Singh Rawat", license: "UK07 20170023456", vehicleNumber: "UK07 TA 1723", capacity: 2200 },
      ],
      crops: [
        { name: "Apple", price: 140 }, { name: "Pear", price: 90 }, { name: "Plum", price: 110 },
        { name: "Cabbage", price: 18 }, { name: "Cauliflower", price: 25 }, { name: "Peas", price: 65 },
        { name: "Carrot", price: 30 }, { name: "Potato", price: 22 }, { name: "Beans", price: 55 },
        { name: "Spinach", price: 35 }, { name: "Coriander", price: 45 }, { name: "Fenugreek (Methi)", price: 40 },
        { name: "Garlic", price: 120 }, { name: "Ginger", price: 90 }, { name: "Wheat", price: 24 },
        { name: "Lentil (Masoor)", price: 85 }, { name: "Green Gram (Moong)", price: 95 }, { name: "Mustard", price: 55 },
      ],
    },
    at(340, 10, 20),
  );

  const garhwal = await buildCollective(
    {
      slug: "garhwal", name: "Garhwal Agri Hub",
      email: "garhwal.agrihub@gmail.com", manager: "Suresh Uniyal",
      workers: 9,
      desc: "Contract-buying collective for vegetables and pulses from the Garhwal hills, supplying mandis in Dehradun.",
      address: { locality: "Kankhal Road", area: "Mayapur", town: "Rishikesh", district: "Dehradun", state: "Uttarakhand", pinCode: "249201" },
      coord: { lat: 30.09, long: 78.29 },
      zones: [
        { name: "Rudra Zone", area: "Rudraprayag south", direction: "S", desc: "Farmers south of Rudraprayag town", color: "#f59e0b" },
        { name: "Chamoli Zone", area: "Chamoli east", direction: "E", desc: "Gopeshwar cluster", color: "#8b5cf6" },
      ],
      drivers: [
        { name: "Dinesh Chand Purohit", license: "UK07 20190012345", vehicleNumber: "UK07 UA 7810", capacity: 2600 },
        { name: "Sanjay Gusain", license: "UK07 20210056789", vehicleNumber: "UK07 UA 3345", capacity: 1800 },
      ],
      crops: [
        { name: "Tomato", price: 28 }, { name: "Chilli", price: 60 }, { name: "Capsicum", price: 70 },
        { name: "Cabbage", price: 17 }, { name: "Onion", price: 24 }, { name: "Potato", price: 21 },
        { name: "Carrot", price: 28 }, { name: "Radish", price: 22 }, { name: "Beetroot", price: 30 },
        { name: "Maize", price: 22 }, { name: "Barley", price: 28 }, { name: "Ragi (Finger Millet)", price: 45 },
        { name: "Black Gram (Urad)", price: 90 }, { name: "Mustard", price: 54 },
      ],
    },
    at(325, 9, 40),
  );

  const himalayan = await buildCollective(
    {
      slug: "himalayan", name: "Himalayan Harvest Collective",
      email: "himalayan.harvest@gmail.com", manager: "Anil Thakur",
      workers: 11,
      desc: "Premium temperate fruit and off-season vegetable buyer from Himachal's Kullu & Kangra valleys.",
      address: { locality: "Lakkar Bazar", area: "Chhota Shimla", town: "Shimla", district: "Shimla", state: "Himachal Pradesh", pinCode: "171001" },
      coord: { lat: 31.1048, long: 77.1734 },
      zones: [
        { name: "Kullu Valley Zone", area: "Kullu–Manali belt", direction: "N", desc: "Apple and off-season veg growers of Kullu", color: "#ec4899" },
        { name: "Kangra Zone", area: "Palampur–Kangra belt", direction: "W", desc: "Tea, grain and ginger growers", color: "#14b8a6" },
      ],
      drivers: [
        { name: "Karan Pathania", license: "HP12 20150098765", vehicleNumber: "HP12 A 3344", capacity: 3200 },
      ],
      crops: [
        { name: "Apple", price: 145 }, { name: "Kiwi", price: 160 }, { name: "Strawberry", price: 180 },
        { name: "Plum", price: 115 }, { name: "Peach", price: 120 }, { name: "Capsicum", price: 72 },
        { name: "Cabbage", price: 19 }, { name: "Peas", price: 68 }, { name: "Ginger", price: 92 },
        { name: "Wheat", price: 25 }, { name: "Barley", price: 29 },
      ],
    },
    at(310, 11, 5),
  );

  const kumaon = await buildCollective(
    {
      slug: "kumaon", name: "Kumaon Fresh Collective",
      email: "kumaon.fresh@gmail.com", manager: "Meena Joshi",
      workers: 8,
      desc: "Almora–Bageshwar produce collective supplying Haldwani wholesale markets.",
      address: { locality: "Kaladhungi Road", area: "Kusumkhera", town: "Haldwani", district: "Nainital", state: "Uttarakhand", pinCode: "263139" },
      coord: { lat: 29.2225, long: 79.5286 },
      zones: [
        { name: "Almora Zone", area: "Almora district", direction: "N", desc: "Almora cluster", color: "#ef4444" },
      ],
      drivers: [
        { name: "Prakash Bisht", license: "UK04 20180011223", vehicleNumber: "UK04 CA 2210", capacity: 2000 },
      ],
      crops: [
        { name: "Potato", price: 20 }, { name: "Onion", price: 23 }, { name: "Carrot", price: 27 },
        { name: "Beans", price: 52 }, { name: "Cabbage", price: 16 }, { name: "Tomato", price: 26 },
        { name: "Rice", price: 34 }, { name: "Wheat", price: 23 }, { name: "Lentil (Masoor)", price: 82 },
      ],
    },
    at(290, 14, 0),
  );

  const devbhoomi = await buildCollective(
    {
      slug: "devbhoomi", name: "Devbhoomi Farmer Market",
      email: "devbhoomi.market@gmail.com", manager: "Vijay Rawat",
      workers: 12,
      desc: "Haridwar-based procurement collective for pulses, spices and hill vegetables.",
      address: { locality: "Upper Road", area: "Kankhal", town: "Haridwar", district: "Haridwar", state: "Uttarakhand", pinCode: "249401" },
      coord: { lat: 29.92, long: 78.15 },
      zones: [
        { name: "Chamoli Zone", area: "Gopeshwar–Joshimath", direction: "NE", desc: "Highland pulses & spices", color: "#a855f7" },
        { name: "Rudra Zone", area: "Guptkashi cluster", direction: "SE", desc: "Guptkashi farmers", color: "#22c55e" },
      ],
      drivers: [
        { name: "Ramesh Kandari", license: "UK07 20160033445", vehicleNumber: "UK07 TA 9001", capacity: 2400 },
        { name: "Naveen Rana", license: "UK07 20200077889", vehicleNumber: "UK07 PA 6621", capacity: 1600 },
      ],
      crops: [
        { name: "Turmeric", price: 110 }, { name: "Garlic", price: 118 }, { name: "Ginger", price: 88 },
        { name: "Lentil (Masoor)", price: 83 }, { name: "Green Gram (Moong)", price: 93 }, { name: "Ragi (Finger Millet)", price: 44 },
        { name: "Maize", price: 21 },
      ].filter((c) => CROPS.has(c.name)),
      drinks: [],
    },
    at(275, 13, 30),
  );

  // ── FARMERS ────────────────────────────────────────────────────────────────
  const kedarnath = await buildFarmer(
    {
      slug: "kedarnath", name: "Kedarnath Valley Farmers", leadFarmer: "Devendra Prasad Semwal",
      email: "kedarnath.valley.farmers@gmail.com", farmerCount: 18,
      desc: "Organic grower group from the Mandakini valley — vegetables, pulses and temperate fruit since 2019.",
      address: { locality: "Village Tilwara", area: "Mandakini Valley", town: "Rudraprayag", district: "Rudraprayag", state: "Uttarakhand", pinCode: "246171" },
      coord: LOC.rudraprayag,
      crops: [
        { name: "Cabbage", yield: 2400, farmland: 2.5, plantedDaysAgo: 130, addedDaysAgo: 328 },
        { name: "Cauliflower", yield: 1600, farmland: 1.8, plantedDaysAgo: 120, addedDaysAgo: 328 },
        { name: "Peas", yield: 1200, farmland: 1.5, plantedDaysAgo: 110, addedDaysAgo: 326 },
        { name: "Carrot", yield: 900, farmland: 1.2, plantedDaysAgo: 105, addedDaysAgo: 326 },
        { name: "Potato", yield: 2800, farmland: 3.0, plantedDaysAgo: 95, addedDaysAgo: 324 },
        { name: "Wheat", yield: 3200, farmland: 4.0, plantedDaysAgo: 140, addedDaysAgo: 322 },
      ],
    },
    at(332, 9, 15),
  );

  const ukhimathGroup = await buildFarmer(
    {
      slug: "ukhimath", name: "Ukhimath Organic Group", leadFarmer: "Ganga Devi Negi",
      email: "ukhimath.organic.group@gmail.com", farmerCount: 12,
      desc: "Women-led organic farming group in the Ukhimath block of Rudraprayag.",
      address: { locality: "Village Kalimath", area: "Ukhimath Block", town: "Ukhimath", district: "Rudraprayag", state: "Uttarakhand", pinCode: "246469" },
      coord: LOC.ukhimath,
      crops: [
        { name: "Cabbage", yield: 1800, farmland: 2.0, plantedDaysAgo: 118, addedDaysAgo: 300 },
        { name: "Beans", yield: 950, farmland: 1.4, plantedDaysAgo: 100, addedDaysAgo: 298 },
        { name: "Spinach", yield: 700, farmland: 0.8, plantedDaysAgo: 95, addedDaysAgo: 298 },
        { name: "Garlic", yield: 550, farmland: 0.7, plantedDaysAgo: 160, addedDaysAgo: 296 },
        { name: "Lentil (Masoor)", yield: 1100, farmland: 1.6, plantedDaysAgo: 130, addedDaysAgo: 294 },
      ],
    },
    at(305, 8, 50),
  );

  const guptkashiGroup = await buildFarmer(
    {
      slug: "guptkashi", name: "Guptkashi Growers", leadFarmer: "Mohan Chandra Gairola",
      email: "guptkashi.growers@gmail.com", farmerCount: 9,
      desc: "Mixed vegetable and pulse growers around Guptkashi on the Kedarnath highway.",
      address: { locality: "Village Sitapur", area: "Guptkashi", town: "Guptkashi", district: "Rudraprayag", state: "Uttarakhand", pinCode: "246439" },
      coord: LOC.guptkashi,
      crops: [
        { name: "Potato", yield: 2200, farmland: 2.4, plantedDaysAgo: 90, addedDaysAgo: 290 },
        { name: "Tomato", yield: 1500, farmland: 1.2, plantedDaysAgo: 80, addedDaysAgo: 290 },
        { name: "Green Gram (Moong)", yield: 850, farmland: 1.0, plantedDaysAgo: 75, addedDaysAgo: 288 },
        { name: "Mustard", yield: 700, farmland: 0.9, plantedDaysAgo: 150, addedDaysAgo: 286 },
      ],
    },
    at(293, 10, 5),
  );

  const gopeshwarGroup = await buildFarmer(
    {
      slug: "gopeshwar", name: "Gopeshwar Green Collective", leadFarmer: "Chandra Singh Panwar",
      email: "gopeshwar.green@gmail.com", farmerCount: 15,
      desc: "Chamoli-based grower group producing pulses, maize and hill vegetables.",
      address: { locality: "Narayan Bagar", area: "Gopeshwar", town: "Gopeshwar", district: "Chamoli", state: "Uttarakhand", pinCode: "246424" },
      coord: LOC.gopeshwar,
      crops: [
        { name: "Maize", yield: 2600, farmland: 3.2, plantedDaysAgo: 105, addedDaysAgo: 300 },
        { name: "Ragi (Finger Millet)", yield: 1200, farmland: 1.4, plantedDaysAgo: 115, addedDaysAgo: 298 },
        { name: "Barley", yield: 1400, farmland: 1.6, plantedDaysAgo: 150, addedDaysAgo: 296 },
        { name: "Beans", yield: 800, farmland: 0.9, plantedDaysAgo: 90, addedDaysAgo: 296 },
        { name: "Carrot", yield: 750, farmland: 0.8, plantedDaysAgo: 85, addedDaysAgo: 294 },
      ],
    },
    at(303, 11, 30),
  );

  const joshimathGroup = await buildFarmer(
    {
      slug: "joshimath", name: "Joshimath Hills Farmers", leadFarmer: "Kailash Prasad Kotiyal",
      email: "joshimath.hills@gmail.com", farmerCount: 8,
      desc: "High-altitude vegetable growers from Joshimath, Chamoli.",
      address: { locality: "Village Auli", area: "Joshimath", town: "Joshimath", district: "Chamoli", state: "Uttarakhand", pinCode: "246443" },
      coord: LOC.joshimath,
      crops: [
        { name: "Potato", yield: 1900, farmland: 2.1, plantedDaysAgo: 88, addedDaysAgo: 282 },
        { name: "Cabbage", yield: 1300, farmland: 1.3, plantedDaysAgo: 92, addedDaysAgo: 282 },
        { name: "Peas", yield: 900, farmland: 1.0, plantedDaysAgo: 80, addedDaysAgo: 280 },
      ],
    },
    at(286, 12, 20),
  );

  const bageshwarGroup = await buildFarmer(
    {
      slug: "bageshwar", name: "Bageshwar Organic Producers", leadFarmer: "Laxmi Devi Bhatt",
      email: "bageshwar.organic@gmail.com", farmerCount: 10,
      desc: "Kumaon organic producers from the Saryu valley, Bageshwar.",
      address: { locality: "Village Kanda", area: "Garur", town: "Bageshwar", district: "Bageshwar", state: "Uttarakhand", pinCode: "263642" },
      coord: LOC.bageshwar,
      crops: [
        { name: "Rice", yield: 2100, farmland: 2.6, plantedDaysAgo: 120, addedDaysAgo: 285 },
        { name: "Wheat", yield: 2400, farmland: 3.0, plantedDaysAgo: 145, addedDaysAgo: 283 },
        { name: "Lentil (Masoor)", yield: 950, farmland: 1.1, plantedDaysAgo: 125, addedDaysAgo: 283 },
        { name: "Onion", yield: 1300, farmland: 1.0, plantedDaysAgo: 95, addedDaysAgo: 281 },
      ],
    },
    at(288, 9, 45),
  );

  const almoraGroup = await buildFarmer(
    {
      slug: "almora", name: "Almora Apple Growers", leadFarmer: "Harish Chandra Joshi",
      email: "almora.apple.growers@gmail.com", farmerCount: 7,
      desc: "Temperate fruit growers of Almora's orchards.",
      address: { locality: "Village Lamgarha", area: "Hawalbagh", town: "Almora", district: "Almora", state: "Uttarakhand", pinCode: "263601" },
      coord: LOC.almora,
      crops: [
        { name: "Apple", yield: 3200, farmland: 2.2, plantedDaysAgo: 400, addedDaysAgo: 280 },
        { name: "Pear", yield: 1800, farmland: 1.4, plantedDaysAgo: 380, addedDaysAgo: 280 },
        { name: "Plum", yield: 1200, farmland: 0.9, plantedDaysAgo: 360, addedDaysAgo: 278 },
      ],
    },
    at(284, 15, 10),
  );

  const kulluGroup = await buildFarmer(
    {
      slug: "kullu", name: "Kullu Valley Farmers", leadFarmer: "Rakesh Kumar Thakur",
      email: "kullu.valley.farmers@gmail.com", farmerCount: 20,
      desc: "Apple orchards and off-season vegetable growers of the Kullu valley, HP.",
      address: { locality: "Village Raison", area: "Kullu", town: "Kullu", district: "Kullu", state: "Himachal Pradesh", pinCode: "175101" },
      coord: LOC.kullu,
      crops: [
        { name: "Apple", yield: 4000, farmland: 2.8, plantedDaysAgo: 420, addedDaysAgo: 305 },
        { name: "Kiwi", yield: 1100, farmland: 0.8, plantedDaysAgo: 500, addedDaysAgo: 305 },
        { name: "Capsicum", yield: 1400, farmland: 1.1, plantedDaysAgo: 85, addedDaysAgo: 303 },
        { name: "Cabbage", yield: 1700, farmland: 1.5, plantedDaysAgo: 95, addedDaysAgo: 301 },
        { name: "Peas", yield: 1000, farmland: 0.9, plantedDaysAgo: 78, addedDaysAgo: 301 },
      ],
    },
    at(308, 10, 40),
  );

  const manaliGroup = await buildFarmer(
    {
      slug: "manali", name: "Manali Apple & Veg Group", leadFarmer: "Sonam Chand Sharma",
      email: "manali.apple.veg@gmail.com", farmerCount: 11,
      desc: "High-altitude growers from Manali and Sethan villages.",
      address: { locality: "Village Naggar", area: "Manali", town: "Manali", district: "Kullu", state: "Himachal Pradesh", pinCode: "175131" },
      coord: LOC.manali,
      crops: [
        { name: "Strawberry", yield: 900, farmland: 0.6, plantedDaysAgo: 70, addedDaysAgo: 300 },
        { name: "Peach", yield: 1500, farmland: 1.2, plantedDaysAgo: 350, addedDaysAgo: 298 },
        { name: "Plum", yield: 1300, farmland: 1.0, plantedDaysAgo: 340, addedDaysAgo: 298 },
        { name: "Capsicum", yield: 1100, farmland: 0.9, plantedDaysAgo: 82, addedDaysAgo: 296 },
      ],
    },
    at(304, 12, 55),
  );

  const kangraGroup = await buildFarmer(
    {
      slug: "kangra", name: "Kangra Tea & Grain Growers", leadFarmer: "Sudesh Kumari",
      email: "kangra.grain.growers@gmail.com", farmerCount: 13,
      desc: "Palampur-area farmers growing grains, ginger and spices.",
      address: { locality: "Village Galot", area: "Palampur", town: "Palampur", district: "Kangra", state: "Himachal Pradesh", pinCode: "176061" },
      coord: LOC.palampur,
      crops: [
        { name: "Wheat", yield: 3000, farmland: 3.5, plantedDaysAgo: 148, addedDaysAgo: 295 },
        { name: "Barley", yield: 1600, farmland: 1.8, plantedDaysAgo: 150, addedDaysAgo: 293 },
        { name: "Ginger", yield: 1100, farmland: 0.8, plantedDaysAgo: 210, addedDaysAgo: 293 },
      ],
    },
    at(298, 14, 35),
  );

  const solanGroup = await buildFarmer(
    {
      slug: "solan", name: "Solan Vegetable Farmers", leadFarmer: "Om Prakash Verma",
      email: "solan.veg.farmers@gmail.com", farmerCount: 16,
      desc: "Off-season vegetable producers from the Solan valley.",
      address: { locality: "Village Kandaghat", area: "Solan", town: "Solan", district: "Solan", state: "Himachal Pradesh", pinCode: "173212" },
      coord: LOC.solan,
      crops: [
        { name: "Tomato", yield: 2600, farmland: 2.0, plantedDaysAgo: 85, addedDaysAgo: 299 },
        { name: "Chilli", yield: 900, farmland: 0.8, plantedDaysAgo: 78, addedDaysAgo: 297 },
        { name: "Capsicum", yield: 1200, farmland: 1.0, plantedDaysAgo: 80, addedDaysAgo: 297 },
        { name: "Cucumber", yield: 1400, farmland: 1.1, plantedDaysAgo: 72, addedDaysAgo: 295 },
        { name: "Pumpkin", yield: 1100, farmland: 1.2, plantedDaysAgo: 70, addedDaysAgo: 295 },
      ],
    },
    at(301, 11, 50),
  );

  // ══ PARTNERSHIP STORIES ════════════════════════════════════════════════════

  // ── Story A: mature, 3 pickups (2 paid, 1 pending) — Kedarnath x Mandakini ──
  {
    const F = kedarnath, C = mandakini;
    const zone = C.zones[0], driver = C.drivers[0];
    const req = await requestMembership({
      farmer: F, collective: C, ts: at(300, 11, 20),
      note: "We are certified organic, supplying from Tilwara village.",
      crops: [
        { name: "Cabbage", demandedPrice: 16, requestQty: 2400 },
        { name: "Cauliflower", demandedPrice: 22, requestQty: 1600 },
        { name: "Peas", demandedPrice: 60, requestQty: 1200 },
        { name: "Carrot", demandedPrice: 27, requestQty: 900 },
      ],
    });
    await acceptMembership({
      farmer: F, collective: C, membership: req.membership, ts: at(296, 17, 10),
      accepted: [
        { deal: req.deals[0].deal, agreedPrice: 18, requestQty: 2400 },
        { deal: req.deals[1].deal, agreedPrice: 25, requestQty: 1600 },
      ],
      rejected: [
        { deal: req.deals[2].deal, reason: "Pea demand is already full for this season. Try again in the next cycle." },
        { deal: req.deals[3].deal, reason: "Carrot quality spec not met in the last sample check." },
      ],
      zone, route: "Tilwara → Rudraprayag → NH-7 → Rishikesh", distance: 165, estTime: 210,
    });
    const dCabbage = req.deals[0].deal, dCauli = req.deals[1].deal;
    const cabbage = F.crops[0], cauli = F.crops[1];

    // growth timeline
    await grow({ farmer: F, deal: dCabbage, stage: "GROWING", message: "Heads forming well, top dressing done.", ts: at(262, 9, 40), imgSeed: "cabbage-grow-1" });
    await grow({ farmer: F, deal: dCabbage, stage: "MATURE", message: "Heads firm, harvest begins next week.", ts: at(232, 10, 15), imgSeed: "cabbage-mature-1" });
    await grow({ farmer: F, deal: dCabbage, stage: "READY", message: "2400 kg ready for pickup.", ts: at(205, 16, 30), imgSeed: "cabbage-ready-1" });
    await grow({ farmer: F, deal: dCauli, stage: "GROWING", message: "Curds developing well.", ts: at(255, 9, 0), imgSeed: "cauli-grow-1" });
    await grow({ farmer: F, deal: dCauli, stage: "MATURE", message: "Curds compact and white.", ts: at(225, 11, 20), imgSeed: "cauli-mature-1" });
    await grow({ farmer: F, deal: dCauli, stage: "READY", message: "1600 kg ready, first harvest done.", ts: at(198, 15, 45), imgSeed: "cauli-ready-1" });

    // status queries
    await askStatus({ collective: C, deal: dCabbage, ts: at(200, 10, 30) });
    await grow({ farmer: F, deal: dCabbage, stage: "READY", message: "Confirmed — harvest complete, crates packed.", ts: at(197, 18, 10), imgSeed: "cabbage-qr-1" });
    await askStatus({ collective: C, deal: dCauli, ts: at(193, 9, 15) });
    await grow({ farmer: F, deal: dCauli, stage: "READY", message: "Ready, 1600 kg packed.", ts: at(190, 17, 40), imgSeed: "cauli-qr-1" });

    await setPickupDate({ collective: C, deal: dCabbage, date: at(185, 9, 0), ts: at(188, 12, 0) });
    await setPickupDate({ collective: C, deal: dCauli, date: at(185, 9, 0), ts: at(188, 12, 10) });

    await pickup({
      collective: C, zone, driver, createdAt: at(188, 14, 0), pickupDate: at(185, 9, 0), time: "09:00",
      notes: "First scheduled pickup of the season.",
      startAt: at(185, 8, 15), completeAt: at(185, 14, 20),
      items: [
        { farmer: F, deal: dCabbage, cropName: "Cabbage", cropCode: CROPS.get("Cabbage").code, agreedPrice: 18, plannedQty: 2400, collectQty: 2350, membership: req.membership, remark: "2 crates lighter than planned" },
        { farmer: F, deal: dCauli, cropName: "Cauliflower", cropCode: CROPS.get("Cauliflower").code, agreedPrice: 25, plannedQty: 1600, collectQty: 1580, membership: req.membership, remark: "" },
      ],
      pays: [{
        farmer: F, method: "BANK_TRANSFER", utr: "UTR-88451290", proofSeed: "pay-1",
        remarks: "Settlement for pickup 1 — cabbage & cauliflower", ts: at(180, 15, 30),
      }],
    });

    // second cycle
    await grow({ farmer: F, deal: dCabbage, stage: "READY", message: "Second batch ready — 2200 kg.", ts: at(172, 10, 10), imgSeed: "cabbage-ready-2" });
    await grow({ farmer: F, deal: dCauli, stage: "READY", message: "Second flush ready — 1500 kg.", ts: at(168, 9, 30), imgSeed: "cauli-ready-2" });
    await askStatus({ collective: C, deal: dCabbage, ts: at(166, 11, 0) });
    await grow({ farmer: F, deal: dCabbage, stage: "READY", message: "Confirmed ready.", ts: at(163, 16, 0), imgSeed: "cabbage-qr-2" });

    await pickup({
      collective: C, zone, driver, createdAt: at(162, 13, 0), pickupDate: at(150, 9, 30), time: "09:30",
      notes: "Mid-season pickup.",
      startAt: at(150, 8, 45), completeAt: at(150, 15, 10),
      items: [
        { farmer: F, deal: dCabbage, cropName: "Cabbage", cropCode: CROPS.get("Cabbage").code, agreedPrice: 18, plannedQty: 2200, collectQty: 2150, membership: req.membership, remark: "" },
        { farmer: F, deal: dCauli, cropName: "Cauliflower", cropCode: CROPS.get("Cauliflower").code, agreedPrice: 25, plannedQty: 1500, collectQty: 1460, membership: req.membership, remark: "Road rain damage — 40kg rejected" },
      ],
      pays: [{
        farmer: F, method: "UPI", utr: "UTR-90234156", proofSeed: "pay-2",
        remarks: "Settlement for pickup 2", ts: at(145, 12, 0),
      }],
    });

    // third cycle — recent, unpaid (pending balance live state)
    await grow({ farmer: F, deal: dCabbage, stage: "READY", message: "Late season batch — 2000 kg ready.", ts: at(40, 9, 0), imgSeed: "cabbage-ready-3" });
    await grow({ farmer: F, deal: dCauli, stage: "READY", message: "1800 kg cauliflower ready.", ts: at(36, 11, 20), imgSeed: "cauli-ready-3" });

    await pickup({
      collective: C, zone, driver, createdAt: at(32, 14, 0), pickupDate: at(25, 9, 0), time: "09:00",
      notes: "End-of-season pickup — payment pending at collective.",
      startAt: at(25, 8, 30), completeAt: at(25, 13, 50),
      items: [
        { farmer: F, deal: dCabbage, cropName: "Cabbage", cropCode: CROPS.get("Cabbage").code, agreedPrice: 18, plannedQty: 2000, collectQty: 1950, membership: req.membership, remark: "" },
        { farmer: F, deal: dCauli, cropName: "Cauliflower", cropCode: CROPS.get("Cauliflower").code, agreedPrice: 25, plannedQty: 1800, collectQty: 1750, membership: req.membership, remark: "" },
      ],
      pays: [],
    });

    await reviewCollective({
      farmer: F, collective: C, rating: 5,
      comment: "Very professional pickup coordination. Payments are prompt and the driver is always on time.",
      ts: at(178, 11, 0),
    });
  }

  // ── Story B: partial accept, one paid pickup — Guptkashi x Mandakini ───────
  {
    const F = guptkashiGroup, C = mandakini;
    const zone = C.zones[0], driver = C.drivers[1];
    const req = await requestMembership({
      farmer: F, collective: C, ts: at(240, 10, 30),
      note: "Potato and tomato from Sitapur village. Green gram for the summer cycle.",
      crops: [
        { name: "Potato", demandedPrice: 20, requestQty: 2200 },
        { name: "Tomato", demandedPrice: 25, requestQty: 1500 },
        { name: "Green Gram (Moong)", demandedPrice: 90, requestQty: 850 },
      ],
    });
    await acceptMembership({
      farmer: F, collective: C, membership: req.membership, ts: at(235, 16, 40),
      accepted: [
        { deal: req.deals[0].deal, agreedPrice: 22, requestQty: 2200 },
        { deal: req.deals[1].deal, agreedPrice: 28, requestQty: 1500 },
      ],
      rejected: [
        { deal: req.deals[2].deal, reason: "Moong demand met for this cycle." },
      ],
      zone, route: "Guptkashi → Rudraprayag → Rishikesh", distance: 185, estTime: 240,
    });
    const dPotato = req.deals[0].deal, dTomato = req.deals[1].deal;

    await grow({ farmer: F, deal: dPotato, stage: "GROWING", message: "Plants healthy, earthing done.", ts: at(210, 9, 20), imgSeed: "potato-grow-1" });
    await grow({ farmer: F, deal: dPotato, stage: "MATURE", message: "Tubers sizing well.", ts: at(175, 10, 40), imgSeed: "potato-mature-1" });
    await grow({ farmer: F, deal: dPotato, stage: "READY", message: "2200 kg potatoes ready.", ts: at(150, 15, 0), imgSeed: "potato-ready-1" });
    await grow({ farmer: F, deal: dTomato, stage: "GROWING", message: "Flowering started.", ts: at(205, 9, 0), imgSeed: "tomato-grow-1" });
    await grow({ farmer: F, deal: dTomato, stage: "MATURE", message: "First pick done.", ts: at(168, 12, 30), imgSeed: "tomato-mature-1" });
    await grow({ farmer: F, deal: dTomato, stage: "READY", message: "1500 kg ready.", ts: at(143, 16, 20), imgSeed: "tomato-ready-1" });

    await pickup({
      collective: C, zone, driver, createdAt: at(140, 12, 30), pickupDate: at(128, 10, 0), time: "10:00",
      notes: "Potato + tomato pickup.",
      startAt: at(128, 9, 0), completeAt: at(128, 16, 45),
      items: [
        { farmer: F, deal: dPotato, cropName: "Potato", cropCode: CROPS.get("Potato").code, agreedPrice: 22, plannedQty: 2200, collectQty: 2100, membership: req.membership, remark: "" },
        { farmer: F, deal: dTomato, cropName: "Tomato", cropCode: CROPS.get("Tomato").code, agreedPrice: 28, plannedQty: 1500, collectQty: 1420, membership: req.membership, remark: "Overripe batch rejected at gate" },
      ],
      pays: [{
        farmer: F, method: "UPI", utr: "UTR-91203445", proofSeed: "pay-b1",
        remarks: "Settlement for potato & tomato pickup", ts: at(122, 14, 15),
      }],
    });

    await reviewCollective({
      farmer: F, collective: C, rating: 4,
      comment: "Good rates, timely payments. Delivery points are a bit far for small groups.",
      ts: at(120, 10, 30),
    });
  }

  // ── Story C: fresh pending request (live state) — Bageshwar x Kumaon re-application ──
  {
    const F = bageshwarGroup, C = kumaon;
    await requestMembership({
      farmer: F, collective: C, ts: at(4, 10, 45),
      note: "Re-application after the last review — we have upgraded our grain drying and grading. Requesting lentil, onion and wheat contracts for the new season.",
      crops: [
        { name: "Lentil (Masoor)", demandedPrice: 78, requestQty: 950 },
        { name: "Onion", demandedPrice: 22, requestQty: 1300 },
        { name: "Wheat", demandedPrice: 22, requestQty: 2400 },
      ],
    });
  }

  // ── Story D: fully rejected — Bageshwar x Kumaon ────────────────────────────
  {
    const F = bageshwarGroup, C = kumaon;
    const req = await requestMembership({
      farmer: F, collective: C, ts: at(60, 11, 0),
      note: "Rice, wheat and lentils from the Saryu valley.",
      crops: [
        { name: "Rice", demandedPrice: 32, requestQty: 2100 },
        { name: "Wheat", demandedPrice: 22, requestQty: 2400 },
      ],
    });
    await acceptMembership({
      farmer: F, collective: C, membership: req.membership, ts: at(57, 15, 20),
      accepted: [], rejected: [
        { deal: req.deals[0].deal, reason: "Rice procurement quota is closed for this season." },
        { deal: req.deals[1].deal, reason: "Wheat grades did not match our moisture spec." },
      ],
      zone: C.zones[0], route: "", distance: 120, estTime: 180,
    });
  }

  // ── Story E: farmer cancelled own request — Joshimath x Devbhoomi ───────────
  {
    const F = joshimathGroup, C = devbhoomi;
    const req = await requestMembership({
      farmer: F, collective: C, ts: at(75, 9, 30),
      note: "Potato from Auli plateau.",
      crops: [{ name: "Potato", demandedPrice: 19, requestQty: 1900 }],
    });
    await touchAt(CropDeal, req.deals[0].deal._id, { status: "CANCELLED" }, at(73, 18, 0));
  }

  // ── Story F: approved then terminated by farmer — Ukhimath x Mandakini ──────
  {
    const F = ukhimathGroup, C = mandakini;
    const zone = C.zones[0], driver = C.drivers[1];
    const req = await requestMembership({
      farmer: F, collective: C, ts: at(230, 12, 0),
      note: "Cabbage, beans, spinach and garlic from Kalimath.",
      crops: [
        { name: "Cabbage", demandedPrice: 17, requestQty: 1800 },
        { name: "Beans", demandedPrice: 50, requestQty: 950 },
        { name: "Spinach", demandedPrice: 33, requestQty: 700 },
      ],
    });
    await acceptMembership({
      farmer: F, collective: C, membership: req.membership, ts: at(226, 17, 30),
      accepted: [
        { deal: req.deals[0].deal, agreedPrice: 18, requestQty: 1800 },
        { deal: req.deals[1].deal, agreedPrice: 55, requestQty: 950 },
      ],
      rejected: [{ deal: req.deals[2].deal, reason: "Spinach volume too small for the route." }],
      zone, route: "Kalimath → Ukhimath → Rishikesh", distance: 205, estTime: 260,
    });
    const dCabbage = req.deals[0].deal, dBeans = req.deals[1].deal;

    await grow({ farmer: F, deal: dCabbage, stage: "GROWING", message: "Good head formation.", ts: at(200, 9, 10), imgSeed: "uk-cabbage-grow" });
    await grow({ farmer: F, deal: dCabbage, stage: "READY", message: "Ready for pickup.", ts: at(170, 14, 0), imgSeed: "uk-cabbage-ready" });
    await grow({ farmer: F, deal: dBeans, stage: "GROWING", message: "Vines flowering.", ts: at(195, 10, 0), imgSeed: "uk-beans-grow" });
    await grow({ farmer: F, deal: dBeans, stage: "READY", message: "Beans ready.", ts: at(162, 12, 30), imgSeed: "uk-beans-ready" });

    await pickup({
      collective: C, zone, driver, createdAt: at(160, 11, 0), pickupDate: at(148, 9, 30), time: "09:30",
      notes: "Ukhimath route pickup.",
      startAt: at(148, 8, 45), completeAt: at(148, 17, 20),
      items: [
        { farmer: F, deal: dCabbage, cropName: "Cabbage", cropCode: CROPS.get("Cabbage").code, agreedPrice: 18, plannedQty: 1800, collectQty: 1720, membership: req.membership, remark: "" },
        { farmer: F, deal: dBeans, cropName: "Beans", cropCode: CROPS.get("Beans").code, agreedPrice: 55, plannedQty: 950, collectQty: 900, membership: req.membership, remark: "" },
      ],
      pays: [{
        farmer: F, method: "CASH", proofSeed: "pay-f1",
        remarks: "Cash settlement at pickup point", ts: at(144, 11, 30),
      }],
    });

    // farmer terminates the cabbage deal after season
    await touchAt(CropDeal, dCabbage._id, {
      status: "F_TERMINATE",
      terminationReason: "Cabbage season over — moving to spinach crop for next cycle.",
    }, at(90, 16, 0));
  }

  // ── Story G: completed pickup, fully unpaid (collective owes) — Gopeshwar x Devbhoomi ──
  {
    const F = gopeshwarGroup, C = devbhoomi;
    const zone = C.zones[0], driver = C.drivers[1];
    const req = await requestMembership({
      farmer: F, collective: C, ts: at(120, 9, 45),
      note: "Maize, ragi and beans from Chamoli. Pulses ready after winter.",
      crops: [
        { name: "Maize", demandedPrice: 20, requestQty: 2600 },
        { name: "Ragi (Finger Millet)", demandedPrice: 42, requestQty: 1200 },
      ],
    });
    await acceptMembership({
      farmer: F, collective: C, membership: req.membership, ts: at(116, 15, 0),
      accepted: [
        { deal: req.deals[0].deal, agreedPrice: 22, requestQty: 2600 },
        { deal: req.deals[1].deal, agreedPrice: 45, requestQty: 1200 },
      ],
      rejected: [], zone, route: "Gopeshwar → Chamoli → Haridwar", distance: 210, estTime: 280,
    });
    const dMaize = req.deals[0].deal, dRagi = req.deals[1].deal;
    await grow({ farmer: F, deal: dMaize, stage: "GROWING", message: "Cobs forming.", ts: at(95, 9, 0), imgSeed: "maize-grow-1" });
    await grow({ farmer: F, deal: dMaize, stage: "READY", message: "2600 kg maize ready.", ts: at(60, 10, 30), imgSeed: "maize-ready-1" });
    await grow({ farmer: F, deal: dRagi, stage: "GROWING", message: "Grains filling.", ts: at(90, 11, 0), imgSeed: "ragi-grow-1" });
    await grow({ farmer: F, deal: dRagi, stage: "READY", message: "1200 kg ragi ready.", ts: at(55, 14, 0), imgSeed: "ragi-ready-1" });

    await pickup({
      collective: C, zone, driver, createdAt: at(52, 10, 0), pickupDate: at(40, 9, 0), time: "09:00",
      notes: "Pulse & grain pickup — payment pending.",
      startAt: at(40, 8, 30), completeAt: at(40, 15, 40),
      items: [
        { farmer: F, deal: dMaize, cropName: "Maize", cropCode: CROPS.get("Maize").code, agreedPrice: 22, plannedQty: 2600, collectQty: 2500, membership: req.membership, remark: "" },
        { farmer: F, deal: dRagi, cropName: "Ragi (Finger Millet)", cropCode: CROPS.get("Ragi (Finger Millet)").code, agreedPrice: 45, plannedQty: 1200, collectQty: 1150, membership: req.membership, remark: "" },
      ],
      pays: [],
    });

    await reviewCollective({
      farmer: F, collective: C, rating: 3,
      comment: "Pickup went fine but the payment is delayed. Following up every week.",
      ts: at(38, 12, 0),
    });
  }

  // ── Story H1: upcoming scheduled pickup (+5d) — Kedarnath x Mandakini (new crop) ──
  {
    const F = kedarnath, C = mandakini;
    const zone = C.zones[0], driver = C.drivers[0];
    // existing ACTIVE partnership from Story A — potato is a NEW crop added to it
    const membership = WORLD.memberships.find(
      (m) => m.farmer.toString() === F.profile._id.toString()
        && m.collective.toString() === C.profile._id.toString(),
    );
    const fc = F.crops.find((x) => x.name === "Potato");
    const dPotato = await saveAt(
      CropDeal,
      {
        membership: membership._id, crop: fc.doc._id,
        demandedPrice: 21, requestedQuantity: 2800, agreedPrice: 22,
        status: "APPROVED", approvalDate: at(19, 10, 0),
        growth: { stage: "READY", expectedQuantity: 2800, queryStatus: "CLOSED", lastUpdated: at(6, 9, 30), images: [img("potato-upcoming")], message: "Harvest complete, 2800 kg packed." },
        schedule: { expectedPickupDate: at(-5, 9, 0), collectedQuantity: 0, totalCollected: 0, activeSchedule: null, lastPickupDate: null, pickupCount: 0, paymentStatus: "PENDING" },
      },
      at(20, 10, 0),
    );
    WORLD.deals.push({ crop: fc.doc, deal: dPotato });

    // schedule for +5 days — keep deal locked (activeSchedule set by create; do it manually)
    const code = await generateId("schedule");
    const schedule = await saveAt(
      Schedule,
      {
        code, collective: C.profile._id, driver: driver._id, zone: zone._id,
        pickupDate: at(-5, 9, 0), time: "09:00", status: "SCHEDULED",
        totalAmount: round2(2800 * 22), totalQuantity: 2800, paidAmount: 0,
        farmerCount: 1, itemCount: 1, notes: "Potato pickup — Tilwara crates.",
      },
      at(7, 13, 0),
    );
    await saveAt(
      ScheduleItem,
      {
        schedule: schedule._id, collective: C.profile._id, farmerGroup: F.profile._id,
        membership: membership._id, cropDeal: dPotato._id,
        cropName: "Potato", cropCode: CROPS.get("Potato").code,
        plannedQuantity: 2800, collectedQuantity: 2800, agreedPrice: 22,
        totalAmount: round2(2800 * 22), status: "PENDING", paymentStatus: "PENDING",
      },
      at(7, 13, 0),
    );
    await touchAt(CropDeal, dPotato._id, {
      "schedule.activeSchedule": schedule._id, "schedule.collectedQuantity": 2800,
    }, at(7, 13, 0));
    await touchAt(Driver, driver._id, { status: "ASSIGNED" }, at(7, 13, 0));
    await notify({
      recipient: F.user._id, recipientRole: "FARMER_GROUP", type: "PICKUP",
      title: `Pickup Scheduled · ${code}`,
      body: `Potato (2800 kg) will be collected on ${at(-5, 9, 0).toLocaleDateString("en-IN")} at 09:00 from Kedar Zone. Driver: ${driver.name}. Estimated value ₹${fmt(round2(2800 * 22))}.`,
      data: { scheduleId: schedule._id, scheduleCode: code, pickupDate: at(-5, 9, 0), amount: round2(2800 * 22) },
      sender: C.user._id, ts: at(7, 13, 30),
    });
  }

  // ── Story H2: upcoming pickup (+9d) + postponed history — Kullu x Himalayan ──
  {
    const F = kulluGroup, C = himalayan;
    const zone = C.zones[0], driver = C.drivers[0];
    const req = await requestMembership({
      farmer: F, collective: C, ts: at(140, 11, 30),
      note: "Premium apples and kiwis from Raison.",
      crops: [
        { name: "Apple", demandedPrice: 135, requestQty: 4000 },
        { name: "Kiwi", demandedPrice: 150, requestQty: 1100 },
      ],
    });
    await acceptMembership({
      farmer: F, collective: C, membership: req.membership, ts: at(136, 16, 0),
      accepted: [
        { deal: req.deals[0].deal, agreedPrice: 145, requestQty: 4000 },
        { deal: req.deals[1].deal, agreedPrice: 160, requestQty: 1100 },
      ],
      rejected: [], zone, route: "Raison → Kullu → NH-3 → Shimla", distance: 220, estTime: 290,
    });
    const dApple = req.deals[0].deal, dKiwi = req.deals[1].deal;
    await grow({ farmer: F, deal: dApple, stage: "GROWING", message: "Fruit set good this year.", ts: at(110, 9, 30), imgSeed: "apple-grow-1" });
    await grow({ farmer: F, deal: dApple, stage: "MATURE", message: "Colour developing nicely.", ts: at(70, 10, 0), imgSeed: "apple-mature-1" });
    await grow({ farmer: F, deal: dApple, stage: "READY", message: "First-grade apples ready for grading.", ts: at(30, 15, 20), imgSeed: "apple-ready-1" });
    await grow({ farmer: F, deal: dKiwi, stage: "GROWING", message: "Vines heavy with fruit.", ts: at(100, 11, 30), imgSeed: "kiwi-grow-1" });
    await grow({ farmer: F, deal: dKiwi, stage: "MATURE", message: "Kiwis softening — harvest in 2 weeks.", ts: at(60, 9, 45), imgSeed: "kiwi-mature-1" });
    await grow({ farmer: F, deal: dKiwi, stage: "READY", message: "1100 kg kiwi ready.", ts: at(25, 16, 10), imgSeed: "kiwi-ready-1" });

    // one completed early pickup (paid) for apples
    await pickup({
      collective: C, zone, driver, createdAt: at(95, 12, 0), pickupDate: at(85, 10, 0), time: "10:00",
      notes: "Early apple consignment.",
      startAt: at(85, 9, 15), completeAt: at(85, 16, 30),
      items: [
        { farmer: F, deal: dApple, cropName: "Apple", cropCode: CROPS.get("Apple").code, agreedPrice: 145, plannedQty: 2000, collectQty: 1900, membership: req.membership, remark: "" },
      ],
      pays: [{
        farmer: F, method: "BANK_TRANSFER", utr: "UTR-88990011", proofSeed: "pay-h1",
        remarks: "Early apple consignment settlement", ts: at(80, 13, 0),
      }],
    });

    // upcoming pickup at +9d, previously postponed from -2d
    const code = await generateId("schedule");
    const schedule = await saveAt(
      Schedule,
      {
        code, collective: C.profile._id, driver: driver._id, zone: zone._id,
        pickupDate: at(-9, 9, 0), time: "09:00", status: "POSTPONED",
        totalAmount: round2(1900 * 145 + 1100 * 160), totalQuantity: 3000, paidAmount: 0,
        farmerCount: 1, itemCount: 2, notes: "Main apple + kiwi dispatch.",
        postponeHistory: [{
          from: at(-2, 9, 0), to: at(-9, 9, 0),
          reason: "Landslide on NH-3 near Aut — rescheduled to next week.",
          at: at(3, 10, 0),
        }],
      },
      at(5, 11, 0),
    );
    const items2 = [
      { name: "Apple", deal: dApple, qty: 1900, price: 145 },
      { name: "Kiwi", deal: dKiwi, qty: 1100, price: 160 },
    ];
    for (const it of items2) {
      await saveAt(
        ScheduleItem,
        {
          schedule: schedule._id, collective: C.profile._id, farmerGroup: F.profile._id,
          membership: req.membership._id, cropDeal: it.deal._id,
          cropName: it.name, cropCode: CROPS.get(it.name).code,
          plannedQuantity: it.qty, collectedQuantity: it.qty, agreedPrice: it.price,
          totalAmount: round2(it.qty * it.price), status: "PENDING", paymentStatus: "PENDING",
        },
        at(5, 11, 0),
      );
      await touchAt(CropDeal, it.deal._id, {
        "schedule.activeSchedule": schedule._id, "schedule.collectedQuantity": it.qty,
      }, at(5, 11, 0));
    }
    await touchAt(Driver, driver._id, { status: "ASSIGNED" }, at(5, 11, 0));
    await notify({
      recipient: F.user._id, recipientRole: "FARMER_GROUP", type: "PICKUP",
      title: `Pickup Postponed · ${code}`,
      body: `The pickup planned for ${at(-2, 9, 0).toLocaleDateString("en-IN")} has been moved to ${at(-9, 9, 0).toLocaleDateString("en-IN")}. Reason: Landslide on NH-3 near Aut — rescheduled to next week.`,
      data: { scheduleId: schedule._id, scheduleCode: code, pickupDate: at(-9, 9, 0) },
      sender: C.user._id, ts: at(3, 10, 30),
    });

    await reviewCollective({
      farmer: F, collective: C, rating: 5,
      comment: "Best apple rates in the valley. The grading feedback has improved our packing a lot.",
      ts: at(78, 12, 30),
    });
  }

  // ── Story I: LIVE pickup today (IN_PROGRESS) — Gopeshwar + Joshimath x Garhwal ──
  {
    const F1 = gopeshwarGroup, F2 = joshimathGroup, C = garhwal;
    const zone = C.zones[1], driver = C.drivers[0];
    const today9 = new Date(); today9.setHours(9, 0, 0, 0);

    // F2 membership (approved recently, quick turnaround)
    const req2 = await requestMembership({
      farmer: F2, collective: C, ts: at(12, 10, 30),
      note: "Cabbage and peas from Joshimath.",
      crops: [
        { name: "Cabbage", demandedPrice: 16, requestQty: 1300 },
        { name: "Peas", demandedPrice: 60, requestQty: 900 },
      ],
    });
    await acceptMembership({
      farmer: F2, collective: C, membership: req2.membership, ts: at(10, 16, 0),
      accepted: [
        { deal: req2.deals[0].deal, agreedPrice: 18, requestQty: 1300 },
        { deal: req2.deals[1].deal, agreedPrice: 65, requestQty: 900 },
      ],
      rejected: [], zone, route: "Joshimath → Chamoli → Rishikesh", distance: 235, estTime: 310,
    });
    await grow({ farmer: F2, deal: req2.deals[0].deal, stage: "GROWING", message: "Heads firming.", ts: at(8, 9, 0), imgSeed: "jo-cabbage-grow" });
    await grow({ farmer: F2, deal: req2.deals[0].deal, stage: "READY", message: "1300 kg ready.", ts: at(2, 15, 30), imgSeed: "jo-cabbage-ready" });
    await grow({ farmer: F2, deal: req2.deals[1].deal, stage: "GROWING", message: "Pods filling.", ts: at(8, 9, 20), imgSeed: "jo-peas-grow" });
    await grow({ farmer: F2, deal: req2.deals[1].deal, stage: "READY", message: "900 kg peas ready.", ts: at(2, 16, 0), imgSeed: "jo-peas-ready" });

    // F1 existing crops go READY for today's pickup (maize/ragi from story G — reuse? use separate deal)
    // Create a new membership request + approval for carrot/beans for the live pickup
    const req1 = await requestMembership({
      farmer: F1, collective: C, ts: at(15, 9, 30),
      note: "Carrot and beans — live route test.",
      crops: [
        { name: "Carrot", demandedPrice: 26, requestQty: 750 },
        { name: "Beans", demandedPrice: 50, requestQty: 800 },
      ],
    });
    await acceptMembership({
      farmer: F1, collective: C, membership: req1.membership, ts: at(13, 15, 0),
      accepted: [
        { deal: req1.deals[0].deal, agreedPrice: 30, requestQty: 750 },
        { deal: req1.deals[1].deal, agreedPrice: 55, requestQty: 800 },
      ],
      rejected: [], zone, route: "Gopeshwar → Chamoli → Rishikesh", distance: 210, estTime: 280,
    });
    await grow({ farmer: F1, deal: req1.deals[0].deal, stage: "READY", message: "750 kg carrots ready.", ts: at(1, 10, 0), imgSeed: "carrot-ready-live" });
    await grow({ farmer: F1, deal: req1.deals[1].deal, stage: "READY", message: "800 kg beans ready.", ts: at(1, 10, 20), imgSeed: "beans-ready-live" });

    const code = await generateId("schedule");
    const totalAmount = round2(1300 * 18 + 900 * 65 + 750 * 30 + 800 * 55);
    const totalQty = 1300 + 900 + 750 + 800;
    const schedule = await saveAt(
      Schedule,
      {
        code, collective: C.profile._id, driver: driver._id, zone: zone._id,
        pickupDate: today9, time: "09:00", status: "SCHEDULED",
        totalAmount, totalQuantity: totalQty, paidAmount: 0,
        farmerCount: 2, itemCount: 4, notes: "Live Chamoli route pickup.",
      },
      at(3, 12, 0),
    );
    const liveItems = [
      { farmer: F2, membership: req2.membership, deal: req2.deals[0].deal, name: "Cabbage", qty: 1300, price: 18 },
      { farmer: F2, membership: req2.membership, deal: req2.deals[1].deal, name: "Peas", qty: 900, price: 65 },
      { farmer: F1, membership: req1.membership, deal: req1.deals[0].deal, name: "Carrot", qty: 750, price: 30 },
      { farmer: F1, membership: req1.membership, deal: req1.deals[1].deal, name: "Beans", qty: 800, price: 55 },
    ];
    for (const it of liveItems) {
      await saveAt(
        ScheduleItem,
        {
          schedule: schedule._id, collective: C.profile._id, farmerGroup: it.farmer.profile._id,
          membership: it.membership._id, cropDeal: it.deal._id,
          cropName: it.name, cropCode: CROPS.get(it.name).code,
          plannedQuantity: it.qty, collectedQuantity: it.qty, agreedPrice: it.price,
          totalAmount: round2(it.qty * it.price), status: "PENDING", paymentStatus: "PENDING",
        },
        at(3, 12, 0),
      );
      await touchAt(CropDeal, it.deal._id, {
        "schedule.activeSchedule": schedule._id, "schedule.collectedQuantity": it.qty,
      }, at(3, 12, 0));
    }
    // start it today
    const started = new Date(); started.setHours(8, 15, 0, 0);
    await touchAt(Schedule, schedule._id, { status: "IN_PROGRESS", startedAt: started }, started);
    await touchAt(Driver, driver._id, { status: "ONROUTE" }, started);
    await notify({
      recipient: F1.user._id, recipientRole: "FARMER_GROUP", type: "PICKUP",
      title: `Pickup In Progress · ${code}`,
      body: "The driver is on the way for today's collection. Please keep the harvest ready.",
      data: { scheduleId: schedule._id, scheduleCode: code }, sender: C.user._id, ts: started,
    });
    await notify({
      recipient: F2.user._id, recipientRole: "FARMER_GROUP", type: "PICKUP",
      title: `Pickup In Progress · ${code}`,
      body: "The driver is on the way for today's collection. Please keep the harvest ready.",
      data: { scheduleId: schedule._id, scheduleCode: code }, sender: C.user._id, ts: started,
    });
  }

  // ── Story J: cancelled pickup (weather) — Almora x Kumaon ────────────────────
  {
    const F = almoraGroup, C = kumaon;
    const zone = C.zones[0], driver = C.drivers[0];
    const req = await requestMembership({
      farmer: F, collective: C, ts: at(70, 10, 30),
      note: "Almora orchard apples, pears and plums.",
      crops: [
        { name: "Apple", demandedPrice: 130, requestQty: 3200 },
        { name: "Pear", demandedPrice: 85, requestQty: 1800 },
      ],
    });
    await acceptMembership({
      farmer: F, collective: C, membership: req.membership, ts: at(66, 17, 0),
      accepted: [
        { deal: req.deals[0].deal, agreedPrice: 140, requestQty: 3200 },
        { deal: req.deals[1].deal, agreedPrice: 90, requestQty: 1800 },
      ],
      rejected: [], zone, route: "Almora → Bageshwar → Haldwani", distance: 150, estTime: 200,
    });
    await grow({ farmer: F, deal: req.deals[0].deal, stage: "GROWING", message: "Orchard looking good.", ts: at(55, 9, 0), imgSeed: "almora-apple-grow" });
    await grow({ farmer: F, deal: req.deals[0].deal, stage: "MATURE", message: "Apples colouring.", ts: at(35, 11, 0), imgSeed: "almora-apple-mature" });
    await grow({ farmer: F, deal: req.deals[0].deal, stage: "READY", message: "3200 kg apples ready.", ts: at(18, 15, 0), imgSeed: "almora-apple-ready" });

    const code = await generateId("schedule");
    const schedule = await saveAt(
      Schedule,
      {
        code, collective: C.profile._id, driver: driver._id, zone: zone._id,
        pickupDate: at(10, 9, 0), time: "09:00", status: "SCHEDULED",
        totalAmount: round2(3200 * 140), totalQuantity: 3200, paidAmount: 0,
        farmerCount: 1, itemCount: 1, notes: "Almora apple pickup.",
      },
      at(15, 10, 0),
    );
    await saveAt(
      ScheduleItem,
      {
        schedule: schedule._id, collective: C.profile._id, farmerGroup: F.profile._id,
        membership: req.membership._id, cropDeal: req.deals[0].deal._id,
        cropName: "Apple", cropCode: CROPS.get("Apple").code,
        plannedQuantity: 3200, collectedQuantity: 3200, agreedPrice: 140,
        totalAmount: round2(3200 * 140), status: "PENDING", paymentStatus: "PENDING",
      },
      at(15, 10, 0),
    );
    await touchAt(CropDeal, req.deals[0].deal._id, {
      "schedule.activeSchedule": schedule._id, "schedule.collectedQuantity": 3200,
    }, at(15, 10, 0));
    await touchAt(Driver, driver._id, { status: "ASSIGNED" }, at(15, 10, 0));

    // cancel after landslide
    const cancelledAt = at(9, 13, 0);
    await touchAt(Schedule, schedule._id, {
      status: "CANCELLED", cancelledAt, cancellationReason: "Landslide blocked the Almora–Haldwani road.",
    }, cancelledAt);
    await touchAt(ScheduleItem, schedule._id, { status: "CANCELLED" }, cancelledAt);
    await touchAt(CropDeal, req.deals[0].deal._id, {
      "schedule.activeSchedule": null, "schedule.collectedQuantity": 0,
    }, cancelledAt);
    await touchAt(Driver, driver._id, { status: "AVAILABLE" }, cancelledAt);
  }

  // ── Story K: fresh growers — Manali x Himalayan (pending) & Kangra x Himalayan (approved, growing) ──
  {
    const F = manaliGroup, C = himalayan;
    await requestMembership({
      farmer: F, collective: C, ts: at(2, 11, 15),
      note: "Strawberry, peach and plum from Naggar. First season with Himalayan Harvest.",
      crops: [
        { name: "Strawberry", demandedPrice: 170, requestQty: 900 },
        { name: "Peach", demandedPrice: 110, requestQty: 1500 },
      ],
    });
  }
  {
    const F = kangraGroup, C = himalayan;
    const zone = C.zones[1];
    const req = await requestMembership({
      farmer: F, collective: C, ts: at(90, 9, 0),
      note: "Wheat, barley and ginger from Palampur.",
      crops: [
        { name: "Wheat", demandedPrice: 23, requestQty: 3000 },
        { name: "Barley", demandedPrice: 27, requestQty: 1600 },
        { name: "Ginger", demandedPrice: 85, requestQty: 1100 },
      ],
    });
    await acceptMembership({
      farmer: F, collective: C, membership: req.membership, ts: at(86, 14, 30),
      accepted: [
        { deal: req.deals[0].deal, agreedPrice: 25, requestQty: 3000 },
        { deal: req.deals[1].deal, agreedPrice: 29, requestQty: 1600 },
      ],
      rejected: [{ deal: req.deals[2].deal, reason: "Ginger volumes from Kangra are already contracted this cycle." }],
      zone, route: "Palampur → Kangra → Shimla", distance: 195, estTime: 260,
    });
    await grow({ farmer: F, deal: req.deals[0].deal, stage: "GROWING", message: "Wheat tillering well.", ts: at(60, 9, 30), imgSeed: "kangra-wheat-grow" });
    await grow({ farmer: F, deal: req.deals[1].deal, stage: "GROWING", message: "Barley healthy stand.", ts: at(58, 10, 0), imgSeed: "kangra-barley-grow" });
    await grow({ farmer: F, deal: req.deals[0].deal, stage: "MATURE", message: "Heads filling.", ts: at(20, 11, 0), imgSeed: "kangra-wheat-mature" });
  }

  // ── Story L: single-crop small partner, one completed unpaid pickup — Solan x Garhwal ──
  {
    const F = solanGroup, C = garhwal;
    const zone = C.zones[0], driver = C.drivers[1];
    const req = await requestMembership({
      farmer: F, collective: C, ts: at(45, 10, 0),
      note: "Tomato and chilli from Kandaghat.",
      crops: [
        { name: "Tomato", demandedPrice: 26, requestQty: 2600 },
        { name: "Chilli", demandedPrice: 55, requestQty: 900 },
      ],
    });
    await acceptMembership({
      farmer: F, collective: C, membership: req.membership, ts: at(42, 15, 30),
      accepted: [
        { deal: req.deals[0].deal, agreedPrice: 28, requestQty: 2600 },
        { deal: req.deals[1].deal, agreedPrice: 60, requestQty: 900 },
      ],
      rejected: [], zone, route: "Kandaghat → Solan → Rishikesh", distance: 190, estTime: 250,
    });
    const dTomato = req.deals[0].deal, dChilli = req.deals[1].deal;
    await grow({ farmer: F, deal: dTomato, stage: "GROWING", message: "Vines staked.", ts: at(35, 9, 0), imgSeed: "solan-tomato-grow" });
    await grow({ farmer: F, deal: dTomato, stage: "READY", message: "2600 kg tomatoes ready.", ts: at(12, 14, 30), imgSeed: "solan-tomato-ready" });
    await grow({ farmer: F, deal: dChilli, stage: "GROWING", message: "Flowering well.", ts: at(33, 10, 0), imgSeed: "solan-chilli-grow" });
    await grow({ farmer: F, deal: dChilli, stage: "READY", message: "900 kg chillies ready.", ts: at(10, 15, 0), imgSeed: "solan-chilli-ready" });

    await pickup({
      collective: C, zone, driver, createdAt: at(8, 12, 30), pickupDate: at(6, 9, 30), time: "09:30",
      notes: "Solan vegetable pickup.",
      startAt: at(6, 8, 45), completeAt: at(6, 14, 20),
      items: [
        { farmer: F, deal: dTomato, cropName: "Tomato", cropCode: CROPS.get("Tomato").code, agreedPrice: 28, plannedQty: 2600, collectQty: 2480, membership: req.membership, remark: "" },
        { farmer: F, deal: dChilli, cropName: "Chilli", cropCode: CROPS.get("Chilli").code, agreedPrice: 60, plannedQty: 900, collectQty: 860, membership: req.membership, remark: "" },
      ],
      pays: [],
    });

    await reviewCollective({
      farmer: F, collective: C, rating: 4,
      comment: "Fair inspection and quick weighing at the hub.",
      ts: at(4, 12, 0),
    });
  }

  // ── Story M: Ukhimath second collective (Garhwal) — pending second request rejected partly ──
  {
    const F = ukhimathGroup, C = garhwal;
    const zone = C.zones[0], driver = C.drivers[0];
    const req = await requestMembership({
      farmer: F, collective: C, ts: at(50, 9, 20),
      note: "Beans and lentils for the spring cycle.",
      crops: [
        { name: "Beans", demandedPrice: 50, requestQty: 950 },
        { name: "Lentil (Masoor)", demandedPrice: 80, requestQty: 1100 },
      ],
    });
    await acceptMembership({
      farmer: F, collective: C, membership: req.membership, ts: at(47, 16, 20),
      accepted: [{ deal: req.deals[0].deal, agreedPrice: 55, requestQty: 950 }],
      rejected: [{ deal: req.deals[1].deal, reason: "Masoor requirement fulfilled by other groups." }],
      zone, route: "Kalimath → Ukhimath → Rishikesh", distance: 205, estTime: 260,
    });
    await grow({ farmer: F, deal: req.deals[0].deal, stage: "GROWING", message: "Bean vines climbing.", ts: at(30, 9, 0), imgSeed: "uk-beans-grow-2" });
    await grow({ farmer: F, deal: req.deals[0].deal, stage: "READY", message: "950 kg beans ready.", ts: at(6, 14, 0), imgSeed: "uk-beans-ready-2" });

    await pickup({
      collective: C, zone, driver, createdAt: at(4, 10, 0), pickupDate: at(1, 9, 0), time: "09:00",
      notes: "Ukhimath beans pickup — payment pending.",
      startAt: at(1, 8, 30), completeAt: at(1, 15, 10),
      items: [
        { farmer: F, deal: req.deals[0].deal, cropName: "Beans", cropCode: CROPS.get("Beans").code, agreedPrice: 55, plannedQty: 950, collectQty: 920, membership: req.membership, remark: "" },
      ],
      pays: [],
    });
  }

  // ── ANNOUNCEMENTS ───────────────────────────────────────────────────────────
  const announcement = async ({ collective, title, body, targetCrops, newPrice, ts, readBy }) => {
    const a = await saveAt(
      Announcement,
      {
        collective: collective.profile._id, title, body,
        targetCrops: (targetCrops || []).map((n) => CROPS.get(n)._id),
        newPrice: newPrice ?? null, status: "ACTIVE",
      },
      ts,
    );
    if (readBy && readBy.length) {
      await Announcement.updateOne(
        { _id: a._id },
        { $set: { readBy: readBy.map((f) => f.profile._id) } },
        { timestamps: false },
      );
    }
    // notify members like the service does
    const members = WORLD.memberships.filter((m) => m.collective.toString() === collective.profile._id.toString());
    for (const m of members) {
      await notify({
        recipient: m.farmer, recipientRole: "FARMER_GROUP", type: "ANNOUNCEMENT",
        title, body, data: { announcementId: a._id, newPrice: newPrice ?? null },
        sender: collective.user._id, ts,
      });
    }
    return a;
  };

  await announcement({
    collective: mandakini, ts: at(160, 10, 0),
    title: "Cabbage rate revised for next cycle",
    body: "From the next pickup cycle, cabbage will be purchased at ₹18/kg (up from ₹16). Pea procurement opens next week — members can send requests.",
    targetCrops: ["Cabbage", "Peas"], newPrice: 18,
    readBy: [kedarnath],
  });
  await announcement({
    collective: mandakini, ts: at(85, 9, 30),
    title: "Winter vegetable collection schedule",
    body: "Winter cycle pickups will run every Thursday. Please keep produce graded and packed by 8 AM.",
    readBy: [kedarnath, ukhimathGroup],
  });
  await announcement({
    collective: mandakini, ts: at(15, 11, 0),
    title: "Potato advance payment scheme",
    body: "Mandakini Organic is offering 30% advance against potato contracts for the next season. Contact the hub office with your expected yield.",
    targetCrops: ["Potato"],
  });
  await announcement({
    collective: garhwal, ts: at(70, 10, 15),
    title: "Off-season vegetable demand update",
    body: "Strong demand for beans and capsicum this month. We will prioritise ready deals at the weekly pickup.",
    targetCrops: ["Beans", "Capsicum"],
    readBy: [gopeshwarGroup],
  });
  await announcement({
    collective: garhwal, ts: at(9, 10, 0),
    title: "Chamoli route pickup moved to 9 AM",
    body: "Due to traffic on NH-7, the Chamoli route pickup now departs at 9 AM sharp. Farmers must be ready by 8:30 AM.",
  });
  await announcement({
    collective: himalayan, ts: at(55, 12, 0),
    title: "Premium apple grading update",
    body: "Export-grade apples now fetch ₹5/kg extra. Grading demo at the Kullu sorting station this Saturday.",
    targetCrops: ["Apple"], newPrice: 145,
    readBy: [kulluGroup],
  });
  await announcement({
    collective: himalayan, ts: at(20, 9, 45),
    title: "Kiwi procurement opens",
    body: "Kiwi procurement at ₹160/kg for the 2025 season. Contract holders get priority pickup slots.",
    targetCrops: ["Kiwi"], newPrice: 160,
  });
  await announcement({
    collective: kumaon, ts: at(45, 11, 30),
    title: "Haldwani market price update",
    body: "Potato prices softening in Haldwani mandi. We advise members to release stocks before the weekend.",
    targetCrops: ["Potato"],
  });
  await announcement({
    collective: devbhoomi, ts: at(30, 10, 0),
    title: "Turmeric & ginger purchase rates",
    body: "Turmeric ₹110/kg, ginger ₹88/kg from next month. Pre-book your harvest for the best rates.",
    targetCrops: ["Turmeric", "Ginger"], newPrice: 110,
  });
  await announcement({
    collective: devbhoomi, ts: at(6, 9, 0),
    title: "Payment process reminder",
    body: "All pickups will be settled within 10 working days. Payment proofs are shared on the platform — please raise a ticket if delayed.",
    readBy: [gopeshwarGroup],
  });

  // ══ NOTIFICATION HOUSEKEEPING ════════════════════════════════════════════════
  // Mark ~60% of notifications older than 10 days as read (realistic behavior)
  const oldNotifs = await Notification.find({ createdAt: { $lt: at(10) } });
  for (const n of oldNotifs) {
    if (rand() < 0.6) {
      await Notification.updateOne(
        { _id: n._id },
        { $set: { isRead: true, updatedAt: n.createdAt } },
        { timestamps: false },
      );
    }
  }

  // ══ LAST LOGINS — staggered like real users ═════════════════════════════════
  for (const [i, f] of WORLD.farmers.entries()) {
    const hour = 18 + Math.floor(rand() * 4); // farmers log in evenings
    const when = at(Math.floor(rand() * 2), hour % 24, Math.floor(rand() * 60));
    await User.updateOne({ _id: f.user._id }, { $set: { lastLogin: when } }, { timestamps: false });
  }
  for (const [i, c] of WORLD.collectives.entries()) {
    const when = at(0, 8 + i, 10 + Math.floor(rand() * 40)); // collectives mornings
    await User.updateOne({ _id: c.user._id }, { $set: { lastLogin: when } }, { timestamps: false });
  }
  return true;
};

// ═════════════════════════════════════════════════════════════════════════════
// MAIN
// ═════════════════════════════════════════════════════════════════════════════
const main = async () => {
  const reset = process.argv.includes("--reset");

  await dbConnect();
  await seedCounters();

  if (reset) {
    console.log("🧹 Resetting world collections ...");
    for (const name of WORLD_COLLECTIONS) {
      try {
        await mongoose.connection.collection(name).deleteMany({});
      } catch { /* collection may not exist */ }
    }
  }

  try {
    const seeded = await seedWorld();
    if (!seeded) {
      await mongoose.disconnect();
      return;
    }
    const counts = {
      farmers: WORLD.farmers.length,
      collectives: WORLD.collectives.length,
      memberships: WORLD.memberships.length,
      deals: WORLD.deals.length,
      schedules: WORLD.schedules.length,
      scheduleItems: WORLD.items.length,
      payments: WORLD.payments.length,
      notifications: WORLD.notifications.length,
      reviews: WORLD.reviews.length,
    };
    console.log("✅ Bot world seeded!");
    console.table(counts);
    console.log("🔑 All bot accounts use password: Bot@1234");
    console.log(
      "   Sample login — farmer: kedarnath.valley.farmers@gmail.com | collective: mandakini.organic@gmail.com",
    );
  } catch (err) {
    console.error("❌ Seeding failed:", err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

export { seedWorld };

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirectRun) main();
