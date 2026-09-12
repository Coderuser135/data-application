import BodyMeasurement from '../models/bodyMeasurement.model.js';
import GymAdmission from '../models/gymAdmission.model.js';
import User from '../models/user.model.js';
import { ApiError } from '../utils/errors.utils.js';

export async function getMeasurementsByUserId(userId) {
  return BodyMeasurement.find({ user_id: userId }).sort({ measurement_date: -1 });
}

export async function getAllMeasurements() {
  return BodyMeasurement.find().populate({ path: 'user_id', select: 'full_name' }).sort({ measurement_date: -1 });
}

export async function getMeasurementsByUserIdAdmin(userId) {
  return BodyMeasurement.find({ user_id: userId }).sort({ measurement_date: -1 });
}

function numberField(value, label, { min = 0, max = Number.POSITIVE_INFINITY, integer = false } = {}) {
  if (value === undefined || value === null || value === '') return 0;
  const number = Number(value);
  if (!Number.isFinite(number) || number < min || number > max || (integer && !Number.isInteger(number))) {
    throw new ApiError(400, `Invalid ${label}`);
  }
  return number;
}

export async function createMeasurement(data) {
  if (!data.user_id) throw new ApiError(400, 'User is required');
  const user = await User.findById(data.user_id);
  if (!user) throw new ApiError(404, 'User not found');
  const admission = await GymAdmission.findOne({ user_id: data.user_id });
  if (!admission) throw new ApiError(400, 'User must be admitted before measurements can be recorded');

  const measurementDate = data.measurement_date ? new Date(data.measurement_date) : new Date();
  if (Number.isNaN(measurementDate.getTime())) throw new ApiError(400, 'Invalid measurement date');

  return BodyMeasurement.create({
    user_id: data.user_id,
    gym_admission_id: admission._id,
    age: numberField(data.age, 'age', { max: 120, integer: true }),
    height: numberField(data.height, 'height', { max: 300 }),
    weight: numberField(data.weight, 'weight', { max: 500 }),
    stomach: numberField(data.stomach, 'stomach', { max: 300 }),
    chest: numberField(data.chest, 'chest', { max: 300 }),
    biceps: numberField(data.biceps, 'biceps', { max: 150 }),
    back: numberField(data.back, 'back', { max: 300 }),
    legs: numberField(data.legs, 'legs', { max: 300 }),
    body_fat: numberField(data.body_fat, 'body fat', { max: 100 }),
    muscle_mass: numberField(data.muscle_mass, 'muscle mass', { max: 500 }),
    notes: String(data.notes || '').slice(0, 2000),
    measurement_date: measurementDate,
  });
}

export async function getAdmittedUsers() {
  const admissions = await GymAdmission.find().populate({ path: 'user_id', select: 'full_name' });
  return admissions.filter((a) => a.user_id).map((a) => ({ user_id: a.user_id._id, full_name: a.user_id.full_name }));
}
