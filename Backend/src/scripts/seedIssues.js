import Issue from "../models/issue.model.js";

const sampleIssues = [
  {
    title: "Payment dispute — Zone C pickup July 3",
    description:
      "The payment for 120 kg of Rajma (₹14,400) has not been credited 48 hours after pickup.",
    type: "payment",
    priority: "high",
    status: "OPEN",
    reportedByName: "Debendra Semwal",
    reportedByRole: "FARMER_GROUP",
  },
  {
    title: "Driver vehicle breakdown on Kedarnath route",
    description:
      "Vehicle breakdown on the Kedarnath route during Zone D pickup. Alternate driver arranged.",
    type: "operational",
    priority: "medium",
    status: "IN_PROGRESS",
    reportedByName: "Ravi Kumar Sharma",
    reportedByRole: "COLLECTIVE",
  },
  {
    title: "Wrong crop quantity recorded in history",
    description: "Schedule sch_004 shows 200 kg but actual was 185 kg.",
    type: "data",
    priority: "low",
    status: "RESOLVED",
    reportedByName: "Anita Rawat",
    reportedByRole: "FARMER_GROUP",
    resolvedAt: new Date(),
  },
  {
    title: "Collective profile details incorrect",
    description: "Phone number and address need to be updated for Kedarnath Valley Organics.",
    type: "account",
    priority: "low",
    status: "RESOLVED",
    reportedByName: "Priya Negi",
    reportedByRole: "COLLECTIVE",
    resolvedAt: new Date(),
  },
];

const seedIssues = async () => {
  try {
    const count = await Issue.countDocuments();
    if (count > 0) {
      return;
    }
    await Issue.insertMany(sampleIssues);
    console.log("✅ Sample issues created !!");
  } catch (error) {
    console.error("❌ Issue seeding failed.", error);
  }
};

export default seedIssues;
