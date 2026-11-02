import * as admissionService from '../services/admission.service.js';

export const getAllAdmissions = async (req, res, next) => {
  try {
    const admissions = await admissionService.getAllAdmissions();
    res.json(admissions);
  } catch (err) { next(err); }
};
export const getMyAdmission = async (req, res, next) => {
  try {
    const admission = await admissionService.getAdmissionByUserId(req.user._id);
    res.json(admission);
  } catch (err) { next(err); }
};
export const createAdmission = async (req, res, next) => {
  try {
    const result = await admissionService.createAdmission(req.body);
    res.status(201).json(result);
  } catch (err) { next(err); }
};
export const updateAdmission = async (req, res, next) => {
  try {
    const admission = await admissionService.updateAdmission(req.params.id, req.body);
    res.json(admission);
  } catch (err) { next(err); }
};
export const searchUsers = async (req, res, next) => {
  try {
    const { q, page, limit } = req.query;
    const result = await admissionService.searchUsers(q, Number(page) || 1, Number(limit) || 20);
    res.json(result);
  } catch (err) { next(err); }
};