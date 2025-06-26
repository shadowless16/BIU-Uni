# Benson-Idahosa-Online-Clearance-System-Student-Project-
An Online Clearance System for Benson Idahosa University (BIU) final-year students. Built with Express.js and MongoDB, the system streamlines departmental and unit clearance via a mobile-friendly, secure web platform. Includes full user authentication, document management, notification handling, and administrative oversight.


## ✨ Features

- **Responsive Design**: Optimized for mobile and desktop.
- **Authentication (JWT-based)**:
  - User Registration & Login
  - Token Refresh
  - Logout
  - Password Reset & Change
  - Email Verification
- **Role-Based Access Control**:
  - Admin, Department Heads, Students
- **Clearance System**:
  - Department & Unit Approvals
  - Student Progress Tracking
- **Document Management**:
  - Secure Uploads & File Handling
- **Notifications**:
  - Real-time Alerts for Users
- **Middleware for Security & Performance**:
  - Rate Limiting
  - Logging
  - File Uploads
  - Validation
  - Role Authorization
  - Error Handling

---

## 🏗️ Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB (via Mongoose)
- **Frontend**: Next.js, Tailwind CSS
- **Authentication**: JSON Web Tokens (JWT)
- **Other Tools**: 
  - Nodemailer (for email services)
  - Multer (for file uploads)
  - Helmet, Morgan, and Express-Rate-Limit for security

---

## 📁 Project Structure

├── app/ # Frontend pages and components
├── models/ # Mongoose models: User, Student, Department, etc.
├── middleware/ # Auth, error handling, rate limiter, etc.
├── routes/ # Express routes (auth, clearance, etc.)
├── controllers/ # Route controllers
├── config/ # DB and server config
├── server.js # App entry point

yaml
Copy
Edit

---

## ⚙️ Getting Started

### Prerequisites

- Node.js v18+
- MongoDB (Local or Atlas)
- npm v9+

### Installation

```bash
# Clone the repo
git clone https://github.com/your-username/biu-clearance-system.git
cd biu-clearance-system

# Install dependencies
npm install

# Run seed script if needed
node seed.js

# Start the server
npm start
🔐 Environment Variables
Create a .env file in the root directory and include:

env
Copy
Edit
PORT=5000
MONGO_URI=mongodb://localhost:27017/clearance-system
JWT_SECRET=your_jwt_secret
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_password
🧪 API Documentation
Interactive API docs available via Swagger UI or Postman collection.

📌 License
This project is licensed under the MIT License. See the LICENSE file for more info.

🤝 Contributing
Fork the repo

Create your feature branch (git checkout -b feature/xyz)

Commit your changes (git commit -m 'Add xyz')

Push to the branch (git push origin feature/xyz)

Open a Pull Request



