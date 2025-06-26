// Script to hash plain text passwords for users in MongoDB
// Usage: node scripts/hashPlainPasswords.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://<username>:<password>@<cluster-url>/clearance_system'; // Use production MongoDB URI or keep as is for local dev

async function hashPlainPasswords() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to MongoDB');

  // Find users whose password does not start with $2b$ (bcrypt hash)
  const users = await User.find({ password: { $not: /^\$2b\$/ } });
  if (users.length === 0) {
    console.log('No users with plain text passwords found.');
    return;
  }

  for (const user of users) {
    const hashed = await bcrypt.hash(user.password, 12);
    user.password = hashed;
    await user.save();
    console.log(`Updated password for user: ${user.email}`);
  }

  console.log('Done updating users.');
  await mongoose.disconnect();
}

hashPlainPasswords().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
