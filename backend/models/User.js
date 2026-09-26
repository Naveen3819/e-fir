const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    id: { type: Number, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    mobile: { type: String, required: true },
    password_hash: { type: String, required: true },
    role: { type: String, enum: ['citizen', 'police', 'admin'], default: 'citizen' },
    address: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    pincode: { type: String, default: '' },
    status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
