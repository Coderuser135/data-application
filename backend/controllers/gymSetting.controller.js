import GymSettings from '../models/gymSetting.model.js';

export const getGymSettings = async (req, res, next) => {
  try {
    let settings = await GymSettings.findOne();

    if (!settings) {
      settings = await GymSettings.create({});
    }

    res.json(settings);
  } catch (error) {
    next(error);
  }
};

export const updateGymSettings = async (req, res, next) => {
  try {
    let settings = await GymSettings.findOne();

    if (!settings) {
      settings = await GymSettings.create(req.body);
    } else {
      Object.assign(settings, req.body);
      await settings.save();
    }

    res.json(settings);
  } catch (error) {
    next(error);
  }
};
