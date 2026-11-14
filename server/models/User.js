const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['Donor', 'NGO'], required: true },
  contactNumber: { type: String, required: true },
  // GeoJSON format for Mapbox and MongoDB spatial queries
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true } // [longitude, latitude]
  },
  address: { type: String }
}, { timestamps: true });

// Creates a spatial index so we can search for "NGOs near me"
userSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('User', userSchema);