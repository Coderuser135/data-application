import MembershipPlan from '../models/membershipPlan.model.js';
import { ApiError } from '../utils/errors.utils.js';

export async function getAllPlans() {
  return MembershipPlan.find().sort({ display_order: 1, createdAt: -1 });
}

export async function createPlan(data) {
  if (!data.name || !data.name.trim()) throw new ApiError(400, 'Plan name is required');
  if (data.price < 0) throw new ApiError(400, 'Price cannot be negative');
  if (data.duration_days < 1) throw new ApiError(400, 'Duration must be at least 1 day');

  if (data.is_offer) {
    if (!data.original_price || data.original_price <= 0) throw new ApiError(400, 'Offer plans require an original price');
    if (data.price >= data.original_price) throw new ApiError(400, 'Offer price must be less than original price');
  }

  return MembershipPlan.create(data);
}

export async function updatePlan(id, data) {
  if (data.price !== undefined && data.price < 0) throw new ApiError(400, 'Price cannot be negative');
  if (data.duration_days !== undefined && data.duration_days < 1) throw new ApiError(400, 'Duration must be at least 1 day');
  if (data.is_offer && data.original_price && data.price && data.price >= data.original_price) {
    throw new ApiError(400, 'Offer price must be less than original price');
  }

  const plan = await MembershipPlan.findByIdAndUpdate(id, data, { new: true });
  if (!plan) throw new ApiError(404, 'Plan not found');
  return plan;
}

export async function deletePlan(id) {
  const plan = await MembershipPlan.findByIdAndDelete(id);
  if (!plan) throw new ApiError(404, 'Plan not found');
  return plan;
}
