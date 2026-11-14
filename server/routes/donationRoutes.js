const express = require('express');
const router = express.Router();
const {
  createDonation,
  getNearbyDonations,
  getMyDonations,
  claimDonation,
  markPickedUp,
  getMyClaims,
  getImpactStats,
} = require('../controllers/donationController');
const { protect } = require('../middleware/authMiddleware');
const { upload } = require('../config/cloudinary');

// Public live telemetry route
router.get('/stats', getImpactStats);

router.use(protect);

router.post('/create', upload.single('foodImage'), createDonation);
router.get('/nearby', getNearbyDonations);
router.get('/my-donations', getMyDonations);
router.get('/my-claims', getMyClaims);
router.put('/:id/claim', claimDonation);
router.put('/:id/pickup', markPickedUp);

module.exports = router;