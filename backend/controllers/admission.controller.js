import * as admissionService from '../services/admission.service.js';

export async function getAllAdmissions(req, res, next) {
  try {
    const admissions = await admissionService.getAllAdmissions();
    res.json(admissions);
  } catch (err) { next(err); }
}

export async function getMyAdmission(req, res, next) {
  try {
    const admission = await admissionService.getAdmissionByUserId(req.user._id);
    res.json(admission);
  } catch (err) { next(err); }
}

export async function createAdmission(req, res, next) {
  try {
    const result = await admissionService.createAdmission(req.body);
    res.status(201).json(result);
  } catch (err) { next(err); }
}

export async function updateAdmission(req, res, next) {
  try {
    const admission = await admissionService.updateAdmission(req.params.id, req.body);
    res.json(admission);
  } catch (err) { next(err); }
}

export async function searchUsers(req, res, next) {
  try {
    const { q, page, limit } = req.query;
    const result = await admissionService.searchUsers(q, Number(page) || 1, Number(limit) || 20);
    res.json(result);
  } catch (err) { next(err); }
}
