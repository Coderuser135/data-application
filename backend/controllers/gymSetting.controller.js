import * as gymSettingsService from '../services/gymSetting.service.js';

export async function getGymSettings(req, res, next) {
  try {
    const settings = await gymSettingsService.getGymSettings();
    res.json(settings);
  } catch (err) { next(err); }
}

export async function updateGymSettings(req, res, next) {
  try {
    const settings = await gymSettingsService.updateGymSettings(req.body);
    res.json(settings);
  } catch (err) { next(err); }
}
