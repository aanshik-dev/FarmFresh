import mongoose from "mongoose";
import Membership from "../../models/membership.model.js";
import CropDeal from "../../models/cropDeal.model.js";
import Collective from "../../models/collective.model.js";
import throwErr from "../../utils/throwErr.js";



const getMemberships = async(collectiveID) {
  if(!collectiveID){
    throwErr(404, "Collective Id is required");
  }
  const collective = await Collective.findById(collectiveID);
  if(!collective){
    throwErr(404, "Collective not found");
  }
    const memberships = await Membership.find({ collective: collectiveID });
    
  return {
    success: true,
    message: "Memberships fetched successfully",
    memberships,
  };
}




const acceptMembershipRequest = async (collectiveId, farmerId, crops) => {
  if (!collectiveId) {
    throwErr(404, "Collective not found");
  }
  if (!farmerId) {
    throwErr(404, "Farmer Group not found");
  }
  if (!crops || crops.length === 0) {
    throwErr(400, "Crops are required to accept the request");
  }

  const collective = await Collective.findById(collectiveId);
  if (!collective) {
    throwErr(404, "Collective not found");
  }

  const membership = await Membership.findOne({
    farmer: farmerId,
    collective: collectiveId,
  });

  if (!membership) {
    throwErr(404, "No membership request found for this farmer");
  }

  // We should verify that the requested deals are actually in REQUESTED state.
  const dealsToAccept = await CropDeal.find({
    membership: membership._id,
    crop: { $in: crops },
    status: "REQUESTED"
  });

  if (dealsToAccept.length !== crops.length) {
    throwErr(400, "Some crops are either not requested by this farmer or are not in REQUESTED status");
  }

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const bulkOps = crops.map((cropId) => ({
        updateOne: {
          filter: {
            membership: membership._id,
            crop: cropId,
            status: "REQUESTED",
          },
          update: {
            $set: {
              status: "APPROVED",
              approvalDate: new Date(),
            },
          },
        },
      }));

      await CropDeal.bulkWrite(bulkOps, { session });
    });
  } finally {
    await session.endSession();
  }

  return {
    success: true,
    message: "Membership request(s) approved successfully",
  };
};

export default { acceptMembershipRequest };
