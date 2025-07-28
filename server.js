require('dotenv').config(); 

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;


app.use(cors());
app.use(express.json());
app.use(express.static('public'));


const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ Connected to MongoDB Atlas'))
.catch(err => console.error('❌ MongoDB connection error:', err));


const isMongoConnected = () => {
  return mongoose.connection.readyState === 1;
};


const JWT_SECRET = process.env.JWT_SECRET;


const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  userType: { type: String, enum: ['donor', 'recipient'], required: true },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);


const donationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  foodType: { type: String, required: true },
  quantity: { type: String, required: true },
  expiryDate: { type: Date, required: true },
  location: { type: String, required: true },
  contactInfo: { type: String, required: true },
  donorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  donorName: { type: String, required: true },
  status: { type: String, enum: ['available', 'claimed', 'completed'], default: 'available' },
  createdAt: { type: Date, default: Date.now }
});

const Donation = mongoose.model('Donation', donationSchema);


const requestSchema = new mongoose.Schema({
  donationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Donation', required: true },
  donationTitle: { type: String, required: true },
  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipientName: { type: String, required: true },
  recipientEmail: { type: String, required: true },
  recipientPhone: { type: String, required: true },
  reason: { type: String, required: true },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  donorResponse: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const Request = mongoose.model('Request', requestSchema);


const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};


app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password, phone, address, userType } = req.body;

    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    
    const user = new User({
      name,
      email,
      password: hashedPassword,
      phone,
      address,
      userType
    });

    await user.save();

    
    const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        userType: user.userType
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    
    const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        userType: user.userType
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


app.post('/api/donations', authenticateToken, async (req, res) => {
  try {
    const { title, description, foodType, quantity, expiryDate, location, contactInfo } = req.body;
    
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const donation = new Donation({
      title,
      description,
      foodType,
      quantity,
      expiryDate: new Date(expiryDate),
      location,
      contactInfo,
      donorId: user._id,
      donorName: user.name
    });

    await donation.save();
    res.status(201).json({ message: 'Donation created successfully', donation });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


app.get('/api/donations', async (req, res) => {
  try {
    
    if (!isMongoConnected()) {
      return res.json([]);
    }
    
    const donations = await Donation.find({ status: 'available' })
      .sort({ createdAt: -1 })
      .populate('donorId', 'name email');
    res.json(donations);
  } catch (error) {
    console.error('Error loading donations:', error);
    res.json([]);
  }
});


app.get('/api/my-donations', authenticateToken, async (req, res) => {
  try {
    const donations = await Donation.find({ donorId: req.user.userId })
      .sort({ createdAt: -1 });
    res.json(donations);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


app.patch('/api/donations/:id', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    const donation = await Donation.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    
    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }
    
    res.json({ message: 'Donation updated successfully', donation });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


app.delete('/api/donations/:id', authenticateToken, async (req, res) => {
  try {
    const donation = await Donation.findOneAndDelete({
      _id: req.params.id,
      donorId: req.user.userId
    });
    
    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }
    
    res.json({ message: 'Donation deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


app.post('/api/requests', authenticateToken, async (req, res) => {
  try {
    const { donationId, reason } = req.body;
    
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.userType !== 'recipient') {
      return res.status(403).json({ message: 'Only recipients can request food' });
    }

    const donation = await Donation.findById(donationId);
    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }

    if (donation.status !== 'available') {
      return res.status(400).json({ message: 'This donation is no longer available' });
    }


    const request = new Request({
      donationId: donation._id,
      donationTitle: donation.title,
      recipientId: user._id,
      recipientName: user.name,
      recipientEmail: user.email,
      recipientPhone: user.phone,
      reason
    });

    await request.save();
    res.status(201).json({ message: 'Food request sent successfully', request });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


app.get('/api/my-requests', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let requests;
    if (user.userType === 'donor') {
      
      const donations = await Donation.find({ donorId: user._id });
      const donationIds = donations.map(d => d._id);
      requests = await Request.find({ donationId: { $in: donationIds } })
        .sort({ createdAt: -1 });
    } else {
      
      requests = await Request.find({ recipientId: user._id })
        .sort({ createdAt: -1 });
    }

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


app.patch('/api/requests/:id', authenticateToken, async (req, res) => {
  try {
    const { status, donorResponse } = req.body;
    
    const request = await Request.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    
    const donation = await Donation.findById(request.donationId);
    if (!donation || donation.donorId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to update this request' });
    }

    request.status = status;
    if (donorResponse) {
      request.donorResponse = donorResponse;
    }

    await request.save();

    
    if (status === 'accepted') {
      donation.status = 'claimed';
      await donation.save();
    }

    res.json({ message: 'Request updated successfully', request });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
