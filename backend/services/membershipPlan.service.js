import MembershipPlan from '../models/membershipPlan.model.js';
import { ApiError } from '../utils/errors.utils.js';

function normalize(data = {}) {
  const value = { ...data };
  if (value.name !== undefined) value.name = String(value.name).trim();
  if (value.description !== undefined) value.description = String(value.description).trim();
  if (value.features !== undefined && !Array.isArray(value.features)) throw new ApiError(400, 'Features must be an array');
  if (value.price !== undefined) value.price = Number(value.price);
  if (value.original_price !== undefined && value.original_price !== null && value.original_price !== '') value.original_price = Number(value.original_price);
  if (value.duration_days !== undefined) value.duration_days = Number(value.duration_days);
  if (value.display_order !== undefined) value.display_order = Number(value.display_order);
  return value;
}

function validatePlan(data, partial = false) {
  if (!partial && (!data.name || !data.name.trim())) throw new ApiError(400, 'Plan name is required');
  if (data.price !== undefined && (!Number.isFinite(data.price) || data.price < 0)) throw new ApiError(400, 'Price must be a valid non-negative number');
  if (data.duration_days !== undefined && (!Number.isInteger(data.duration_days) || data.duration_days < 1)) throw new ApiError(400, 'Duration must be a positive whole number of days');
  if (data.original_price !== undefined && data.original_price !== null && (!Number.isFinite(data.original_price) || data.original_price < 0)) throw new ApiError(400, 'Original price is invalid');
  if (data.is_offer) {
    if (!Number.isFinite(data.original_price) || data.original_price <= 0) throw new ApiError(400, 'Offer plans require an original price');
    if (data.price === undefined || data.price >= data.original_price) throw new ApiError(400, 'Offer price must be less than original price');
  }
  if (data.offer_start_date && Number.isNaN(new Date(data.offer_start_date).getTime())) throw new ApiError(400, 'Invalid offer start date');
  if (data.offer_end_date && Number.isNaN(new Date(data.offer_end_date).getTime())) throw new ApiError(400, 'Invalid offer end date');
  if (data.offer_start_date && data.offer_end_date && new Date(data.offer_start_date) > new Date(data.offer_end_date)) throw new ApiError(400, 'Offer end date must be after start date');
}

export async function getAllPlans() { return MembershipPlan.find().sort({ display_order: 1, createdAt: -1 }); }

export async function createPlan(data) {
  const normalized = normalize(data);
  validatePlan(normalized);
  return MembershipPlan.create(normalized);
}

export async function updatePlan(id, data) {
  const normalized = normalize(data);
  const current = await MembershipPlan.findById(id);
  if (!current) throw new ApiError(404, 'Plan not found');
  const merged = { ...current.toObject(), ...normalized };
  validatePlan(merged, true);
  const plan = await MembershipPlan.findByIdAndUpdate(id, normalized, { new: true, runValidators: true });
  return plan;
}

export async function deletePlan(id) {
  const plan = await MembershipPlan.findByIdAndUpdate(id, { is_active: false }, { new: true, runValidators: true });
  if (!plan) throw new ApiError(404, 'Plan not found');
  return plan;
}
