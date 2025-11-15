import express from 'express';
import {
  adminRegister,
  adminLogin,
  getAllComplaints,
  createTicket,
  createWorker,
  getAllWorkers,
  updateWorker,
  deleteWorker,
  getDashboardStats,
  updateTicket,
  updateAdminProfile,
  updateAdminPassword,
  resetWorkerPassword
} from '../controllers/adminController.js';
import { protectAdmin } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/register', adminRegister);
router.post('/login', adminLogin);

// Protected routes (admin only)
router.use(protectAdmin);

router.get('/dashboard/stats', getDashboardStats);
router.get('/complaints', getAllComplaints);
router.post('/tickets', createTicket);
router.put('/tickets/:id', updateTicket);

// Worker management
router.post('/workers', createWorker);
router.get('/workers', getAllWorkers);
router.put('/workers/:id', updateWorker);
router.delete('/workers/:id', deleteWorker);
router.put('/workers/:workerId/reset-password', resetWorkerPassword);

// Admin profile management
router.put('/profile', updateAdminProfile);
router.put('/password', updateAdminPassword);

export default router;
