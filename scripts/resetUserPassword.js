// Script to reset a user's password to a new value (hashed)
// Usage: node scripts/resetUserPassword.js <email> <newPassword>

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/clearance_system'; // Update if needed

async function resetUserPassword(email, newPassword) {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    console.log('User not found:', email);
    return;
  }

  const hashed = await bcrypt.hash(newPassword, 12);
  // Use updateOne to avoid triggering pre-save hook (prevents double-hashing)
  await User.updateOne({ _id: user._id }, { $set: { password: hashed } });
  console.log(`Password updated for user: ${user.email}`);
  await mongoose.disconnect();
}

const [,, email, newPassword] = process.argv;
if (!email || !newPassword) {
  console.log('Usage: node scripts/resetUserPassword.js <email> <newPassword>');
  process.exit(1);
}

resetUserPassword(email, newPassword).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
