import {
  addCropData,
  editCropData,
  getCropData,
  deleteCropData,
} from "../services/collective/crop.service.js";

import memberService from "../services/collective/membership.service.js";

import {
  addCropSchema,
  editCropSchema,
} from "../validations/crop.validation.js";

const addCrop = async (req, res, next) => {
  try {
    const { code, price } = addCropSchema.parse(req.body);
    const { id: collectiveId } = req.user;
    const result = await addCropData(code, price, collectiveId);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

const editCrop = async (req, res, next) => {
  try {
    const { id, price, quantity } = editCropSchema.parse(req.body);
    const { id: collectiveId } = req.user;
    const result = await editCropData(id, price, quantity, collectiveId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getCrops = async (req, res, next) => {
  try {
    const { id: collectiveId } = req.user;
    const result = await getCropData(collectiveId);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const deleteCrop = async (req, res, next) => {
  try {
    const { cropId } = req.body;
    const { id: collectiveId } = req.user;
    const response = await deleteCropData(collectiveId, cropId);
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

const getMemberships = async (req, res, next) => {
  try {
    const { id: collectiveId } = req.user;
    const result = await memberService.getMemberships(collectiveId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const acceptRequest = async (req, res, next) => {
  try {
    const { farmerId, crops } = req.body;
    const { id: collectiveId } = req.user;
    const result = await memberService.acceptMembershipRequest(
      collectiveId,
      farmerId,
      crops,
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const rejectRequest = async (req, res, next) => {
  try {
    const { dealIds } = req.body;
    const result = await memberService.rejectMemberRequest(dealIds);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export {
  addCrop,
  editCrop,
  getCrops,
  deleteCrop,
  getMemberships,
  acceptRequest,
  rejectRequest,
};
