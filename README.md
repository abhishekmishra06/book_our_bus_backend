# Bus Booking Backend

A modern, scalable bus booking platform backend built with Node.js and Express.

## Features

- **Authentication**: OTP-based login with JWT tokens
- **Agent Management**: Complete agent profile with document verification
- **Bus Management**: CRUD operations for bus information
- **Booking System**: Bus booking functionality
- **Search & Filter**: Advanced bus search with filters
- **Unified API Response**: Consistent response format across all endpoints

## Project Structure

```
bus-booking-backend/
├── server.js              # Main entry point
├── .env                   # Environment variables
├── package.json           # Dependencies
└── src/
    ├── config/            # Configuration files
    ├── shared/            # Shared utilities
    │   ├── db.js          # Database connection
    │   ├── middleware/    # Express middleware
    │   └── utils/         # Utility functions
    └── modules/           # Feature modules
        ├── auth/          # Authentication module
        ├── bus/           # Bus management
        ├── booking/       # Booking system
        ├── search/        # Search functionality
        └── user/          # User management
```

## Prerequisites

- Node.js (v16 or higher)
- MongoDB
- Redis (optional, for caching)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd bus-booking-backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start the server:
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/send-otp` - Send OTP to phone number
- `POST /api/auth/verify-otp` - Verify OTP and login

### Agent Management
- `POST /api/auth/agent/complete-profile` - Complete agent profile
- `GET /api/auth/agent/profile` - Get agent profile
- `PUT /api/auth/agent/profile` - Update agent profile

### Bus Management
- `POST /api/buses` - Create a new bus
- `GET /api/buses` - Get all buses
- `GET /api/buses/:id` - Get bus by ID
- `PUT /api/buses/:id` - Update bus
- `DELETE /api/buses/:id` - Delete bus

### Booking System
- `POST /api/bookings` - Create a new booking
- `GET /api/bookings` - Get all bookings
- `GET /api/bookings/:id` - Get booking by ID
- `PUT /api/bookings/:id` - Update booking
- `DELETE /api/bookings/:id` - Cancel booking

### Search
- `GET /api/search/buses` - Search buses by route and date
- `GET /api/search/buses/:id` - Get bus details
- `GET /api/search/filter` - Apply filters to search results

### Notifications
- `POST /api/notifications` - Send a notification
- `GET /api/notifications` - Get user's notifications
- `PUT /api/notifications/:id/read` - Mark notification as read
- `PUT /api/notifications/mark-all-read` - Mark all notifications as read
- `GET /api/notifications/unread-count` - Get unread notification count
- `DELETE /api/notifications/:id` - Delete a notification

### Token Management
- `POST /api/token/refresh` - Refresh access token using refresh token
- `POST /api/token/revoke` - Revoke refresh token

### Session Management
- `GET /api/sessions/my-sessions` - Get all active sessions for the user
- `DELETE /api/sessions/revoke/:sessionId` - Revoke a specific session
- `DELETE /api/sessions/revoke-others` - Revoke all other sessions except current
- `DELETE /api/sessions/logout-all` - Logout from all devices/sessions

## Environment Variables

```env
NODE_ENV=development
PORT=5002
MONGODB_URI=mongodb://localhost:27017/bus_booking
JWT_SECRET=your_jwt_secret_key_here
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
```

## Testing

```bash
npm test
```

## Development

```bash
# Run with auto-reload
npm run dev

# Lint code
npm run lint

# Format code
npm run format
```

## License

MIT