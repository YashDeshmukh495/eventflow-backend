import express from 'express';
import { getAllRegistrations, getDashboardStats } from '../controllers/adminController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/students', protect, admin, getAllRegistrations);
router.get('/analytics', protect, admin, getDashboardStats);

export default router;
