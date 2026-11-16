const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../models/User');

// Load environment variables from server root .env
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const seedAdmin = async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/shareplate';

  const adminName = process.env.ADMIN_NAME || 'Platform Administrator';
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@shareplate.org').toLowerCase().trim();
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@SharePlate2026';
  const adminPhone = process.env.ADMIN_PHONE || '+1-555-0199';

  console.log('[Seed] Connecting to MongoDB for Admin Account Provisioning...');
  console.log(`[Seed] Target Database: ${mongoUri}`);

  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
    console.log('[Seed] MongoDB Connected successfully.');

    // Check if admin with this email already exists
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log(`[Seed Info] Admin account (${adminEmail}) already exists in the database.`);
      console.log(`[Seed Info] ID: ${existingAdmin._id}, Role: ${existingAdmin.role}, Active: ${existingAdmin.isActive}`);
      console.log('[Seed Success] No duplicate admin created. Database is in a valid state.');
      process.exit(0);
    }

    // Create the admin account
    // The pre-save hook in User model will automatically hash the password with bcrypt
    const newAdmin = await User.create({
      name: adminName,
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
      phone: adminPhone,
      isActive: true,
    });

    console.log('====================================================');
    console.log('[Seed Success] Admin account successfully provisioned!');
    console.log(`  Name:     ${newAdmin.name}`);
    console.log(`  Email:    ${newAdmin.email}`);
    console.log(`  Role:     ${newAdmin.role}`);
    console.log(`  ID:       ${newAdmin._id}`);
    console.log('  Password: [Hashed securely in MongoDB via bcrypt]');
    console.log('====================================================');
    console.log('[Notice] Public registration cannot assign the "admin" role.');
    console.log('[Notice] Use this administrator account to verify Phase 2 protected admin routes.');

    process.exit(0);
  } catch (error) {
    console.error('[Seed Error] Failed to provision admin account:', error.message);
    process.exit(1);
  }
};

seedAdmin();
