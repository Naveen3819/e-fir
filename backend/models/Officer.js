const mongoose = require('mongoose');

const officerSchema = new mongoose.Schema(
  {
    id: { type: Number, unique: true },
    user_id: { type: Number, required: true },
    employee_id: { type: String, required: true, unique: true },
    rank: { type: String, required: true },
    police_station_id: { type: Number },
    department: { type: String, default: 'General Crime' },
    status: { type: String, enum: ['active', 'inactive', 'on_leave'], default: 'active' },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: false } }
);

module.exports = mongoose.models.Officer || mongoose.model('Officer', officerSchema);
