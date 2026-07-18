import Collective from "../models/collective.model.js";
import FarmerGroup from "../models/farmerGroup.model.js";
import Membership from "../models/membership.model.js";
import {
  farmerCropAddSchema,
  editFarmerCropSchema,
} from "../validations/crop.validation.js";
import {
  addCropData,
  editCropData,
  getCropData,
} from "../services/farmer/crop.services.js";

import memberService from "../services/farmer/membership.service.js";

const addCrop = async (req, res, next) => {
  try {
    const { code, yld } = farmerCropAddSchema.parse(req.body);
    const { id: farmerId } = req.user;
    const response = await addCropData(code, yld, farmerId);
    res.status(201).json(response);
  } catch (err) {
    next(err);
  }
};

const editCrop = async (req, res, next) => {
  try {
    const { id, yld, plantedDate, status } = editFarmerCropSchema.parse(
      req.body,
    );
    const { id: farmerId } = req.user;
    const response = await editCropData(id, yld, plantedDate, status, farmerId);
    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
};

const getCrops = async (req, res, next) => {
  try {
    const { id: farmerId } = req.user;
    const response = await getCropData(farmerId);
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

const sendRequest = async (req, res, next) => {
  try {
    const { collectiveId, crops } = req.body;
    const { id: farmerId } = req.user;
    const response = await memberService.sendMembershipRequest(
      farmerId,
      collectiveId,
      crops,
    );
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export { sendRequest, addCrop, editCrop, getCrops };
