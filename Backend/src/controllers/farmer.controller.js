import {
  farmerCropAddSchema,
  editFarmerCropSchema,
} from "../validations/crop.validation.js";
import {
  addCropData,
  editCropData,
  getCropData,
  deleteCropData,
} from "../services/farmer/crop.service.js";

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
    const { id, yld, plantedDate } = editFarmerCropSchema.parse(req.body);
    const { id: farmerId } = req.user;
    const response = await editCropData(id, yld, plantedDate, farmerId);
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

const deleteCrop = async (req, res, next) => {
  try {
    const { cropId } = req.body;
    const { id: farmerId } = req.user;
    const response = await deleteCropData(farmerId, cropId);
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

const sendRequest = async (req, res, next) => {
  try {
    const { collectiveId, crops } = req.body;
    const { id: farmerId } = req.user;
    const response = await memberService.sendMemberRequest(
      farmerId,
      collectiveId,
      crops,
    );
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

const cancelRequest = async (req, res, next) => {
  try {
    const { dealIds } = req.body;
    const response = await memberService.cancelMemberRequest(dealIds);
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

const getMemberships = async (req, res, next) => {
  try {
    const { id: farmerId } = req.user;
    const response = await memberService.getMemberData(farmerId);
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export {
  sendRequest,
  cancelRequest,
  addCrop,
  editCrop,
  getCrops,
  deleteCrop,
  getMemberships,
};
