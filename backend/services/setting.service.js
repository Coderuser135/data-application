import AppSettings from '../models/appSetting.model.js';
import { ApiError } from '../utils/errors.utils.js';

const allowedFields = ['theme', 'language', 'font_size', 'notify_membership', 'notify_orders', 'notify_payments'];
const allowedThemes = ['light', 'dark', 'system'];
const allowedFontSizes = ['small', 'medium', 'large'];

export async function getSettings(userId) {
  let settings = await AppSettings.findOne({ user_id: userId });
  if (!settings) settings = await AppSettings.create({ user_id: userId });
  return settings;
}

export async function updateSettings(userId, data) {
  const update = Object.fromEntries(Object.entries(data || {}).filter(([key]) => allowedFields.includes(key)));
  if (update.theme !== undefined && !allowedThemes.includes(update.theme)) throw new ApiError(400, 'Invalid theme');
  if (update.font_size !== undefined && !allowedFontSizes.includes(update.font_size)) throw new ApiError(400, 'Invalid font size');
  for (const key of ['notify_membership', 'notify_orders', 'notify_payments']) {
    if (update[key] !== undefined && typeof update[key] !== 'boolean') throw new ApiError(400, `Invalid ${key} value`);
  }
  let settings = await AppSettings.findOne({ user_id: userId });
  if (!settings) settings = await AppSettings.create({ user_id: userId, ...update });
  else { Object.assign(settings, update); await settings.save(); }
  return settings;
}
