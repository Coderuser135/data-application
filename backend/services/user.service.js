import User from '../models/user.model.js';
import { ApiError } from '../utils/errors.utils.js';

export async function getUserProfile(userId) {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User not found');
  return user;
}

export async function updateUserProfile(userId, { full_name, phone, address }) {
  const user = await User.findByIdAndUpdate(
    userId,
    { full_name, phone, address },
    { new: true }
  );
  if (!user) throw new ApiError(404, 'User not found');
  return user;
}

export async function getAllUsers() {
  return User.find().sort({ createdAt: -1 });
}
