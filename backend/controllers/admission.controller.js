import * as admissionService from '../services/admission.service.js';

export const getAllAdmissions = async (req, res, next) => {
  try {
    const admissions = await admissionService.getAllAdmissions();
    res.json(admissions);
  } catch (error) {
    next(error);
  }
};

export const getMemberOverview = async (req, res, next) => {
  try {
    const overview = await admissionService.getMemberOverview(req.params.userId);
    res.json(overview);
  } catch (error) {
    next(error);
  }
};

export const getAdmissionDetails = async (req, res, next) => {
  try {
    const details = await admissionService.getAdmissionDetails(req.params.id);
    res.json(details);
  } catch (error) {
    next(error);
  }
};

export const getMyAdmission = async (req, res, next) => {
  try {
    const admission = await admissionService.getAdmissionByUserId(req.user._id);
    res.json(admission);
  } catch (error) {
    next(error);
  }
};

export const createAdmission = async (req, res, next) => {
  try {
    const result = await admissionService.createAdmission(req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const updateAdmission = async (req, res, next) => {
  try {
    const admission = await admissionService.updateAdmission(req.params.id, req.body);
    res.json(admission);
  } catch (error) {
    next(error);
  }
};

export const searchUsers = async (req, res, next) => {
  try {
    const { q, page, limit, admission_filter } = req.query;
    const result = await admissionService.searchUsers(
      q,
      Number(page) || 1,
      Number(limit) || 10,
      { admissionFilter: admission_filter || 'all' },
    );

    res.json(result);
  } catch (error) {
    next(error);
  }
};
