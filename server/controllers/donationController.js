const Donation = require('../models/Donation');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// @desc    Create a new donation with AI Vision Analysis
// @route   POST /api/donations/create
exports.createDonation = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload an image of the food' });
    }

    const imageUrl = req.file.path; // Cloudinary URL
    const rawDescription = req.body.rawDescription || '';

    // 1. Fetch the image from Cloudinary to pass to Gemini
    const imageResponse = await fetch(imageUrl);
    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');

    // 2. Prepare the AI Request with automatic fallback for 503 demand spikes
    const prompt = `
      Analyze this image of food along with the donor's description: "${rawDescription}".
      Respond ONLY with a valid JSON object matching this exact structure, with no markdown formatting or code blocks:
      {
        "foodItems": [{"name": "string", "estimatedWeightKg": number}],
        "condition": "Fresh" | "Needs Immediate Pickup" | "Unsafe",
        "dietaryTags": ["string"],
        "packaging": "string"
      }
    `;

    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType: req.file.mimetype || 'image/jpeg',
      },
    };

    const candidateModels = ['gemini-2.5-flash', 'gemini-3.8-flash', 'gemini-flash-latest'];
    let responseText = '';
    let lastAiError = null;

    for (const modelName of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent([prompt, imagePart]);
        responseText = result.response.text().trim();
        break; // Exit loop as soon as one succeeds
      } catch (err) {
        lastAiError = err;
        console.warn(`Model ${modelName} busy (${err.status || err.message}), trying fallback...`);
      }
    }

    if (!responseText) {
      throw lastAiError || new Error('All Gemini models failed to respond');
    }

    // Clean up markdown if the AI includes it by accident
    const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '');
    const aiStructuredData = JSON.parse(cleanJson);

    // 3. Save to MongoDB
    const donation = await Donation.create({
      donorId: req.user._id,
      imageUrl,
      rawDescription,
      aiStructuredData,
      location: {
        type: 'Point',
        coordinates: [
          parseFloat(req.body.longitude) || 0,
          parseFloat(req.body.latitude) || 0,
        ],
      },
    });

    res.status(201).json(donation);
  } catch (error) {
    console.error('AI Error:', error);
    res.status(500).json({ message: 'Error processing donation', error: error.message });
  }
};

// @desc    Get nearby available donations (for NGOs)
// @route   GET /api/donations/nearby
exports.getNearbyDonations = async (req, res) => {
  try {
    const { longitude, latitude, maxDistance = 10000 } = req.query; // maxDistance in meters (10km default)

    const donations = await Donation.find({
      status: 'Available',
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(longitude), parseFloat(latitude)] },
          $maxDistance: parseInt(maxDistance),
        },
      },
    }).populate('donorId', 'name contactNumber address');

    res.status(200).json(donations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all donations created by the logged-in donor
// @route   GET /api/donations/my-donations
exports.getMyDonations = async (req, res) => {
  try {
    const donations = await Donation.find({ donorId: req.user._id })
      .populate('claimedBy', 'name contactNumber')
      .sort({ createdAt: -1 });

    res.status(200).json(donations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Claim an available donation (for NGOs)
// @route   PUT /api/donations/:id/claim
exports.claimDonation = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);

    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }

    if (donation.status !== 'Available') {
      return res.status(400).json({ message: 'This donation has already been claimed' });
    }

    donation.status = 'Claimed';
    donation.claimedBy = req.user._id;
    await donation.save();

    const updatedDonation = await Donation.findById(donation._id)
      .populate('donorId', 'name contactNumber address')
      .populate('claimedBy', 'name contactNumber');

    res.status(200).json(updatedDonation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark a claimed donation as PickedUp
// @route   PUT /api/donations/:id/pickup
exports.markPickedUp = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);

    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }

    if (donation.claimedBy?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this donation' });
    }

    donation.status = 'PickedUp';
    await donation.save();

    res.status(200).json(donation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all donations claimed by the logged-in NGO
// @route   GET /api/donations/my-claims
exports.getMyClaims = async (req, res) => {
  try {
    const claims = await Donation.find({ claimedBy: req.user._id })
      .populate('donorId', 'name contactNumber address')
      .sort({ updatedAt: -1 });

    res.status(200).json(claims);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get platform-wide live impact telemetry
// @route   GET /api/donations/stats
exports.getImpactStats = async (req, res) => {
  try {
    const donations = await Donation.find({
      'aiStructuredData.condition': { $ne: 'Unsafe' },
    }).select('aiStructuredData.foodItems status');

    let totalWeightKg = 0;
    let activeListings = 0;
    let rescuedCount = 0;

    for (const d of donations) {
      if (d.status === 'Available') activeListings += 1;
      if (d.status === 'Claimed' || d.status === 'PickedUp') rescuedCount += 1;

      const batchWeight = (d.aiStructuredData?.foodItems || []).reduce(
        (sum, item) => sum + (Number(item.estimatedWeightKg) || 0),
        0
      );
      totalWeightKg += batchWeight;
    }

    const roundedKg = Number(totalWeightKg.toFixed(1));
    const mealsServed = Math.round(roundedKg * 2.5);
    const co2SavedKg = Number((roundedKg * 2.5).toFixed(1));

    res.status(200).json({
      totalWeightKg: roundedKg,
      mealsServed,
      co2SavedKg,
      rescuedCount,
      activeListings,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// const Donation = require('../models/Donation');
// const { GoogleGenerativeAI } = require('@google/generative-ai');

// // Initialize Gemini
// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// // @desc    Create a new donation with AI Vision Analysis
// // @route   POST /api/donations/create
// exports.createDonation = async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({ message: 'Please upload an image of the food' });
//     }

//     const imageUrl = req.file.path; // This is the Cloudinary URL
//     const rawDescription = req.body.rawDescription || '';
    
//     // 1. Fetch the image from Cloudinary to pass to Gemini
//     const imageResponse = await fetch(imageUrl);
//     const imageBuffer = await imageResponse.arrayBuffer();
//     const base64Image = Buffer.from(imageBuffer).toString('base64');

//     // 2. Prepare the AI Request with automatic fallback for 503 demand spikes
//         const prompt = `
//           Analyze this image of food along with the donor's description: "${rawDescription}".
//           Respond ONLY with a valid JSON object matching this exact structure, with no markdown formatting or code blocks:
//           {
//             "foodItems": [{"name": "string", "estimatedWeightKg": number}],
//             "condition": "Fresh" | "Needs Immediate Pickup" | "Unsafe",
//             "dietaryTags": ["string"],
//             "packaging": "string"
//           }
//         `;

//         const imagePart = {
//           inlineData: {
//             data: base64Image,
//             mimeType: req.file.mimetype || 'image/jpeg'
//           }
//         };

//         const candidateModels = ['gemini-3.8-flash', 'gemini-2.5-flash', 'gemini-flash-latest'];
//         let responseText = '';
//         let lastAiError = null;

//         for (const modelName of candidateModels) {
//           try {
//             const model = genAI.getGenerativeModel({ model: modelName });
//             const result = await model.generateContent([prompt, imagePart]);
//             responseText = result.response.text().trim();
//             break; // Exit loop as soon as one succeeds
//           } catch (err) {
//             lastAiError = err;
//             console.warn(`Model ${modelName} busy (${err.status || err.message}), trying fallback...`);
//           }
//         }

//         if (!responseText) {
//           throw lastAiError || new Error('All Gemini models failed to respond');
//         }
    // // 2. Prepare the AI Request
    // const model = genAI.getGenerativeModel({ model: 'gemini-3.8-flash' });
    // const prompt = `
    //   Analyze this image of food along with the donor's description: "${rawDescription}".
    //   Respond ONLY with a valid JSON object matching this exact structure, with no markdown formatting or code blocks:
    //   {
    //     "foodItems": [{"name": "string", "estimatedWeightKg": number}],
    //     "condition": "Fresh" | "Needs Immediate Pickup" | "Unsafe",
    //     "dietaryTags": ["string"],
    //     "packaging": "string"
    //   }
    // `;

    // const imagePart = {
    //   inlineData: {
    //     data: base64Image,
    //     mimeType: 'image/jpeg'
    //   }
    // };

    // 3. Get the AI Response
//     const result = await model.generateContent([prompt, imagePart]);
//     const responseText = result.response.text().trim();
    
//     // Clean up markdown if the AI includes it by accident
//     const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '');
//     const aiStructuredData = JSON.parse(cleanJson);

//     // 4. Save to MongoDB
//     const donation = await Donation.create({
//       donorId: req.user._id,
//       imageUrl,
//       rawDescription,
//       aiStructuredData,
//       // We will pass coordinates from the frontend later
//       location: {
//         type: 'Point',
//         coordinates: [req.body.longitude || 0, req.body.latitude || 0] 
//       }
//     });

//     res.status(201).json(donation);
//   } catch (error) {
//     console.error('AI Error:', error);
//     res.status(500).json({ message: 'Error processing donation', error: error.message });
//   }
// };

// // @desc    Get nearby available donations (for NGOs)
// // @route   GET /api/donations/nearby
// exports.getNearbyDonations = async (req, res) => {
//   try {
//     const { longitude, latitude, maxDistance = 10000 } = req.query; // maxDistance in meters (10km default)

//     const donations = await Donation.find({
//       status: 'Available',
//       location: {
//         $near: {
//           $geometry: { type: 'Point', coordinates: [parseFloat(longitude), parseFloat(latitude)] },
//           $maxDistance: parseInt(maxDistance)
//         }
//       }
//     }).populate('donorId', 'name contactNumber');

//     res.status(200).json(donations);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // @desc    Get all donations created by the logged-in donor
// // @route   GET /api/donations/my-donations
// exports.getMyDonations = async (req, res) => {
//   try {
//     const donations = await Donation.find({ donorId: req.user._id })
//       .populate('claimedBy', 'name contactNumber')
//       .sort({ createdAt: -1 });

//     res.status(200).json(donations);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };