import mongoose from 'mongoose';

const gymAdmissionSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  member_id: { type: String, required: true, unique: true },
  admission_date: { type: Date, default: () => new Date().toISOString().split('T')[0] },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  notes: { type: String, default: '' },
  emergency_contact_name: { type: String, default: '' },
  emergency_contact_phone: { type: String, default: '' },
  selected_plan_id: { type: mongoose.Schema.Types.ObjectId, ref: 'MembershipPlan', default: null },
}, { timestamps: true });

gymAdmissionSchema.index({ user_id: 1 });

export default mongoose.model('GymAdmission', gymAdmissionSchema);
