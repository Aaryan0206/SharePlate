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

    // Clear existing sample listings for this donor
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
          coordinates: [77.5946, 12.9716],
        },
        pickupStartTime: new Date(now + 30 * 60 * 1000),
        pickupEndTime: new Date(now + 4 * 3600 * 1000),
        expiryTime: new Date(now + 5 * 3600 * 1000),
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
          coordinates: [77.5978, 12.9735],
        },
        pickupStartTime: new Date(now + 60 * 60 * 1000),
        pickupEndTime: new Date(now + 8 * 3600 * 1000),
        expiryTime: new Date(now + 24 * 3600 * 1000),
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
          coordinates: [77.6012, 12.9698],
        },
        pickupStartTime: new Date(now + 15 * 60 * 1000),
        pickupEndTime: new Date(now + 12 * 3600 * 1000),
        expiryTime: new Date(now + 48 * 3600 * 1000),
        allergenInformation: 'Raw Produce. 100% Allergen-free.',
        foodHandlingNotes: 'Rinse with clean water before direct consumption.',
        status: 'available',
      },
      {
        title: 'Royal Hyderabadi Dum Biryani & Mirchi Ka Salan',
        description: 'Surplus fragrant long-grain basmati rice slow-cooked in sealed dum pots with caramelized onions, saffron, and seasonal vegetables. Accompanied by creamy peanut-sesame salan gravy in sealed containers.',
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
          coordinates: [77.5891, 12.9812],
        },
        pickupStartTime: new Date(now + 45 * 60 * 1000),
        pickupEndTime: new Date(now + 4.5 * 3600 * 1000),
        expiryTime: new Date(now + 5 * 3600 * 1000),
        allergenInformation: 'Vegetarian. Salan gravy contains peanuts and sesame.',
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
          coordinates: [77.5980, 12.9738],
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
          coordinates: [77.6045, 12.9750],
        },
        pickupStartTime: new Date(now + 15 * 60 * 1000),
        pickupEndTime: new Date(now + 10 * 3600 * 1000),
        expiryTime: new Date(now + 72 * 3600 * 1000),
        allergenInformation: 'Yogurt contains Dairy; Milk contains Tree Nuts (Almonds).',
        foodHandlingNotes: 'Keep yogurt refrigerated.',
        status: 'available',
      },
      {
        title: 'Crisp Hydroponic Salad Greens & Sweet Bell Peppers',
        description: 'Pesticide-free butterhead lettuce, sweet basil, vine cherry tomatoes, and colorful sweet bell peppers freshly harvested from urban hydroponic greenhouses.',
        category: 'fruits and vegetables',
        quantity: 14,
        unit: 'kg',
        servingsCount: 30,
        imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
        donor: donor._id,
        pickupAddress: 'Urban Roots Greenhouse, 104 Indiranagar 100ft Road',
        pickupInstructions: 'Enter through side green gate; dispatch team will load crates',
        location: {
          type: 'Point',
          coordinates: [77.6408, 12.9784],
        },
        pickupStartTime: new Date(now + 30 * 60 * 1000),
        pickupEndTime: new Date(now + 8 * 3600 * 1000),
        expiryTime: new Date(now + 36 * 3600 * 1000),
        allergenInformation: 'Produce. 100% Allergen-free.',
        foodHandlingNotes: 'Store in cool produce crisper.',
        status: 'available',
      },
      {
        title: 'Tandoori Paneer Tikka Wraps with Mint Chutney',
        description: 'Clay-oven roasted cottage cheese tikka cubes wrapped in freshly rolled flatbreads with spiced onion rings and mint coriander dressing. Packed in individual insulated wraps.',
        category: 'cooked meals',
        quantity: 20,
        unit: 'boxes',
        servingsCount: 20,
        imageUrl: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=800&q=80',
        donor: donor._id,
        pickupAddress: 'Spice Route Express, 54 Church Street, Brigade Plaza',
        pickupInstructions: 'Collect at the takeout window with your pickup code',
        location: {
          type: 'Point',
          coordinates: [77.6062, 12.9741],
        },
        pickupStartTime: new Date(now + 20 * 60 * 1000),
        pickupEndTime: new Date(now + 3.5 * 3600 * 1000),
        expiryTime: new Date(now + 4 * 3600 * 1000),
        allergenInformation: 'Contains Dairy (Paneer) and Gluten (Flatbread).',
        foodHandlingNotes: 'Reheat before eating if stored.',
        status: 'available',
      },
      {
        title: 'Nutritious Rolled Oats & Multi-Seed Granola Packs',
        description: 'Unopened family-size boxes of 100% whole grain rolled oats, wild flower honey toasted granola, chia seeds, and sunflower seeds. Great for breakfast pantries.',
        category: 'packaged food',
        quantity: 18,
        unit: 'packs',
        servingsCount: 36,
        imageUrl: 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?auto=format&fit=crop&w=800&q=80',
        donor: donor._id,
        pickupAddress: 'Sunrise Supermart, 72 Commercial Boulevard',
        pickupInstructions: 'Collect at Customer Service Desk',
        location: {
          type: 'Point',
          coordinates: [77.6045, 12.9750],
        },
        pickupStartTime: new Date(now + 10 * 60 * 1000),
        pickupEndTime: new Date(now + 12 * 3600 * 1000),
        expiryTime: new Date(now + 120 * 3600 * 1000),
        allergenInformation: 'Oats (Traces of gluten).',
        foodHandlingNotes: 'Store in cool, dry place.',
        status: 'available',
      },
      {
        title: 'Essential Dry Pantry Staples Kit (Rice, Dal & Oil)',
        description: 'Community pantry care packages containing aged basmati rice (5kg bags), unpolished toor dal split lentils (2kg), and cold-pressed sunflower cooking oil bottles.',
        category: 'groceries',
        quantity: 12,
        unit: 'boxes',
        servingsCount: 60,
        imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80',
        donor: donor._id,
        pickupAddress: 'Community Harvest Food Depot, 19 Koramangala 5th Block',
        pickupInstructions: 'Volunteers at Loading Bay 2 will assist with vehicle loading',
        location: {
          type: 'Point',
          coordinates: [77.6200, 12.9352],
        },
        pickupStartTime: new Date(now + 30 * 60 * 1000),
        pickupEndTime: new Date(now + 10 * 3600 * 1000),
        expiryTime: new Date(now + 180 * 3600 * 1000),
        allergenInformation: 'Vegan. Non-perishable.',
        foodHandlingNotes: 'Keep dry.',
        status: 'available',
      },
      {
        title: 'Kettle-Boiled Everything Bagels & Cream Cheese Tubs',
        description: 'Authentic kettle-boiled bagels coated with toasted sesame, poppy seeds, sea salt, and roasted garlic. Accompanied by sealed Philadelphia cream cheese spread tubs.',
        category: 'bakery',
        quantity: 15,
        unit: 'packets',
        servingsCount: 30,
        imageUrl: 'https://images.unsplash.com/photo-1585478259715-876acc5be8eb?auto=format&fit=crop&w=800&q=80',
        donor: donor._id,
        pickupAddress: 'Flour & Hearth Artisan Bakery, 12 Baker Street, Market Square',
        pickupInstructions: 'Collect at front counter; cream cheese is packed in thermal tote',
        location: {
          type: 'Point',
          coordinates: [77.5978, 12.9735],
        },
        pickupStartTime: new Date(now + 45 * 60 * 1000),
        pickupEndTime: new Date(now + 6 * 3600 * 1000),
        expiryTime: new Date(now + 24 * 3600 * 1000),
        allergenInformation: 'Gluten, Sesame, Dairy.',
        foodHandlingNotes: 'Keep cream cheese chilled.',
        status: 'available',
      },
      {
        title: 'Sweet Seasonal Tropical Fruit Basket (Pineapple & Mango)',
        description: 'Ripe golden Queen pineapples, sweet Alphonso mangoes, and red papayas. Harvested at peak maturity, whole and wholesome.',
        category: 'fruits and vegetables',
        quantity: 16,
        unit: 'kg',
        servingsCount: 32,
        imageUrl: 'https://images.unsplash.com/photo-1546548970-71785318a17b?auto=format&fit=crop&w=800&q=80',
        donor: donor._id,
        pickupAddress: 'Loading Dock C, Green Valley Organics, 88 Orchard Road',
        pickupInstructions: 'Collect from loading bay dispatch',
        location: {
          type: 'Point',
          coordinates: [77.6012, 12.9698],
        },
        pickupStartTime: new Date(now + 20 * 60 * 1000),
        pickupEndTime: new Date(now + 9 * 3600 * 1000),
        expiryTime: new Date(now + 40 * 3600 * 1000),
        allergenInformation: 'Raw Produce. 100% Allergen-free.',
        foodHandlingNotes: 'Store in cool room.',
        status: 'available',
      },
      {
        title: 'Homestyle Yellow Dal Tadka & Steamed Jeera Rice',
        description: 'Wholesome comforting yellow lentils tempered with ghee, cumin seeds, garlic, and dried Kashmiri chillies. Paired with aromatic steamed jeera basmati rice in spillproof boxes.',
        category: 'cooked meals',
        quantity: 22,
        unit: 'boxes',
        servingsCount: 22,
        imageUrl: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=800&q=80',
        donor: donor._id,
        pickupAddress: 'Student Center, Block B Ground Floor, 45 University Avenue',
        pickupInstructions: 'Enter via Gate 2, pick up at Hot Food Dispense counter',
        location: {
          type: 'Point',
          coordinates: [77.5946, 12.9716],
        },
        pickupStartTime: new Date(now + 30 * 60 * 1000),
        pickupEndTime: new Date(now + 4 * 3600 * 1000),
        expiryTime: new Date(now + 4.5 * 3600 * 1000),
        allergenInformation: 'Vegetarian. Dairy (Ghee).',
        foodHandlingNotes: 'Keep warm or reheat to 75°C.',
        status: 'available',
      },
      {
        title: 'Stoneground Whole Wheat Atta & Culinary Spices Pack',
        description: 'Dry pantry packs with fresh stoneground 100% whole wheat chakki flour (5kg bags) alongside sealed packets of ground turmeric, coriander powder, cumin seeds, and whole garam masala.',
        category: 'groceries',
        quantity: 12,
        unit: 'boxes',
        servingsCount: 45,
        imageUrl: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=800&q=80',
        donor: donor._id,
        pickupAddress: 'Community Harvest Food Depot, 19 Koramangala 5th Block',
        pickupInstructions: 'Collect at Volunteer Dispatch Desk',
        location: {
          type: 'Point',
          coordinates: [77.6200, 12.9352],
        },
        pickupStartTime: new Date(now + 40 * 60 * 1000),
        pickupEndTime: new Date(now + 12 * 3600 * 1000),
        expiryTime: new Date(now + 150 * 3600 * 1000),
        allergenInformation: 'Wheat (Gluten).',
        foodHandlingNotes: 'Store in cool dry place away from moisture.',
        status: 'available',
      },
      {
        title: 'Freshly Brewed South Indian Filter Coffee & Chai Flasks',
        description: 'Commercial insulated thermal beverage dispensers filled with freshly brewed chicory-infused filter coffee and aromatic cardamom ginger tea. Kept piping hot, ideal for community helpers and shelter mornings.',
        category: 'other',
        quantity: 16,
        unit: 'servings',
        servingsCount: 16,
        imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
        donor: donor._id,
        pickupAddress: 'Student Center, Block B Ground Floor, 45 University Avenue',
        pickupInstructions: 'Please bring your own thermal cups or borrow sanitized stainless mugs',
        location: {
          type: 'Point',
          coordinates: [77.5946, 12.9716],
        },
        pickupStartTime: new Date(now + 15 * 60 * 1000),
        pickupEndTime: new Date(now + 5 * 3600 * 1000),
        expiryTime: new Date(now + 5.5 * 3600 * 1000),
        allergenInformation: 'Contains Dairy (Milk).',
        foodHandlingNotes: 'Serve hot.',
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
          coordinates: [77.7800, 13.1200],
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
        pickupStartTime: new Date(now + 30 * 60 * 1000),
        pickupEndTime: new Date(now + 6 * 3600 * 1000),
        expiryTime: new Date(now + 24 * 3600 * 1000),
        allergenInformation: 'None',
        foodHandlingNotes: 'Legacy test item',
        status: 'available',
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
