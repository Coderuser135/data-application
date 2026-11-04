import BodyMeasurement from '../models/bodyMeasurement.model.js';
import GymAdmission from '../models/gymAdmission.model.js';
import User from '../models/user.model.js';
import { ApiError } from '../utils/errors.utils.js';

export async function getMeasurementsByUserId(userId) {
  const admission = await GymAdmission.findOne({ user_id: userId, status: 'active' }).select('_id');
  if (!admission) return [];
  return BodyMeasurement.find({ user_id: userId, gym_admission_id: admission._id }).sort({ measurement_date: -1 });
}

export async function getAllMeasurements() {
  return BodyMeasurement.find().populate({ path: 'user_id', select: 'full_name' }).sort({ measurement_date: -1 });
}

export async function getMeasurementsByUserIdAdmin(userId) {
  const admission = await GymAdmission.findOne({ user_id: userId, status: 'active' }).select('_id');
  if (!admission) return [];
  return BodyMeasurement.find({ user_id: userId, gym_admission_id: admission._id }).sort({ measurement_date: -1 });
}

function numberField(value, label, { min = 0, max = Number.POSITIVE_INFINITY, integer = false } = {}) {
  if (value === undefined || value === null || value === '') return 0;
  const number = Number(value);
  if (!Number.isFinite(number) || number < min || number > max || (integer && !Number.isInteger(number))) {
    throw new ApiError(400, `Invalid ${label}`);
  }
  return number;
}

function buildMeasurementData(data) {
  const measurementDate = data.measurement_date ? new Date(data.measurement_date) : new Date();
  if (Number.isNaN(measurementDate.getTime())) throw new ApiError(400, 'Invalid measurement date');
  return {
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
  };
}

export async function createMeasurement(data) {
  if (!data.user_id) throw new ApiError(400, 'User is required');
  const user = await User.findById(data.user_id);
  if (!user) throw new ApiError(404, 'User not found');
  const admission = await GymAdmission.findOne({ user_id: data.user_id, status: 'active' });
  if (!admission) throw new ApiError(400, 'User must have an active gym admission before measurements can be recorded');
  return BodyMeasurement.create({ user_id: data.user_id, gym_admission_id: admission._id, ...buildMeasurementData(data) });
}

export async function updateMeasurement(measurementId, data) {
  const existing = await BodyMeasurement.findById(measurementId);
  if (!existing) throw new ApiError(404, 'Measurement not found');
  const admission = await GymAdmission.findOne({ _id: existing.gym_admission_id, user_id: existing.user_id, status: 'active' });
  if (!admission) throw new ApiError(409, 'An active gym admission is required to update this measurement');
  const updated = await BodyMeasurement.findOneAndUpdate(
    { _id: measurementId, user_id: existing.user_id, gym_admission_id: admission._id },
    { $set: buildMeasurementData(data) },
    { new: true, runValidators: true },
  );
  if (!updated) throw new ApiError(404, 'Measurement not found');
  return updated;
}

export async function deleteMeasurement(measurementId) {
  const existing = await BodyMeasurement.findById(measurementId);
  if (!existing) throw new ApiError(404, 'Measurement not found');
  const admission = await GymAdmission.findOne({ _id: existing.gym_admission_id, user_id: existing.user_id, status: 'active' });
  if (!admission) throw new ApiError(409, 'An active gym admission is required to delete this measurement');
  await BodyMeasurement.deleteOne({ _id: measurementId, user_id: existing.user_id, gym_admission_id: admission._id });
  return { success: true, message: 'Measurement deleted successfully' };
}

export async function getAdmittedUsers() {
  const admissions = await GymAdmission.find({ status: 'active' }).populate({ path: 'user_id', select: 'full_name' });
  return admissions.filter((a) => a.user_id).map((a) => ({ user_id: a.user_id._id, full_name: a.user_id.full_name }));
}
