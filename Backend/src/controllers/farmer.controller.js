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
    const data = farmerCropAddSchema.parse(req.body);
    const yld = data.yield !== undefined ? data.yield : data.yld;
    const { code, plantedDate, farmland } = data;
    const { id: farmerId } = req.user;
    const response = await addCropData(code, yld, plantedDate, farmerId, farmland);
    res.status(201).json(response);
  } catch (err) {
    next(err);
  }
};

const editCrop = async (req, res, next) => {
  try {
    const data = editFarmerCropSchema.parse(req.body);
    const yld = data.yield !== undefined ? data.yield : data.yld;
    const { id, plantedDate, farmland } = data;
    const { id: farmerId } = req.user;
    const response = await editCropData(id, yld, plantedDate, farmerId, farmland);
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
    const { collectiveId, crops, note } = req.body;
    const { id: farmerId } = req.user;
    const response = await memberService.sendMemberRequest(
      farmerId,
      collectiveId,
      crops,
      note
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

const getCollectives = async (req, res, next) => {
  try {
    const { id: farmerId } = req.user;
    const response = await memberService.getMemberData(farmerId);
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

const terminateDeal = async (req, res, next) => {
  try {
    const { dealId, reason } = req.body;
    const { id: farmerId } = req.user;
    const response = await memberService.terminateDeal(farmerId, dealId, reason);
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export {
  addCrop,
  editCrop,
  getCrops,
  deleteCrop,
  sendRequest,
  cancelRequest,
  getCollectives,
  getMemberships,
  terminateDeal,
};
