import express from 'express';
import {
  workerLogin,
  getMyTickets,
  getTicketById,
  updateTicketStatus,
  addTicketUpdate,
  getWorkerStats,
  getMyProfile
} from '../controllers/workerController.js';
import { protectWorker } from '../middleware/auth.js';

const router = express.Router();

// Public route
router.post('/login', workerLogin);

// Protected routes (worker only)
router.use(protectWorker);

router.get('/profile', getMyProfile);
router.get('/stats', getWorkerStats);
router.get('/tickets', getMyTickets);
router.get('/tickets/:id', getTicketById);
router.put('/tickets/:id/status', updateTicketStatus);
router.post('/tickets/:id/updates', addTicketUpdate);

export default router;
