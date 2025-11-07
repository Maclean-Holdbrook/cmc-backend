import express from 'express';
import {
  submitComplaint,
  getAllComplaints,
  getComplaintById,
  getDepartments
} from '../controllers/staffController.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

// Public routes (no authentication required)
router.post('/complaints', upload.array('images', 5), submitComplaint);
router.get('/complaints', getAllComplaints);
router.get('/complaints/:id', getComplaintById);
router.get('/departments', getDepartments);

export default router;
