const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { validateRegisterInput, validateLoginInput } = require('../validators/authValidators');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const runAuthTests = async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/shareplate';
  console.log('====================================================');
  console.log('      SHAREPLATE AUTHENTICATION TEST SUITE         ');
  console.log('====================================================');
  console.log(`Connecting to: ${mongoUri}`);

  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
    console.log('✓ MongoDB connection established successfully.\n');

    let passedTests = 0;
    let totalTests = 0;

    const assert = (condition, description) => {
      totalTests++;
      if (condition) {
        console.log(`✓ [PASS] Test ${totalTests}: ${description}`);
        passedTests++;
      } else {
        console.error(`✗ [FAIL] Test ${totalTests}: ${description}`);
      }
    };

    // 1. Validator Tests: Disallowing 'admin' role in public registration
    const adminRegCheck = validateRegisterInput({
      name: 'Hacker Guy',
      email: 'hacker@example.com',
      password: 'password123',
      role: 'admin',
    });
    assert(!adminRegCheck.isValid, 'Public registration rejects role="admin"');

    // 2. Validator Tests: Requiring min 6 char password
    const shortPasswordCheck = validateRegisterInput({
      name: 'John Doe',
      email: 'john@example.com',
      password: '123',
      role: 'donor',
    });
    assert(!shortPasswordCheck.isValid, 'Password shorter than 6 characters is rejected');

    // 3. Validator Tests: Email format
    const badEmailCheck = validateRegisterInput({
      name: 'John Doe',
      email: 'not-an-email',
      password: 'password123',
      role: 'donor',
    });
    assert(!badEmailCheck.isValid, 'Malformed email format is rejected');

    // Clean up test users if existing
    const testDonorEmail = 'testdonor@campusdining.edu';
    const testRecipientEmail = 'testrecipient@shelter.org';
    await User.deleteMany({ email: { $in: [testDonorEmail, testRecipientEmail] } });

    // 4. Test Donor Creation in MongoDB
    const plainDonorPassword = 'DonorSecurePass2026!';
    const donorUser = await User.create({
      name: 'City Campus Dining Services',
      email: testDonorEmail,
      password: plainDonorPassword,
      role: 'donor',
      phone: '+1-555-0142',
      organizationType: 'College Cafeteria',
    });
    assert(donorUser && donorUser._id, 'Donor account saved to MongoDB users collection');

    // 5. Test Password Hashing in Database
    const rawDonorDoc = await User.findById(donorUser._id).select('+password');
    const isBcryptHash = rawDonorDoc.password.startsWith('$2a$') || rawDonorDoc.password.startsWith('$2b$');
    const isPlaintext = rawDonorDoc.password === plainDonorPassword;
    assert(isBcryptHash && !isPlaintext, 'Password is stored as a secure bcrypt hash ($2a$/$2b$), never plaintext');

    // 6. Test Password Comparison
    const correctPasswordMatch = await donorUser.comparePassword(plainDonorPassword);
    const wrongPasswordMatch = await donorUser.comparePassword('WrongPassword123');
    assert(correctPasswordMatch === true && wrongPasswordMatch === false, 'bcrypt password comparison accurately verifies valid vs invalid credentials');

    // 7. Test Duplicate Email Prevention
    let duplicateCaught = false;
    try {
      await User.create({
        name: 'Imposter Donor',
        email: testDonorEmail,
        password: 'AnotherPassword123',
        role: 'donor',
      });
    } catch (err) {
      if (err.code === 11000) duplicateCaught = true;
    }
    assert(duplicateCaught, 'MongoDB unique index on email prevents duplicate account registration (E11000)');

    // 8. Test Recipient Creation
    const plainRecipientPassword = 'RecipientSecure2026!';
    const recipientUser = await User.create({
      name: 'Hope Community Food Pantry',
      email: testRecipientEmail,
      password: plainRecipientPassword,
      role: 'recipient',
      phone: '+1-555-0188',
      organizationType: 'Community NGO',
    });
    assert(recipientUser && recipientUser.role === 'recipient', 'Recipient account saved with role="recipient"');

    // 9. Test toSafeObject method (strips sensitive fields)
    const safeObj = donorUser.toSafeObject();
    assert(safeObj.password === undefined && safeObj.name === 'City Campus Dining Services', 'toSafeObject() strips password from API payload');

    // 10. Verify users collection in MongoDB
    const totalUsers = await User.countDocuments();
    assert(totalUsers >= 2, `MongoDB 'users' collection contains ${totalUsers} verified documents`);

    console.log('\n====================================================');
    console.log(`TEST RESULTS: ${passedTests} / ${totalTests} PASSED`);
    console.log('====================================================\n');

    process.exit(passedTests === totalTests ? 0 : 1);
  } catch (err) {
    console.error('Fatal test error:', err);
    process.exit(1);
  }
};

runAuthTests();
