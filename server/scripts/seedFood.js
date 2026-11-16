const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../models/User');
const FoodListing = require('../models/FoodListing');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const seedFoodListings = async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/shareplate';
  console.log('[Seed Food] Connecting to MongoDB...');

  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
    console.log('[Seed Food] MongoDB Connected.');

    // Ensure 2dsphere sparse index is created
    try {
      await FoodListing.collection.dropIndex('location_2dsphere');
    } catch (ignore) {}
    await FoodListing.collection.createIndex({ location: '2dsphere' }, { sparse: true });
    console.log('[Seed Food] 2dsphere sparse index verified on FoodListing.location.');

    // Find test donor
    let donor = await User.findOne({ email: 'donor@greenhearth.com' });
    if (!donor) {
      donor = await User.findOne({ role: 'donor' });
    }

    if (!donor) {
      console.error('[Seed Food] No donor found! Please run seedAdmin.js or register a donor first.');
      process.exit(1);
    }

    console.log(`[Seed Food] Seeding geospatial listings under donor: ${donor.name} (${donor.email})`);

    // Clear existing sample listings
    await FoodListing.deleteMany({ donor: donor._id });

    const now = Date.now();

    const sampleListings = [
      {
        title: 'Surplus Lunch Buffet — Basmati Rice & Paneer Butter Masala',
        description: 'Freshly prepared convention buffet surplus. Kept under commercial warmers at 65°C and cleanly packed in individual sanitized containers. Rich, aromatic and nourishing.',
        category: 'cooked meals',
        quantity: 24,
        unit: 'boxes',
        servingsCount: 24,
        imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80',
        donor: donor._id,
        pickupAddress: 'Student Center, Block B Ground Floor, 45 University Avenue',
        pickupInstructions: 'Enter through Gate 2 service dock and ask for Dining Manager on duty',
        location: {
          type: 'Point',
          coordinates: [77.5946, 12.9716], // [longitude, latitude]
        },
        pickupStartTime: new Date(now + 30 * 60 * 1000), // in 30 mins
        pickupEndTime: new Date(now + 3.5 * 3600 * 1000), // in 3.5 hours
        expiryTime: new Date(now + 4 * 3600 * 1000), // in 4 hours
        allergenInformation: 'Contains Dairy (Paneer). Nut-free.',
        foodHandlingNotes: 'Store below 5°C or consume within 2 hours of collection.',
        status: 'available',
      },
      {
        title: 'Artisan Sourdough & Multigrain Loaves (Morning Bake Surplus)',
        description: 'Assorted crusty sourdough boules and multigrain loaves baked fresh at sunrise. Made with organic stoneground flours and natural slow fermentation. Perfect for sandwiches or freezing.',
        category: 'bakery',
        quantity: 16,
        unit: 'loaves',
        servingsCount: 32,
        imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
        donor: donor._id,
        pickupAddress: 'Flour & Hearth Artisan Bakery, 12 Baker Street, Market Square',
        pickupInstructions: 'Pick up at the front counter. Please bring a clean tote or bag.',
        location: {
          type: 'Point',
          coordinates: [77.5978, 12.9735], // ~0.4 km from center
        },
        pickupStartTime: new Date(now + 60 * 60 * 1000),
        pickupEndTime: new Date(now + 8 * 3600 * 1000),
        expiryTime: new Date(now + 24 * 3600 * 1000), // in 24 hours
        allergenInformation: 'Contains Gluten (Wheat). Vegan friendly.',
        foodHandlingNotes: 'Keep at room temperature in paper bag or freeze.',
        status: 'available',
      },
      {
        title: 'Fresh Organic Apples & Valencia Oranges Farm Crates',
        description: 'Seasonal crisp apples and sweet juicy Valencia oranges directly from morning farmers market intake. Superficial visual variations, 100% ripe, sweet, crisp and nutritious inside.',
        category: 'fruits and vegetables',
        quantity: 18,
        unit: 'kg',
        servingsCount: 40,
        imageUrl: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=800&q=80',
        donor: donor._id,
        pickupAddress: 'Loading Dock C, Green Valley Organics, 88 Orchard Road',
        pickupInstructions: 'Ring buzzer at dispatch bay; staff will assist with crates',
        location: {
          type: 'Point',
          coordinates: [77.6012, 12.9698], // ~0.8 km from center
        },
        pickupStartTime: new Date(now + 15 * 60 * 1000),
        pickupEndTime: new Date(now + 12 * 3600 * 1000),
        expiryTime: new Date(now + 48 * 3600 * 1000), // in 48 hours
        allergenInformation: 'Raw Produce. 100% Allergen-free.',
        foodHandlingNotes: 'Rinse with clean water before direct consumption.',
        status: 'available',
      },
      {
        title: 'Aromatic Vegetable Pulao with Mint Cucumber Raita',
        description: 'Fragrant basmati rice gently spiced with green cardamom, cloves, garden peas, carrots and french beans. Accompanied by creamy fresh yogurt mint raita packed in sealed containers.',
        category: 'cooked meals',
        quantity: 30,
        unit: 'servings',
        servingsCount: 30,
        imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80',
        donor: donor._id,
        pickupAddress: 'Silver Oak Banquet Hall, 210 Palace Cross Road',
        pickupInstructions: 'Report to Kitchen Dispatch security desk at West Wing',
        location: {
          type: 'Point',
          coordinates: [77.5891, 12.9812], // ~1.3 km from center
        },
        pickupStartTime: new Date(now + 45 * 60 * 1000),
        pickupEndTime: new Date(now + 4 * 3600 * 1000),
        expiryTime: new Date(now + 5 * 3600 * 1000), // in 5 hours
        allergenInformation: 'Vegetarian. Raita contains dairy.',
        foodHandlingNotes: 'Keep chilled until reheat.',
        status: 'available',
      },
      {
        title: 'Flaky French Butter Croissants & Berry Danish Boxes',
        description: 'Traditional laminated pastries made with cultured butter. Flaky golden layers filled with vanilla custard and wild berry compote. Packed in bakery gift boxes of 4 pastries each.',
        category: 'bakery',
        quantity: 12,
        unit: 'boxes',
        servingsCount: 48,
        imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=80',
        donor: donor._id,
        pickupAddress: 'Flour & Hearth Artisan Bakery, 12 Baker Street, Market Square',
        pickupInstructions: 'Show SharePlate donor listing to counter attendant',
        location: {
          type: 'Point',
          coordinates: [77.5980, 12.9738], // ~0.45 km from center
        },
        pickupStartTime: new Date(now + 30 * 60 * 1000),
        pickupEndTime: new Date(now + 6 * 3600 * 1000),
        expiryTime: new Date(now + 18 * 3600 * 1000),
        allergenInformation: 'Contains Dairy, Gluten, Eggs.',
        foodHandlingNotes: 'Best enjoyed warm or at room temperature.',
        status: 'available',
      },
      {
        title: 'Sealed Greek Yogurt Pots & Organic Almond Milk Packs',
        description: 'Manufacturer sealed single-serve Greek yogurt tubs and shelf-stable unsweetened almond milks. Best-before date is within 5 days. Stored at strict 3°C refrigeration standards.',
        category: 'packaged food',
        quantity: 25,
        unit: 'packets',
        servingsCount: 25,
        imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=800&q=80',
        donor: donor._id,
        pickupAddress: 'Sunrise Supermart, 72 Commercial Boulevard',
        pickupInstructions: 'Customer service desk at primary entrance',
        location: {
          type: 'Point',
          coordinates: [77.6045, 12.9750], // ~1.2 km from center
        },
        pickupStartTime: new Date(now + 15 * 60 * 1000),
        pickupEndTime: new Date(now + 10 * 3600 * 1000),
        expiryTime: new Date(now + 72 * 3600 * 1000),
        allergenInformation: 'Yogurt contains Dairy; Milk contains Tree Nuts (Almonds).',
        foodHandlingNotes: 'Keep yogurt refrigerated.',
        status: 'available',
      },
      {
        title: 'Distant Suburban Farmhouse Fresh Bread (Out-of-Radius Test)',
        description: 'Rustic farmhouse loaves baked at an agricultural estate 22 km outside the city center. Used to test geospatial distance calculation and radius exclusion in 5 km searches.',
        category: 'bakery',
        quantity: 8,
        unit: 'loaves',
        servingsCount: 16,
        imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
        donor: donor._id,
        pickupAddress: 'Highway Farmhouse Shed 4, Rural Bypass Highway 7',
        pickupInstructions: 'Rural pickup only',
        location: {
          type: 'Point',
          coordinates: [77.7800, 13.1200], // ~22 km away from central anchor
        },
        pickupStartTime: new Date(now + 60 * 60 * 1000),
        pickupEndTime: new Date(now + 12 * 3600 * 1000),
        expiryTime: new Date(now + 36 * 3600 * 1000),
        allergenInformation: 'Gluten',
        foodHandlingNotes: 'Keep dry',
        status: 'available',
      },
      {
        title: 'Legacy Donation Listing (No Coordinates Test Item)',
        description: 'Older legacy surplus food listing created without coordinates to ensure backward compatibility. Must remain readable through regular browse, but excluded from geospatial $near search.',
        category: 'groceries',
        quantity: 10,
        unit: 'packets',
        servingsCount: 10,
        imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80',
        donor: donor._id,
        pickupAddress: 'Community Archives Depot',
        pickupInstructions: 'Legacy pickup instructions',
        // Deliberately no location field to test backward compatibility
        pickupStartTime: new Date(now + 30 * 60 * 1000),
        pickupEndTime: new Date(now + 6 * 3600 * 1000),
        expiryTime: new Date(now + 24 * 3600 * 1000),
        allergenInformation: 'None',
        foodHandlingNotes: 'Legacy test item',
        status: 'available',
      },
      {
        title: 'Expired Catered Food (Geospatial Exclusion Test Item)',
        description: 'Event surplus food that expired 3 hours ago. Has coordinates, but must be excluded from nearby food search because its expiryTime is in the past.',
        category: 'cooked meals',
        quantity: 14,
        unit: 'boxes',
        servingsCount: 14,
        imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80',
        donor: donor._id,
        pickupAddress: 'Central Convention Hall, 45 University Ave',
        pickupInstructions: 'Expired test',
        location: {
          type: 'Point',
          coordinates: [77.5946, 12.9716],
        },
        pickupStartTime: new Date(now - 8 * 3600 * 1000),
        pickupEndTime: new Date(now - 4 * 3600 * 1000),
        expiryTime: new Date(now - 3 * 3600 * 1000), // Expired 3 hours ago
        allergenInformation: 'None',
        foodHandlingNotes: 'Expired safety item',
        status: 'expired',
      },
    ];

    const preparedListings = sampleListings.map((item) => ({
      ...item,
      originalQuantity: item.quantity,
      availableQuantity: item.quantity,
      reservedQuantity: 0,
      collectedQuantity: 0,
    }));

    const created = await FoodListing.insertMany(preparedListings);
    console.log(`[Seed Food Success] Successfully seeded ${created.length} geospatial food listings into MongoDB!`);
    console.log(`[Seed Food Compass] Open MongoDB Compass -> 'shareplate' database -> 'foodlistings' collection.`);

    process.exit(0);
  } catch (error) {
    console.error('[Seed Food Error] Failed to seed listings:', error.message);
    process.exit(1);
  }
};

seedFoodListings();
