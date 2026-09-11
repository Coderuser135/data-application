import * as userService from '../services/user.service.js';

export async function getProfile(req, res, next) {
  try {
    const user = await userService.getUserProfile(req.user._id);
    res.json(user);
  } catch (err) { next(err); }
}

export async function updateProfile(req, res, next) {
  try {
    const user = await userService.updateUserProfile(req.user._id, req.body);
    res.json(user);
  } catch (err) { next(err); }
}

export async function getAllUsers(req, res, next) {
  try {
    const users = await userService.getAllUsers();
    res.json(users);
  } catch (err) { next(err); }
}
