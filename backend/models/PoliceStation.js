const mongoose = require('mongoose');

const policeStationSchema = new mongoose.Schema(
  {
    id: { type: Number, unique: true },
    station_name: { type: String, required: true },
    station_code: { type: String, required: true, unique: true },
    address: { type: String, required: true },
    district: { type: String, required: true },
    state: { type: String, required: true },
    contact_number: { type: String, required: true },
    email: { type: String },
    jurisdiction_pincodes: { type: String },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

module.exports = mongoose.models.PoliceStation || mongoose.model('PoliceStation', policeStationSchema);
