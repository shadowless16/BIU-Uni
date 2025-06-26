const mongoose = require('mongoose');
const Department = require('./models/Department'); // Adjust path if needed

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://<username>:<password>@<cluster-url>/clearance_system'; // Use production MongoDB URI or keep as is for local dev

async function seedDepartments() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  // Remove existing departments
  await Department.deleteMany({});

  // Department data
  const departments = [
    {
      name: "Head of Department",
      code: "HOD",
      faculty: "Science",
      isRequired: true,
      requirements: [
        { name: "Registered all courses as specified for graduation" },
        { name: "No references or outstanding courses" }
      ],
      description: "Clearance by HOD"
    },
    {
      name: "Faculty",
      code: "FAC",
      faculty: "Science",
      isRequired: true,
      requirements: [
        { name: "Satisfied Faculty requirements for clearance" }
      ],
      description: "Faculty clearance"
    },
    {
      name: "University Library",
      code: "LIB",
      faculty: "General",
      isRequired: true,
      requirements: [
        { name: "Returned all library books loaned" }
      ],
      description: "Library clearance"
    },
    {
      name: "Campus Life Division",
      code: "CLD",
      faculty: "General",
      isRequired: true,
      requirements: [
        { name: "Met all requirements for Campus Life Division" }
      ],
      description: "Campus Life clearance"
    },
    {
      name: "Student Affairs",
      code: "SAF",
      faculty: "General",
      isRequired: true,
      requirements: [
        { name: "No disciplinary case" },
        { name: "Academic outfit returned for NYSC" }
      ],
      description: "Student Affairs clearance"
    },
    {
      name: "Summer School",
      code: "SUM",
      faculty: "General",
      isRequired: false,
      requirements: [
        { name: "Cleared from Summer School, no outstanding" }
      ],
      description: "Summer School clearance"
    },
    {
      name: "Bursary",
      code: "BUR",
      faculty: "General",
      isRequired: true,
      requirements: [
        { name: "Paid all required fees from admission to graduation" },
        { name: "No outstanding fees" }
      ],
      description: "Bursary clearance"
    },
    {
      name: "Office of Alumni Relations",
      code: "ALU",
      faculty: "General",
      isRequired: false,
      requirements: [
        { name: "Met all requirements for Alumni Relations" }
      ],
      description: "Alumni Relations clearance"
    },
    {
      name: "Certificate Screening Committee",
      code: "CSC",
      faculty: "General",
      isRequired: true,
      requirements: [
        { name: "Credentials screened and not found wanting" }
      ],
      description: "Certificate Screening clearance"
    }
  ];

  await Department.insertMany(departments);
  console.log('Departments seeded!');
  await mongoose.disconnect();
}

seedDepartments().catch((err) => {
  console.error(err);
  process.exit(1);
});













// // Usage: node seed.js
// // Make sure you have MongoDB running and your models are correct.

// const mongoose = require('mongoose');
// const User = require('./models/User');
// const Student = require('./models/Student');
// const Clearance = require('./models/Clearance');
// const Notification = require('./models/Notification');

// const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/clearance_system";

// async function seed() {
//     await mongoose.connect(MONGO_URI);
//     console.log('Connected to MongoDB');

//     // 1. Create a user
//     const user = await User.create({
//         firstName: 'Sample',
//         lastName: 'User',
//         email: 'sample.user@example.com',
//         password: 'hashedpassword', // Use a real hash in production
//         role: 'student',
//         phone: '08000000000',
//         studentId: 'UCS9999999',
//         department: 'Test Department',
//         level: '400',
//     });

//     // 2. Create a student profile
//     const normalizedPhone = Student.normalizePhone('08000000000');
//     const student = await Student.create({
//         userId: user._id,
//         studentId: 'UCS9999999',
//         phone: '08000000000',
//         normalizedPhone,
//         department: 'Test Department',
//         level: '400',
//         faculty: 'Test Faculty',
//         matricNumber: 'UCS9999999',
//         admissionYear: 2020,
//         academicSession: '2023/2024',
//         currentSemester: 'second',
//         cgpa: 4.0,
//         address: {
//             street: '456 Example Ave',
//             city: 'Testville',
//             state: 'Test State',
//             country: 'Testland',
//         },
//         emergencyContact: {
//             name: 'Test Contact',
//             phone: '08111111111',
//             relationship: 'Guardian',
//         },
//         isActive: true,
//         graduationStatus: 'active',
//     });

//     // 3. Create a clearance application
//     const clearance = await Clearance.create({
//         studentId: student._id,
//         userId: user._id,
//         applicationNumber: 'CLR9999999999',
//         academicSession: '2023/2024',
//         semester: 'second',
//         clearanceType: 'graduation',
//         overallStatus: 'in_progress',
//         departments: [
//             {
//                 departmentId: new mongoose.Types.ObjectId(),
//                 departmentName: 'Library',
//                 status: 'approved',
//                 approvedBy: user._id,
//                 approvedAt: new Date(),
//                 remarks: 'No issues',
//             },
//             {
//                 departmentId: new mongoose.Types.ObjectId(),
//                 departmentName: 'Bursary',
//                 status: 'approved',
//                 approvedBy: user._id,
//                 approvedAt: new Date(),
//                 remarks: 'Cleared all dues',
//             },
//             {
//                 departmentId: new mongoose.Types.ObjectId(),
//                 departmentName: 'Exams & Records',
//                 status: 'pending',
//                 remarks: 'Awaiting final results',
//             },
//             {
//                 departmentId: new mongoose.Types.ObjectId(),
//                 departmentName: 'Sports',
//                 status: 'pending',
//                 remarks: '',
//             },
//         ],
//         submittedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
//         createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
//         updatedAt: new Date(),
//     });

//     // 4. Create notifications
//     await Notification.create([
//         {
//             recipient: user._id,
//             type: 'clearance_submitted',
//             title: 'Clearance Application Submitted',
//             message: 'Your clearance application has been submitted.',
//             createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
//             read: true,
//         },
//         {
//             recipient: user._id,
//             type: 'clearance_approved',
//             title: 'Library Department Approved',
//             message: 'Library department has approved your clearance.',
//             createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
//             read: false,
//         },
//         {
//             recipient: user._id,
//             type: 'clearance_rejected',
//             title: 'Sports Department Rejected',
//             message: 'Please return your sports kit to the Sports department.',
//             createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
//             read: false,
//         },
//     ]);

//     console.log('Seed data inserted!');
//     await mongoose.disconnect();
// }

// seed().catch((err) => {
//     console.error(err);
//     process.exit(1);
// });

