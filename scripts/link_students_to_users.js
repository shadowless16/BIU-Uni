// Usage: node scripts/link_students_to_users.js
// Make sure your DB connection is set up in this script or required from your main app

const mongoose = require("mongoose");
const Student = require("../models/Student");
const User = require("../models/User");

// TODO: Update this with your actual MongoDB connection string
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://<username>:<password>@<cluster-url>/clearance_system'; // Use production MongoDB URI or keep as is for local dev

async function main() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log("Connected to MongoDB");

  const students = await Student.find();
  let updated = 0;
  for (const student of students) {
    // Try to find a user by matricNumber or studentId (adjust as needed)
    const user = await User.findOne({ studentId: student.matricNumber })
      || await User.findOne({ studentId: student.studentId })
      || await User.findOne({ email: student.email }); // fallback if you have email
    if (user) {
      if (!student.userId || String(student.userId) !== String(user._id)) {
        student.userId = user._id;
        await student.save();
        updated++;
        console.log(`Linked student ${student.matricNumber} to user ${user._id}`);
      }
    } else {
      console.log(`No user found for student ${student.matricNumber}`);
    }
  }
  console.log(`Done. Updated ${updated} students.`);
  await mongoose.disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
