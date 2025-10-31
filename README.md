# Woliso Rental System

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![Python](https://img.shields.io/badge/python-3.11-green.svg)
![React](https://img.shields.io/badge/react-19.0-blue.svg)
![FastAPI](https://img.shields.io/badge/fastapi-0.110-teal.svg)
![MongoDB](https://img.shields.io/badge/mongodb-latest-green.svg)

A modern, full-stack rental property management system for Woliso, Ethiopia. Built with FastAPI, React, MongoDB, and integrated with Chapa payment gateway.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [User Roles](#user-roles)
- [Payment Integration](#payment-integration)
- [Configuration](#configuration)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Overview

Woliso Rental System is a comprehensive property rental platform that connects landlords with tenants, featuring secure payment processing, advanced property management, and role-based dashboards.

### Key Highlights:
- 🏠 Property listing and search with advanced filters
- 💳 Secure payment processing via Chapa (Ethiopian payment gateway)
- 👥 Three role-based dashboards (Admin, Landlord, Tenant)
- 📊 Analytics and reporting for landlords
- ❤️ Save/favorite properties feature
- 📱 Fully responsive design
- 🔐 JWT-based authentication

## ✨ Features

### For Tenants
- Browse available properties with filters
- Save favorite properties
- Request property bookings
- Make secure deposit payments via Chapa
- Track booking status
- View payment history

### For Landlords
- Add and manage properties
- View property analytics (views, bookings, revenue)
- Approve/reject booking requests
- Track property performance
- Monitor monthly revenue
- Property management with data tables

### For Admins
- Approve/reject property listings
- Manage users (tenants, landlords)
- View system-wide statistics
- Monitor all bookings and payments
- Platform oversight and moderation

### General Features
- Modern, responsive UI with Shadcn/UI
- Real-time notifications with Sonner
- Secure JWT authentication
- Image upload and management
- Advanced search and filtering
- Mobile-optimized design

## 🛠️ Tech Stack

### Backend
- **Framework:** FastAPI (Python 3.11)
- **Database:** MongoDB (Motor async driver)
- **Authentication:** JWT (PyJWT)
- **Payment:** Chapa Payment Gateway
- **Validation:** Pydantic v2
- **Password Hashing:** Passlib with bcrypt
- **CORS:** Starlette CORS Middleware

### Frontend
- **Framework:** React 19
- **Routing:** React Router DOM v7
- **UI Components:** Shadcn/UI
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **HTTP Client:** Axios
- **Notifications:** Sonner
- **Forms:** React Hook Form + Zod

### DevOps
- **Process Manager:** Supervisord
- **Web Server:** Nginx
- **Build Tool:** Craco (Create React App Config Override)

## 🚀 Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+ and Yarn
- MongoDB 4.4+
- Chapa account (for payment processing)

### Installation

#### 1. Clone the Repository
```bash
git clone <repository-url>
cd woliso-rental-system
```

#### 2. Backend Setup
```bash
cd backend
pip install -r requirements.txt

# Create .env file
cp .env.example .env

# Edit .env with your configuration
nano .env
```

**Required Environment Variables:**
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=woliso_rental_system
CORS_ORIGINS=*
JWT_SECRET=your-secret-key-change-in-production
CHAPA_SECRET_KEY=your-chapa-secret-key
FRONTEND_URL=http://localhost:3000
```

#### 3. Frontend Setup
```bash
cd ../frontend
yarn install

# Create .env file
cp .env.example .env

# Edit .env
nano .env
```

**Required Environment Variables:**
```env
REACT_APP_BACKEND_URL=http://localhost:8001
WDS_SOCKET_PORT=3000
```

#### 4. Start Services

**Using Supervisord (Production):**
```bash
sudo supervisorctl restart all
sudo supervisorctl status
```

**Manual Development:**
```bash
# Terminal 1 - Backend
cd backend
uvicorn server:app --reload --host 0.0.0.0 --port 8001

# Terminal 2 - Frontend
cd frontend
yarn start

# Terminal 3 - MongoDB
mongod --dbpath /data/db
```

#### 5. Access the Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8001
- **API Docs:** http://localhost:8001/docs

### Default Admin Account

```
Email: admin@woliso.com
Password: Admin@123
```

> ⚠️ **Important:** Change the default admin password in production!

## 📁 Project Structure

```
woliso-rental-system/
├── backend/
│   ├── server.py              # Main FastAPI application
│   ├── chapa_service.py       # Chapa payment integration
│   ├── requirements.txt       # Python dependencies
│   ├── .env                   # Environment variables
│   └── uploads/               # Uploaded property images
│
├── frontend/
│   ├── public/                # Static files
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── ui/           # Shadcn UI components
│   │   │   ├── Sidebar.jsx   # Dashboard sidebar
│   │   │   ├── DashboardLayout.jsx
│   │   │   ├── HouseCard.jsx
│   │   │   └── Navbar.jsx
│   │   ├── pages/            # Page components
│   │   │   ├── HomePage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── TenantDashboard.jsx
│   │   │   ├── LandlordDashboard.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── HouseDetailsPage.jsx
│   │   │   └── PaymentCallback.jsx
│   │   ├── context/          # React context
│   │   │   └── AuthContext.js
│   │   ├── hooks/            # Custom hooks
│   │   ├── lib/              # Utilities
│   │   ├── App.js            # Main app component
│   │   └── index.js          # Entry point
│   ├── package.json          # Node dependencies
│   ├── tailwind.config.js    # Tailwind configuration
│   └── .env                  # Environment variables
│
├── tests/                    # Test files
├── scripts/                  # Utility scripts
├── CHAPA_PAYMENT_GUIDE.md   # Payment setup guide
├── FEATURES_DOCUMENTATION.md # Feature documentation
├── PRODUCTION_READINESS.md  # Production checklist
└── README.md                # This file
```

## 📚 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123",
  "full_name": "John Doe",
  "phone_number": "+251-900-000000",
  "role": "tenant" | "landlord" | "admin"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123"
}

Response:
{
  "access_token": "jwt-token",
  "token_type": "bearer",
  "user": { ... }
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

### Property Endpoints

#### List Houses
```http
GET /api/houses?status=available&location=Woliso&min_price=100&max_price=1000&num_rooms=2
```

#### Get House Details
```http
GET /api/houses/{house_id}
```

#### Create House (Landlord)
```http
POST /api/houses
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Modern 2BR Apartment",
  "description": "Beautiful apartment...",
  "location": "Downtown Woliso",
  "price_per_month": 800.00,
  "num_rooms": 2
}
```

#### Update House (Landlord)
```http
PUT /api/houses/{house_id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Updated Title",
  "price_per_month": 850.00
}
```

#### Upload House Photos
```http
POST /api/houses/{house_id}/photos
Authorization: Bearer <token>
Content-Type: application/json

["url1", "url2", "url3"]
```

### Booking Endpoints

#### Create Booking (Tenant)
```http
POST /api/bookings
Authorization: Bearer <token>
Content-Type: application/json

{
  "house_id": "house-uuid",
  "message": "I'm interested in this property"
}
```

#### Get My Bookings (Tenant)
```http
GET /api/bookings/my-requests
Authorization: Bearer <token>
```

#### Get Received Bookings (Landlord)
```http
GET /api/bookings/received
Authorization: Bearer <token>
```

#### Update Booking Status (Landlord)
```http
PUT /api/bookings/{booking_id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "approved" | "rejected"
}
```

### Payment Endpoints

#### Initialize Payment (Tenant)
```http
POST /api/payment/initialize
Authorization: Bearer <token>
Content-Type: application/json

{
  "booking_id": "booking-uuid",
  "amount": 500,
  "currency": "ETB"
}

Response:
{
  "checkout_url": "https://checkout.chapa.co/...",
  "tx_ref": "WRS-..."
}
```

#### Verify Payment
```http
GET /api/payment/verify/{tx_ref}
Authorization: Bearer <token>

Response:
{
  "status": "success" | "failed",
  "message": "Payment verified successfully",
  "data": { ... }
}
```

### Saved Houses Endpoints

#### Toggle Save House (Tenant)
```http
POST /api/tenant/save-house/{house_id}
Authorization: Bearer <token>

Response:
{
  "message": "House added to favorites",
  "saved": true
}
```

#### Get Saved Houses (Tenant)
```http
GET /api/tenant/saved-houses
Authorization: Bearer <token>
```

#### Check if Saved (Tenant)
```http
GET /api/tenant/is-saved/{house_id}
Authorization: Bearer <token>

Response:
{
  "saved": true
}
```

### Analytics Endpoints

#### Get Landlord Analytics
```http
GET /api/landlord/analytics
Authorization: Bearer <token>

Response:
{
  "total_properties": 10,
  "total_views": 150,
  "pending_bookings": 3,
  "approved_bookings": 7,
  "total_revenue": 5600.00
}
```

### Admin Endpoints

#### Get Admin Stats
```http
GET /api/admin/stats
Authorization: Bearer <token>
```

#### Get Pending Houses
```http
GET /api/admin/pending-houses
Authorization: Bearer <token>
```

#### Update House Status (Admin)
```http
PUT /api/admin/houses/{house_id}/status?status=available
Authorization: Bearer <token>
```

#### Get All Users (Admin)
```http
GET /api/admin/users
Authorization: Bearer <token>
```

### Full API Documentation

Visit the interactive API documentation:
- **Swagger UI:** http://localhost:8001/docs
- **ReDoc:** http://localhost:8001/redoc

## 👥 User Roles

### Tenant
- Browse and search properties
- Save favorite properties
- Request bookings
- Make payments
- View booking history

### Landlord
- Add and manage properties
- View analytics dashboard
- Approve/reject bookings
- Track revenue
- Monitor property performance

### Admin
- Approve property listings
- Manage all users
- View system statistics
- Monitor all transactions
- Platform moderation

## 💳 Payment Integration

This system integrates with **Chapa**, Ethiopia's leading payment gateway.

### Setup Chapa

1. **Create Account:** Sign up at [chapa.co](https://chapa.co)
2. **Get Credentials:** Obtain your Secret Key from dashboard
3. **Configure:** Add to `backend/.env`:
   ```env
   CHAPA_SECRET_KEY=CHASECK_TEST-your-key-here
   ```
4. **Test Mode:** Use test credentials for development
5. **Go Live:** Replace with live credentials for production

### Payment Flow

1. Tenant requests booking → Landlord approves
2. Tenant clicks "Proceed to Payment"
3. System initializes Chapa transaction
4. Tenant redirected to Chapa checkout
5. Payment processed securely by Chapa
6. User redirected back with status
7. System verifies payment with Chapa API
8. Booking marked as paid in database

**Default Deposit:** 500 ETB

See [CHAPA_PAYMENT_GUIDE.md](./CHAPA_PAYMENT_GUIDE.md) for detailed documentation.

## ⚙️ Configuration

### Environment Variables

#### Backend (.env)
```env
# Database
MONGO_URL=mongodb://localhost:27017
DB_NAME=woliso_rental_system

# Security
JWT_SECRET=your-very-secure-secret-key-change-me
CORS_ORIGINS=http://localhost:3000,https://yourdomain.com

# Payment
CHAPA_SECRET_KEY=CHASECK_TEST-xxxxx

# URLs
FRONTEND_URL=http://localhost:3000
```

#### Frontend (.env)
```env
# Backend API
REACT_APP_BACKEND_URL=http://localhost:8001

# Development
WDS_SOCKET_PORT=3000
REACT_APP_ENABLE_VISUAL_EDITS=false
ENABLE_HEALTH_CHECK=false
```

### Supervisord Configuration

Services managed by Supervisord:
- `backend` - FastAPI application (port 8001)
- `frontend` - React development server (port 3000)
- `mongodb` - MongoDB database (port 27017)
- `nginx-code-proxy` - Nginx reverse proxy

**Commands:**
```bash
sudo supervisorctl status          # Check status
sudo supervisorctl restart all     # Restart all services
sudo supervisorctl restart backend # Restart specific service
sudo supervisorctl tail backend stderr  # View logs
```

## 🔧 Development

### Running in Development Mode

#### Backend
```bash
cd backend
uvicorn server:app --reload --host 0.0.0.0 --port 8001
```

#### Frontend
```bash
cd frontend
yarn start
```

### Code Quality

#### Python (Backend)
```bash
# Linting
flake8 backend/

# Type checking
mypy backend/

# Formatting
black backend/
```

#### JavaScript (Frontend)
```bash
# Linting
yarn lint

# Formatting
yarn format
```

### Database Management

#### MongoDB Shell
```bash
mongo
use woliso_rental_system
db.houses.find()
db.users.find()
db.bookings.find()
```

#### Backup
```bash
mongodump --db woliso_rental_system --out /backup/
```

#### Restore
```bash
mongorestore --db woliso_rental_system /backup/woliso_rental_system/
```

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest
```

### Frontend Tests
```bash
cd frontend
yarn test
```

### Integration Tests
```bash
# Run full test suite
pytest tests/integration/
```

### Manual Testing Checklist

- [ ] User registration (all roles)
- [ ] User login/logout
- [ ] Property CRUD operations
- [ ] Property search and filtering
- [ ] Booking creation and approval
- [ ] Payment flow (test mode)
- [ ] Saved houses functionality
- [ ] Dashboard navigation
- [ ] Mobile responsiveness
- [ ] Admin approval workflow

## 🚀 Deployment

### Production Checklist

- [ ] Set strong JWT_SECRET
- [ ] Use production Chapa credentials
- [ ] Configure CORS for production domain
- [ ] Set up SSL/TLS (HTTPS)
- [ ] Configure MongoDB authentication
- [ ] Set up automated backups
- [ ] Configure monitoring and logging
- [ ] Set up error tracking (Sentry)
- [ ] Configure CDN for static assets
- [ ] Set rate limiting
- [ ] Review and harden security

See [PRODUCTION_READINESS.md](./PRODUCTION_READINESS.md) for complete guide.

### Docker Deployment (Optional)

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f
```

## 📊 Database Schema

### Collections

#### users
```javascript
{
  user_id: String (UUID),
  email: String,
  password_hash: String,
  full_name: String,
  phone_number: String,
  role: String ("tenant" | "landlord" | "admin"),
  created_at: String (ISO timestamp)
}
```

#### houses
```javascript
{
  house_id: String (UUID),
  landlord_id: String (UUID),
  title: String,
  description: String,
  location: String,
  price_per_month: Number,
  num_rooms: Number,
  status: String ("available" | "rented" | "pending_approval" | "hidden"),
  photos: Array[String],
  created_at: String (ISO timestamp)
}
```

#### bookings
```javascript
{
  booking_id: String (UUID),
  tenant_id: String (UUID),
  house_id: String (UUID),
  landlord_id: String (UUID),
  status: String ("pending" | "approved" | "rejected"),
  message: String,
  deposit_paid: Boolean,
  requested_at: String (ISO timestamp)
}
```

#### payments
```javascript
{
  payment_id: String (UUID),
  booking_id: String (UUID),
  tenant_id: String (UUID),
  house_id: String (UUID),
  tx_ref: String,
  amount: Number,
  currency: String,
  status: String ("pending" | "success" | "failed"),
  created_at: String (ISO timestamp),
  verified_at: String (ISO timestamp),
  chapa_response: Object
}
```

#### saved_houses
```javascript
{
  saved_id: String (UUID),
  tenant_id: String (UUID),
  house_id: String (UUID),
  saved_at: String (ISO timestamp)
}
```

#### feedbacks
```javascript
{
  feedback_id: String (UUID),
  tenant_id: String (UUID),
  house_id: String (UUID),
  rating: Number (1-5),
  comment: String,
  submitted_at: String (ISO timestamp)
}
```

## 🤝 Contributing

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Run tests: `pytest` and `yarn test`
5. Commit with descriptive message: `git commit -m "Add feature X"`
6. Push to branch: `git push origin feature/my-feature`
7. Create Pull Request

### Code Style

- **Python:** Follow PEP 8, use Black formatter
- **JavaScript:** Follow Airbnb style guide, use Prettier
- **Commits:** Use conventional commits (feat:, fix:, docs:, etc.)

### Pull Request Guidelines

- Include description of changes
- Add tests for new features
- Update documentation
- Ensure CI passes
- Request review from maintainers

## 📝 License

All rights reserved © 2025 Woliso Rental System

## 🙏 Acknowledgments

- **Chapa** for payment gateway services
- **Shadcn/UI** for beautiful UI components
- **FastAPI** for the excellent Python framework
- **React** for the powerful frontend library
- Community contributors and testers

## 📞 Support

### Getting Help

- **Documentation:** Check the docs in this repository
- **Issues:** Open an issue on GitHub
- **Email:** support@woliso-rentals.com

### Logs

```bash
# Backend logs
tail -f /var/log/supervisor/backend.err.log

# Frontend logs
tail -f /var/log/supervisor/frontend.err.log

# All logs
sudo supervisorctl tail -f backend stderr
```

## 📈 Roadmap

### Upcoming Features

- [ ] Email notifications (SendGrid/AWS SES)
- [ ] SMS notifications (Twilio/Africa's Talking)
- [ ] Advanced analytics with charts (Chart.js/Recharts)
- [ ] Property comparison feature
- [ ] Map integration (Google Maps/Mapbox)
- [ ] Multi-language support (Amharic, English)
- [ ] Enhanced reviews and ratings
- [ ] Tenant screening/verification
- [ ] Lease agreement management
- [ ] Maintenance request tracking
- [ ] Automated rent reminders
- [ ] Mobile apps (React Native)

### Version History

**v2.0.0** (Current)
- ✅ Chapa payment integration
- ✅ Modern homepage redesign
- ✅ Sidebar navigation for all dashboards
- ✅ Landlord analytics dashboard
- ✅ Saved houses feature
- ✅ Property management tables

**v1.0.0**
- ✅ Core rental system (Auth, CRUD, Booking)
- ✅ Three role-based dashboards
- ✅ Property search and filtering
- ✅ Basic booking workflow

---

**Built with ❤️ for Woliso, Ethiopia**

For more information, see:
- [Features Documentation](./FEATURES_DOCUMENTATION.md)
- [Chapa Payment Guide](./CHAPA_PAYMENT_GUIDE.md)
- [Production Readiness Guide](./PRODUCTION_READINESS.md)