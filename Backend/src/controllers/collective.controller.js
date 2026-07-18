import {
  addCropData,
  editCropData,
  getCropData,
} from "../services/collective/crop.service.js";

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
    const { id, price, quantity, status } = editCropSchema.parse(req.body);
    const { id: collectiveId } = req.user;
    const result = await editCropData(
      id,
      price,
      quantity,
      status,
      collectiveId,
    );
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

export { addCrop, editCrop, getCrops };
