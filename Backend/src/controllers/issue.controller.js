import Issue from "../models/issue.model.js";
import FarmerGroup from "../models/farmerGroup.model.js";
import Collective from "../models/collective.model.js";
import throwErr from "../utils/throwErr.js";

export const createIssue = async (req, res, next) => {
  try {
    const { title, description, type, priority } = req.body;
    if (!title || !description) {
      throwErr(400, "Title and description are required.");
    }

    const userId = req.user.id;
    const userRole = req.user.role; // "FARMER_GROUP", "COLLECTIVE", "ADMIN"

    let reportedByName = "User";
    if (userRole === "FARMER_GROUP") {
      const fg = await FarmerGroup.findById(userId).lean();
      if (fg) reportedByName = fg.name;
    } else if (userRole === "COLLECTIVE") {
      const col = await Collective.findById(userId).lean();
      if (col) reportedByName = col.name;
    }

    const PRIORITY_MAP = {
      payment: "high",
      operational: "medium",
      account: "medium",
      data: "low",
      other: "low",
    };
    const computedPriority = PRIORITY_MAP[type] || "medium";

    const newIssue = await Issue.create({
      title: title.trim(),
      description: description.trim(),
      type: type || "other",
      priority: computedPriority,
      status: "OPEN",
      reportedBy: userId,
      reportedByName,
      reportedByRole: userRole,
    });

    res.status(201).json({
      success: true,
      message: "Support issue raised successfully!",
      issue: newIssue,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyIssues = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const issues = await Issue.find({ reportedBy: userId }).sort({ createdAt: -1 }).lean();
    res.status(200).json({ success: true, issues });
  } catch (error) {
    next(error);
  }
};
