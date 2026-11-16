// Mock Data for SharePlate — Surplus Food Sharing Platform
// Used for Phase 1 UI presentation and initial testing.
// Clearly identified demo content.

export const MOCK_CATEGORIES = [
  { id: 'all', label: 'All Items', icon: 'Sparkles' },
  { id: 'cooked-meals', label: 'Cooked Meals', icon: 'Soup' },
  { id: 'bakery', label: 'Bakery', icon: 'Croissant' },
  { id: 'fruits-vegetables', label: 'Fruits & Veggies', icon: 'Carrot' },
  { id: 'packaged-food', label: 'Packaged Food', icon: 'Package' },
  { id: 'groceries', label: 'Groceries', icon: 'ShoppingBag' },
  { id: 'other', label: 'Other', icon: 'Coffee' },
];

export const MOCK_LISTINGS = [
  {
    id: 'sp-101',
    title: 'Surplus Lunch Buffet - Steamed Basmati & Paneer Butter Masala',
    category: 'cooked-meals',
    description: 'Freshly prepared lunch buffet surplus from university campus convention. Kept under commercial food warmers at 65°C. Cleanly packed in sanitized food-grade aluminum containers.',
    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80',
    quantity: 18,
    unit: 'boxes',
    servings: 18,
    donor: {
      id: 'd-1',
      name: 'Central Campus Dining Hall',
      type: 'College Cafeteria',
      verified: true,
      rating: 4.9,
      totalDonations: 142
    },
    pickupAddress: {
      facility: 'Student Center, Block B Ground Floor',
      street: '45 University Avenue',
      city: 'Metro City',
      distanceKm: 0.8,
      coordinates: [77.5946, 12.9716]
    },
    pickupWindow: {
      start: '14:30',
      end: '16:30',
      instructions: 'Enter via Gate 2, call dining manager at reception'
    },
    expiryTime: new Date(Date.now() + 3.5 * 3600 * 1000).toISOString(), // ~3.5 hours from now
    dietary: ['Vegetarian', 'Nut-Free'],
    allergens: ['Dairy (Paneer)'],
    status: 'Available',
    createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString()
  },
  {
    id: 'sp-102',
    title: 'Artisan Sourdough & Multigrain Loaves (End of Day Bake)',
    category: 'bakery',
    description: 'Assorted artisan breads and rustic baguettes baked this morning. Crisp crust, tender crumb, 100% natural sourdough fermentation. Perfect for immediate consumption or freezing.',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
    quantity: 12,
    unit: 'loaves',
    servings: 24,
    donor: {
      id: 'd-2',
      name: 'Flour & Hearth Artisan Bakery',
      type: 'Bakery & Cafe',
      verified: true,
      rating: 5.0,
      totalDonations: 88
    },
    pickupAddress: {
      facility: 'Side entrance pickup counter',
      street: '12 Baker Street, Market Square',
      city: 'Metro City',
      distanceKm: 1.4,
      coordinates: [77.5978, 12.9735]
    },
    pickupWindow: {
      start: '18:00',
      end: '20:00',
      instructions: 'Please bring your own clean tote bag or container.'
    },
    expiryTime: new Date(Date.now() + 24 * 3600 * 1000).toISOString(), // 24 hours
    dietary: ['Vegan', 'Dairy-Free'],
    allergens: ['Wheat (Gluten)'],
    status: 'Available',
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString()
  },
  {
    id: 'sp-103',
    title: 'Fresh Organic Apples & Valencia Oranges Crate',
    category: 'fruits-vegetables',
    description: 'Farm-direct fresh crate of seasonal crisp apples and sweet oranges from weekly farmers market surplus. Minor superficial blemishes, 100% crisp, juicy and fresh inside.',
    image: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=800&q=80',
    quantity: 15,
    unit: 'kg',
    servings: 35,
    donor: {
      id: 'd-3',
      name: 'Green Valley Organic Market',
      type: 'Grocery & Produce',
      verified: true,
      rating: 4.8,
      totalDonations: 64
    },
    pickupAddress: {
      facility: 'Loading Dock C',
      street: '88 Orchard Road',
      city: 'Metro City',
      distanceKm: 2.1,
      coordinates: [77.6012, 12.9698]
    },
    pickupWindow: {
      start: '15:00',
      end: '19:00',
      instructions: 'Ring buzzer at loading bay door'
    },
    expiryTime: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
    dietary: ['100% Vegan', 'Gluten-Free', 'Raw Produce'],
    allergens: [],
    status: 'Available',
    createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString()
  },
  {
    id: 'sp-104',
    title: 'Wholesome Vegetable Pulao & Cucumber Raita',
    category: 'cooked-meals',
    description: 'Surplus fragrant basmati rice cooked with fresh seasonal garden peas, carrots, french beans, and aromatic whole spices. Paired with fresh mint cucumber raita packed separately.',
    image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80',
    quantity: 25,
    unit: 'servings',
    servings: 25,
    donor: {
      id: 'd-4',
      name: 'Silver Oak Banquet & Events',
      type: 'Event Organizer',
      verified: true,
      rating: 4.7,
      totalDonations: 53
    },
    pickupAddress: {
      facility: 'Kitchen Exit Gate',
      street: '210 Palace Cross Road',
      city: 'Metro City',
      distanceKm: 3.2,
      coordinates: [77.5891, 12.9812]
    },
    pickupWindow: {
      start: '16:00',
      end: '18:00',
      instructions: 'Ask for Chef Sharma at Service Dispatch'
    },
    expiryTime: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
    dietary: ['Vegetarian'],
    allergens: ['Dairy (Raita)'],
    status: 'Available',
    createdAt: new Date(Date.now() - 1.5 * 3600 * 1000).toISOString()
  },
  {
    id: 'sp-105',
    title: 'Sealed Greek Yogurt Pots & Almond Milk Cartons',
    category: 'packaged-food',
    description: 'Factory sealed single-serve Greek yogurts (plain & berry) and shelf-stable unsweetened almond milk. Best before date is within 4 days. Stored in commercial walk-in cooler.',
    image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=800&q=80',
    quantity: 30,
    unit: 'packs',
    servings: 30,
    donor: {
      id: 'd-5',
      name: 'Sunrise Supermart',
      type: 'Supermarket',
      verified: true,
      rating: 4.9,
      totalDonations: 195
    },
    pickupAddress: {
      facility: 'Customer Service Counter',
      street: '72 Commercial Boulevard',
      city: 'Metro City',
      distanceKm: 1.9,
      coordinates: [77.6045, 12.9750]
    },
    pickupWindow: {
      start: '10:00',
      end: '21:00',
      instructions: 'Show app reservation screen to counter supervisor'
    },
    expiryTime: new Date(Date.now() + 72 * 3600 * 1000).toISOString(),
    dietary: ['Vegetarian', 'High Protein'],
    allergens: ['Dairy (Yogurt)', 'Tree Nuts (Almond Milk)'],
    status: 'Available',
    createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString()
  },
  {
    id: 'sp-106',
    title: 'Fresh Butter Croissants & Blueberry Danish Pastries',
    category: 'bakery',
    description: 'Crispy flaky French butter croissants and freshly baked fruit Danish pastries. Made with European butter. Packaged in sealed pastry bakery boxes of 4 each.',
    image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=80',
    quantity: 10,
    unit: 'boxes (4 pcs)',
    servings: 40,
    donor: {
      id: 'd-2',
      name: 'Flour & Hearth Artisan Bakery',
      type: 'Bakery & Cafe',
      verified: true,
      rating: 5.0,
      totalDonations: 88
    },
    pickupAddress: {
      facility: 'Front Counter',
      street: '12 Baker Street, Market Square',
      city: 'Metro City',
      distanceKm: 1.4,
      coordinates: [77.5978, 12.9735]
    },
    pickupWindow: {
      start: '17:30',
      end: '19:30',
      instructions: 'Pickup before 19:30'
    },
    expiryTime: new Date(Date.now() + 18 * 3600 * 1000).toISOString(),
    dietary: ['Vegetarian'],
    allergens: ['Wheat', 'Dairy', 'Eggs'],
    status: 'Available',
    createdAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString()
  }
];

export const MOCK_IMPACT_STATS = {
  mealsRedistributed: '16,450+',
  foodSavedKg: '7,120 kg',
  activeDonors: '140+',
  co2PreventedKg: '18,500 kg',
  activeListingsNow: 24,
  partnerOrganizations: '38+'
};

export const MOCK_PARTNERS = [
  { name: 'City University Dining', type: 'Campus Dining Partner', logo: 'GraduationCap' },
  { name: 'Flour & Hearth Bakery', type: 'Artisan Bakery', logo: 'Utensils' },
  { name: 'Green Valley Organics', type: 'Produce Partner', logo: 'Apple' },
  { name: 'Hope Community Center', type: 'Community Food Bank', logo: 'HeartHandshake' },
  { name: 'Sunrise Food Mart', type: 'Retail Grocer', logo: 'Store' },
  { name: 'Silver Oak Banquets', type: 'Hospitality Partner', logo: 'Building2' }
];

export const MOCK_TESTIMONIALS = [
  {
    id: 't-1',
    quote: "At our university dining hall, estimating daily attendance for 1,200 students always left edible surplus. SharePlate helps us redirect 30 to 50 warm nutritious meals every evening to local shelters within minutes.",
    author: "Rajesh Menon",
    role: "Head of Campus Food Services, City University",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
    verified: true
  },
  {
    id: 't-2',
    quote: "As an artisan baker, discarding wholesome sourdough loaves at closing broke my heart. With SharePlate's pickup window feature, students and neighbors collect fresh bread every evening with dignity and gratitude.",
    author: "Elena Rostova",
    role: "Proprietor, Flour & Hearth Bakery",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80",
    verified: true
  },
  {
    id: 't-3',
    quote: "Our student community center frequently hosts late study sessions. SharePlate allows us to coordinate timely surplus pickups from nearby cafes, cutting student food expenses while eliminating local food waste.",
    author: "Aakash Patel",
    role: "Student Food Pantry Coordinator",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
    verified: true
  }
];

export const HOW_IT_WORKS_STEPS = [
  {
    step: '01',
    title: 'Post Surplus in 60 Seconds',
    description: 'Cafeterias, restaurants, bakeries, or event hosts list surplus items with quantities, allergen tags, and a convenient pickup window.',
    icon: 'UploadCloud',
    badge: 'For Donors'
  },
  {
    step: '02',
    title: 'Discover & Reserve Nearby',
    description: 'Community members and volunteers find available food on an interactive radius map and instantly claim portions for free.',
    icon: 'MapPin',
    badge: 'For Recipients'
  },
  {
    step: '03',
    title: 'Pick Up & Prevent Waste',
    description: 'Recipients present their digital reservation badge during the pickup window. Food is saved, impact is logged in real-time.',
    icon: 'HeartHandshake',
    badge: 'Zero Food Waste'
  }
];
