import mongoose from 'mongoose';

const bodyMeasurementSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  gym_admission_id: { type: mongoose.Schema.Types.ObjectId, ref: 'GymAdmission', default: null },
  age: { type: Number, default: 0, min: 0 },
  height: { type: Number, default: 0, min: 0 },
  weight: { type: Number, default: 0, min: 0 },
  stomach: { type: Number, default: 0, min: 0 },
  chest: { type: Number, default: 0, min: 0 },
  biceps: { type: Number, default: 0, min: 0 },
  back: { type: Number, default: 0, min: 0 },
  legs: { type: Number, default: 0, min: 0 },
  body_fat: { type: Number, default: 0, min: 0 },
  muscle_mass: { type: Number, default: 0, min: 0 },
  notes: { type: String, default: '', maxlength: 2000 },
  measurement_date: { type: Date, default: Date.now },
}, { timestamps: true });

bodyMeasurementSchema.index({ user_id: 1, measurement_date: -1 });

export default mongoose.model('BodyMeasurement', bodyMeasurementSchema);
