import express from 'express';
import { createQRSession, verifyAttendance, getAttendanceAnalytics } from '../controllers/attendanceController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/session', protect, admin, createQRSession);
router.post('/verify', protect, verifyAttendance);
router.get('/analytics/:eventId', protect, admin, getAttendanceAnalytics);
router.get('/event/:eventId', protect, admin, getAttendanceAnalytics);

export default router;
