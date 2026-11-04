import GymSettings from '../models/gymSetting.model.js';

const VERIFIED_GYM_DEFAULTS = {
  gym_name: 'Heaven Gym',
  contact_phone: '+91 96501 23729',
  address: 'Jhanda Chowk, near LG showroom, Naya Tola, Purnia, Bihar 854301, India',
  opening_hours: 'Monday – Saturday: 6:00 AM – 10:30 PM; Sunday: 7:30 AM – 10:30 PM',
  maps_url: 'https://www.google.com/maps/search/?api=1&query=Heaven+Gym%2C+Jhanda+Chowk%2C+near+LG+showroom%2C+Naya+Tola%2C+Purnia%2C+Bihar+854301',
};

export async function getGymSettings() {
  let settings = await GymSettings.findOne();

  if (!settings) {
    settings = await GymSettings.create(VERIFIED_GYM_DEFAULTS);
    return settings;
  }

  // Backfill only blank profile fields. Never overwrite values already
  // entered by the gym owner in the admin settings panel.
  let changed = false;
  for (const [key, value] of Object.entries(VERIFIED_GYM_DEFAULTS)) {
    if (!String(settings[key] || '').trim()) {
      settings[key] = value;
      changed = true;
    }
  }

  if (changed) await settings.save();
  return settings;
}

export async function updateGymSettings(data) {
  let settings = await GymSettings.findOne();
  if (!settings) {
    settings = await GymSettings.create({ ...VERIFIED_GYM_DEFAULTS, ...data });
  } else {
    Object.assign(settings, data);
    await settings.save();
  }
  return settings;
}
