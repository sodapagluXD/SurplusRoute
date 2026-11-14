const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
  donorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  imageUrl: { type: String, required: true }, 
  rawDescription: { type: String }, // Optional extra notes from the donor
  
  // This entire object is populated by Gemini 1.5 Flash Vision
  aiStructuredData: {
    foodItems: [{ 
      name: String, 
      estimatedWeightKg: Number 
    }],
    condition: { type: String, enum: ['Fresh', 'Needs Immediate Pickup', 'Unsafe'] },
    dietaryTags: [String],
    packaging: String
  },
  
  // Copy the donor's coordinates here when created for faster map loading
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true }
  },
  status: { type: String, enum: ['Available', 'Claimed', 'PickedUp'], default: 'Available' },
  claimedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true });

// Creates a spatial index so NGOs can search for "Food near me"
donationSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Donation', donationSchema);