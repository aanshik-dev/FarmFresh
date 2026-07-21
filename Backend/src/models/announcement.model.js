import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema(
  {
    collective: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Collective",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    body: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    // If this is a crop-specific announcement (e.g. price change)
    targetCrops: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Crop",
      },
    ],
    // New price being announced (optional, for price-change announcements)
    newPrice: {
      type: Number,
      min: 0,
      default: null,
    },
    // Track which farmer groups have read this announcement
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "FarmerGroup",
      },
    ],
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
    },
  },
  { timestamps: true },
);

announcementSchema.index({ collective: 1, createdAt: -1 });

const Announcement = mongoose.model("Announcement", announcementSchema);
export default Announcement;
