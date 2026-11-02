import * as measurementService from '../services/measurement.service.js';

export const getMyMeasurements = async (req, res, next) => {
  try {
    const measurements = await measurementService.getMeasurementsByUserId(req.user._id);
    res.json(measurements);
  } catch (err) { next(err); }
};
export const getAllMeasurements = async (req, res, next) => {
  try {
    const measurements = await measurementService.getAllMeasurements();
    res.json(measurements);
  } catch (err) { next(err); }
};
export const getMeasurementsByUser = async (req, res, next) => {
  try {
    const measurements = await measurementService.getMeasurementsByUserIdAdmin(req.params.userId);
    res.json(measurements);
  } catch (err) { next(err); }
};
export const createMeasurement = async (req, res, next) => {
  try {
    const measurement = await measurementService.createMeasurement(req.body);
    res.status(201).json(measurement);
  } catch (err) { next(err); }
};
export const getAdmittedUsers = async (req, res, next) => {
  try {
    const users = await measurementService.getAdmittedUsers();
    res.json(users);
  } catch (err) { next(err); }
};