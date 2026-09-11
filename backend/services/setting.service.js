import AppSettings from '../models/appSetting.model.js';

export async function getSettings(userId) {
  let settings = await AppSettings.findOne({ user_id: userId });
  if (!settings) {
    settings = await AppSettings.create({ user_id: userId });
  }
  return settings;
}

export async function updateSettings(userId, data) {
  let settings = await AppSettings.findOne({ user_id: userId });
  if (!settings) {
    settings = await AppSettings.create({ user_id: userId, ...data });
  } else {
    Object.assign(settings, data);
    await settings.save();
  }
  return settings;
}
