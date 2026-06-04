import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];

      // Verify the JWT ID Token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Fetch user profile from MongoDB 'users' collection
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return res.status(401).json({ message: 'Not authorized, user profile not found' });
      }

      req.user = {
        _id: user._id.toString(),
        uid: user._id.toString(),
        name: user.name,
        email: user.email,
        branch: user.branch,
        semester: user.semester,
        role: user.role
      };
      
      next();
    } catch (error) {
      console.error('Auth verification error:', error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

export const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as an admin' });
  }
};
export default protect;
