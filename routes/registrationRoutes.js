import express from 'express';
import { registerForEvent, getMyRegistrations } from '../controllers/registrationController.js';
import { getAllRegistrations, getDashboardStats } from '../controllers/adminController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, registerForEvent);
router.get('/my', protect, getMyRegistrations);
router.get('/my-registrations', protect, getMyRegistrations);
router.get('/admin/list', protect, admin, getAllRegistrations);
router.get('/dashboard/stats', protect, admin, getDashboardStats);

export default router;
