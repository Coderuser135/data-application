import BodyMeasurement from '../models/bodyMeasurement.model.js';
import GymAdmission from '../models/gymAdmission.model.js';
import { ApiError } from '../utils/errors.utils.js';

export async function getMeasurementsByUserId(userId) {
  return BodyMeasurement.find({ user_id: userId }).sort({ measurement_date: -1 });
}

export async function getAllMeasurements() {
  return BodyMeasurement.find()
    .populate({ path: 'user_id', select: 'full_name' })
    .sort({ measurement_date: -1 });
}

export async function getMeasurementsByUserIdAdmin(userId) {
  return BodyMeasurement.find({ user_id: userId }).sort({ measurement_date: -1 });
}

export async function createMeasurement(data) {
  if (!data.user_id) throw new ApiError(400, 'User is required');
  const user = await (await import('../models/User.js')).default.findById(data.user_id);
  if (!user) throw new ApiError(404, 'User not found');

  const admission = await GymAdmission.findOne({ user_id: data.user_id });
  if (!admission) throw new ApiError(400, 'User must be admitted before measurements can be recorded');

  return BodyMeasurement.create({
    user_id: data.user_id,
    gym_admission_id: admission._id,
    age: Number(data.age) || 0,
    height: Number(data.height) || 0,
    weight: Number(data.weight) || 0,
    stomach: Number(data.stomach) || 0,
    chest: Number(data.chest) || 0,
    biceps: Number(data.biceps) || 0,
    back: Number(data.back) || 0,
    legs: Number(data.legs) || 0,
    body_fat: Number(data.body_fat) || 0,
    muscle_mass: Number(data.muscle_mass) || 0,
    notes: data.notes || '',
    measurement_date: data.measurement_date || new Date().toISOString().split('T')[0],
  });
}

export async function getAdmittedUsers() {
  const admissions = await GymAdmission.find()
    .populate({ path: 'user_id', select: 'full_name' });
  return admissions
    .filter((a) => a.user_id)
    .map((a) => ({ user_id: a.user_id._id, full_name: a.user_id.full_name }));
}
