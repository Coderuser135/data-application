import AppSettings from '../models/appSetting.model.js';
import { ApiError } from '../utils/errors.utils.js';

const allowedFields = ['theme', 'language', 'font_size', 'notify_membership', 'notify_orders', 'notify_payments'];
const allowedThemes = ['light', 'dark', 'system'];
const allowedFontSizes = ['small', 'medium', 'large'];

export const getSettings = async (req, res, next) => {
  try {
    let settings = await AppSettings.findOne({ user_id: req.user._id });

    if (!settings) {
      settings = await AppSettings.create({ user_id: req.user._id });
    }

    res.json(settings);
  } catch (error) {
    next(error);
  }
};

export const updateSettings = async (req, res, next) => {
  try {
    const update = Object.fromEntries(
      Object.entries(req.body || {}).filter(([key]) => allowedFields.includes(key))
    );

    if (update.theme !== undefined && !allowedThemes.includes(update.theme)) {
      throw new ApiError(400, 'Invalid theme');
    }

    if (update.font_size !== undefined && !allowedFontSizes.includes(update.font_size)) {
      throw new ApiError(400, 'Invalid font size');
    }

    for (const key of ['notify_membership', 'notify_orders', 'notify_payments']) {
      if (update[key] !== undefined && typeof update[key] !== 'boolean') {
        throw new ApiError(400, `Invalid ${key} value`);
      }
    }

    let settings = await AppSettings.findOne({ user_id: req.user._id });

    if (!settings) {
      settings = await AppSettings.create({ user_id: req.user._id, ...update });
    } else {
      Object.assign(settings, update);
      await settings.save();
    }

    res.json(settings);
  } catch (error) {
    next(error);
  }
};
