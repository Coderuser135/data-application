import * as measurementService from '../services/measurement.service.js';

export async function getMyMeasurements(req, res, next) {
  try {
    const measurements = await measurementService.getMeasurementsByUserId(req.user._id);
    res.json(measurements);
  } catch (err) { next(err); }
}

export async function getAllMeasurements(req, res, next) {
  try {
    const measurements = await measurementService.getAllMeasurements();
    res.json(measurements);
  } catch (err) { next(err); }
}

export async function getMeasurementsByUser(req, res, next) {
  try {
    const measurements = await measurementService.getMeasurementsByUserIdAdmin(req.params.userId);
    res.json(measurements);
  } catch (err) { next(err); }
}

export async function createMeasurement(req, res, next) {
  try {
    const measurement = await measurementService.createMeasurement(req.body);
    res.status(201).json(measurement);
  } catch (err) { next(err); }
}

export async function getAdmittedUsers(req, res, next) {
  try {
    const users = await measurementService.getAdmittedUsers();
    res.json(users);
  } catch (err) { next(err); }
}
