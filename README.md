# FoodShare - Food Donation Platform

A full-stack web application that connects food donors with recipients to reduce food waste and fight hunger in communities.

## Features

- **User Authentication**: Secure registration and login system
- **Dual User Types**: Separate interfaces for donors and recipients
- **Food Donation Management**: Create, update, and manage food donations
- **Search & Filter**: Find donations by food type, location, or keywords
- **Real-time Updates**: Live donation status updates
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Dashboard**: Personal dashboard for managing donations and profile

## Technology Stack

### Frontend
- **HTML5**: Semantic markup and structure
- **CSS3**: Modern styling with CSS Grid, Flexbox, and animations
- **Vanilla JavaScript**: ES6+ features and modern DOM manipulation

### Backend
- **Node.js**: Server-side JavaScript runtime
- **Express.js**: Web application framework
- **MongoDB**: NoSQL database for data storage
- **Mongoose**: MongoDB object modeling

### Security
- **bcryptjs**: Password hashing
- **JSON Web Tokens (JWT)**: Authentication and authorization
- **CORS**: Cross-origin resource sharing

## Database Setup (MongoDB Compass)

### 1. Install MongoDB
Download and install MongoDB Community Edition from [mongodb.com](https://www.mongodb.com/try/download/community)

### 2. Install MongoDB Compass
Download MongoDB Compass from [mongodb.com/products/compass](https://www.mongodb.com/products/compass)

### 3. Connect to Database
1. Open MongoDB Compass
2. Use the connection string: `mongodb://localhost:27017`
3. Create a new database named: `food_donation_db`
4. The application will automatically create the necessary collections:
   - `users` - Store user accounts and profiles
   - `donations` - Store food donation listings

### 4. Database Schema

#### Users Collection
```javascript
{
  name: String,           // User's full name
  email: String,          // Unique email address
  password: String,       // Hashed password
  phone: String,          // Contact phone number
  address: String,        // User's address
  userType: String,       // 'donor' or 'recipient'
  createdAt: Date         // Account creation timestamp
}
```

#### Donations Collection
```javascript
{
  title: String,          // Donation title
  description: String,    // Detailed description
  foodType: String,       // Category (fruits, vegetables, etc.)
  quantity: String,       // Amount available
  expiryDate: Date,       // Expiration date
  location: String,       // Pickup location
  contactInfo: String,    // Contact details
  donorId: ObjectId,      // Reference to donor
  donorName: String,      // Donor's name
  status: String,         // 'available', 'claimed', 'completed'
  createdAt: Date         // Creation timestamp
}
```

## Installation and Setup

### 1. Clone or Download the Project
```bash
# If using git
git clone <repository-url>
cd food-donation-platform

# Or download and extract the ZIP file
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Database Connection
The application is configured to connect to MongoDB at `mongodb://localhost:27017/food_donation_db`

If you need to change the connection string, edit line 13 in `server.js`:
```javascript
const MONGODB_URI = 'mongodb://localhost:27017/food_donation_db';
```

### 4. Start the Application
```bash
npm start
```

The application will be available at: `http://localhost:3000`

## Usage Guide

### For Food Donors
1. **Register** as a "Donate Food" user
2. **Login** to access your dashboard
3. **Add Donations** with details like food type, quantity, expiry date
4. **Manage** your donations through the dashboard
5. **Update Status** when food is claimed or completed

### For Food Recipients
1. **Register** as a "Receive Food" user
2. **Browse** available donations on the homepage
3. **Search** and filter by food type or location
4. **Contact** donors directly to arrange pickup
5. **Track** your activities through the dashboard

### Key Features
- **Real-time Search**: Instantly filter donations by keywords
- **Food Categories**: Organized by fruits, vegetables, grains, dairy, protein, prepared meals
- **Expiry Alerts**: Visual indicators for food expiring soon
- **Contact System**: Direct communication between donors and recipients
- **Status Management**: Track donation lifecycle from available to completed

## Project Structure

```
food-donation-platform/
├── server.js              # Main server file
├── package.json           # Dependencies and scripts
├── public/                # Frontend files
│   ├── index.html         # Main HTML page
│   ├── styles.css         # CSS styles
│   └── script.js          # JavaScript functionality
└── README.md              # Documentation
```

## API Endpoints

### Authentication
- `POST /api/register` - Register new user
- `POST /api/login` - User login

### Donations
- `GET /api/donations` - Get all available donations
- `POST /api/donations` - Create new donation (authenticated)
- `GET /api/my-donations` - Get user's donations (authenticated)
- `PATCH /api/donations/:id` - Update donation status (authenticated)
- `DELETE /api/donations/:id` - Delete donation (authenticated)

## Security Features

- **Password Hashing**: All passwords are hashed using bcryptjs
- **JWT Authentication**: Secure token-based authentication
- **Input Validation**: Server-side validation for all inputs
- **CORS Protection**: Configured for secure cross-origin requests
- **Authorization**: Role-based access control for different user types

## Responsive Design

The application is fully responsive with breakpoints at:
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the package.json file for details.

## Support

For issues or questions:
1. Check the console for error messages
2. Verify MongoDB is running
3. Ensure all dependencies are installed
4. Check network connectivity

## Future Enhancements

- Image upload for food donations
- Email notifications
- Mobile app version
- Advanced analytics dashboard
- Location-based search with maps
- Rating and review system
- Automated expiry notifications