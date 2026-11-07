import User from '../models/user.model.js';
import { ApiError } from '../utils/errors.utils.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../utils/cloudinaryUpload.utils.js';

export const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) throw new ApiError(404, 'User not found');
    res.json(user);
  } catch (error) { next(error); }
};

export const updateProfile = async (req, res, next) => {
  let uploadedAvatar;
  try {
    const { full_name, phone, address } = req.body;
    const updates = {};
    if (full_name !== undefined) {
      const value = String(full_name).trim();
      if (!value || value.length > 100) throw new ApiError(400, 'Please enter a valid name (1–100 characters)');
      updates.full_name = value;
    }
    if (phone !== undefined) {
      const value = String(phone).trim();
      if (value.length > 30) throw new ApiError(400, 'Phone number is too long');
      updates.phone = value;
    }
    if (address !== undefined) {
      const value = String(address).trim();
      if (value.length > 500) throw new ApiError(400, 'Address must be 500 characters or fewer');
      updates.address = value;
    }

    const existing = await User.findById(req.user._id);
    if (!existing) throw new ApiError(404, 'User not found');

    if (req.file) {
      uploadedAvatar = await uploadToCloudinary(req.file.buffer, 'heaven-gym/avatars');
      updates.avatar_url = uploadedAvatar.secure_url;
      updates.avatar_public_id = uploadedAvatar.public_id;
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    );
    if (!user) throw new ApiError(404, 'User not found');

    // Remove the previous image only after the new profile has been saved.
    if (uploadedAvatar && existing.avatar_public_id && existing.avatar_public_id !== uploadedAvatar.public_id) {
      await deleteFromCloudinary(existing.avatar_public_id).catch(() => {});
    }
    res.json(user);
  } catch (error) {
    if (uploadedAvatar?.public_id) await deleteFromCloudinary(uploadedAvatar.public_id).catch(() => {});
    next(error);
  }
};

export const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (error) { next(error); }
};
