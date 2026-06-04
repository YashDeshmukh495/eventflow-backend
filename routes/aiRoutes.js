import express from 'express';
import { generateEventPlan } from '../controllers/aiController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/generate-event', protect, admin, generateEventPlan);

export default router;
