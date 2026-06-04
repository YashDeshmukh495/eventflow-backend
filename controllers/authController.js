import User from '../models/User.js';
import jwt from 'jsonwebtoken';

const APPROVED_DOMAINS = ['college.edu', 'university.edu', 'gmail.com']; // gmail.com for ease of local testing

// Generate JWT Helper
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/signup
// @access  Public
export const registerUser = async (req, res) => {
  const { name, email, password, branch, semester, role } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, Email and Password are required' });
  }

  // Validate college email domain
  const emailDomain = email.split('@')[1];
  const isApproved = APPROVED_DOMAINS.some(domain => emailDomain === domain || emailDomain.endsWith('.' + domain));
  if (!isApproved) {
    return res.status(400).json({ 
      message: `Only approved college email domains are allowed (${APPROVED_DOMAINS.join(', ')})` 
    });
  }

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User profile already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
      branch: branch || 'Computer Science',
      semester: semester || '1',
      role: role || 'student'
    });

    if (user) {
      const token = generateToken(user._id);
      res.status(201).json({
        _id: user._id.toString(),
        uid: user._id.toString(),
        name: user.name,
        email: user.email,
        branch: user.branch,
        semester: user.semester,
        role: user.role,
        token
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and Password are required' });
  }

  try {
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      const token = generateToken(user._id);
      res.json({
        _id: user._id.toString(),
        uid: user._id.toString(),
        name: user.name,
        email: user.email,
        branch: user.branch,
        semester: user.semester,
        role: user.role,
        token
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Trigger Forgot Password logic
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User with this email does not exist' });
    }

    // Since it's a simulated flow or local test, we print reset simulation
    console.log(`[JWT RESET SIMULATION] Reset token triggered for: ${email}`);
    res.json({ message: 'Simulated password reset email sent successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
export const getUserProfile = async (req, res) => {
  try {
    res.json(req.user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user profile (Student/Admin scope)
// @route   PUT /api/auth/profile
// @access  Private
export const updateUserProfile = async (req, res) => {
  const { semester, branch } = req.body;

  try {
    const user = await User.findById(req.user.uid);

    if (!user) {
      return res.status(404).json({ message: 'User profile not found' });
    }

    if (semester !== undefined) {
      user.semester = semester;
    }

    if (branch !== undefined) {
      if (req.user.role === 'admin') {
        user.branch = branch;
      } else {
        return res.status(403).json({ message: 'Branch can only be updated by an Admin' });
      }
    }

    await user.save();

    res.json({
      _id: user._id.toString(),
      uid: user._id.toString(),
      name: user.name,
      email: user.email,
      branch: user.branch,
      semester: user.semester,
      role: user.role
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
