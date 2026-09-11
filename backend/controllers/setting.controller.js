import * as settingsService from '../services/setting.service.js';

export async function getSettings(req, res, next) {
  try {
    const settings = await settingsService.getSettings(req.user._id);
    res.json(settings);
  } catch (err) { next(err); }
}

export async function updateSettings(req, res, next) {
  try {
    const settings = await settingsService.updateSettings(req.user._id, req.body);
    res.json(settings);
  } catch (err) { next(err); }
}
