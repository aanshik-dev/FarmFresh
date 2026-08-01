import mongoose from "mongoose";
import Review from "../../models/review.model.js";
import Collective from "../../models/collective.model.js";
import Membership from "../../models/membership.model.js";
import User from "../../models/user.model.js";
import throwErr from "../../utils/throwErr.js";

// ── Submit / update a review for a collective ─────────────────────────────────
const submitReview = async (farmerId, { collectiveId, rating, comment }) => {
  if (!collectiveId) throwErr(400, "Collective Id is required !!");
  if (!mongoose.isValidObjectId(collectiveId)) throwErr(400, "Invalid collective id !!");

  const r = Number(rating);
  if (!r || r < 1 || r > 5) throwErr(400, "Rating must be between 1 and 5 !!");

  const text = String(comment || "").trim();
  if (!text) throwErr(400, "A review comment is required !!");
  if (text.length > 1000) throwErr(400, "Review cannot exceed 1000 characters !!");

  const collective = await Collective.findById(collectiveId);
  if (!collective) throwErr(404, "Collective not found !!");

  const collectiveUser = await User.findById(collectiveId);
  if (!collectiveUser || !collectiveUser.isActive)
    throwErr(400, "Collective is currently inactive !!");

  // Only active partners may review — stops random ratings from strangers.
  const membership = await Membership.findOne({
    farmer: farmerId,
    collective: collectiveId,
  });
  if (!membership || membership.status !== "ACTIVE")
    throwErr(403, "You can only review collectives you are an active partner of !!");

  let review = await Review.findOne({ fid: farmerId, cid: collectiveId });
  let isNew = false;
  if (review) {
    review.rating = r;
    review.comment = text;
    await review.save();
  } else {
    review = await Review.create({
      fid: farmerId,
      cid: collectiveId,
      rating: r,
      comment: text,
    });
    isNew = true;
  }

  // Recompute and persist the collective's average rating.
  const allReviews = await Review.find({ cid: collectiveId })
    .select("rating")
    .lean();
  const avg =
    allReviews.reduce((sum, rev) => sum + rev.rating, 0) / allReviews.length;
  await Collective.findByIdAndUpdate(collectiveId, {
    $set: { ratingAvg: Math.round(avg * 10) / 10 },
  });

  return {
    success: true,
    message: isNew
      ? "Review submitted successfully !!"
      : "Review updated successfully !!",
    review,
  };
};

// ── All reviews written by a farmer group ─────────────────────────────────────
const getMyReviews = async (farmerId) => {
  const reviews = await Review.find({ fid: farmerId })
    .populate("cid", "name profile")
    .sort({ createdAt: -1 })
    .lean();

  return { success: true, message: "Reviews fetched !!", reviews };
};

export default { submitReview, getMyReviews };
