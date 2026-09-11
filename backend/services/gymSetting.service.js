import GymSettings from '../models/gymSetting.model.js';

export async function getGymSettings() {
  let settings = await GymSettings.findOne();
  if (!settings) {
    settings = await GymSettings.create({});
  }
  return settings;
}

export async function updateGymSettings(data) {
  let settings = await GymSettings.findOne();
  if (!settings) {
    settings = await GymSettings.create(data);
  } else {
    Object.assign(settings, data);
    await settings.save();
  }
  return settings;
}
