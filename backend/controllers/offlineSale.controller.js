import * as offlineSaleService from '../services/offlineSale.service.js';

export const createOfflineSale = async (req, res, next) => {
  try {
    const sale = await offlineSaleService.createOfflineSale({
      ...req.body,
      performedBy: req.user?._id,
    });
    res.status(201).json(sale);
  } catch (error) {
    next(error);
  }
};
