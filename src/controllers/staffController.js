import { pool as prisma } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import { notifyAdminsNewComplaint } from '../utils/smsNotification.js';
import { sendNewComplaintEmail } from '../utils/emailNotification.js';

// Staff can submit complaints without login
export const submitComplaint = async (req, res, next) => {
  try {
    const { staffName, department, title, description, location } = req.body;

    // Handle uploaded images
    const images = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];

    // Create complaint using raw SQL
    const result = await prisma.query(`
      INSERT INTO complaints (id, "staffName", department, title, description, location, images, status, "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, 'PENDING', NOW(), NOW())
      RETURNING *
    `, [staffName, department, title, description || null, location || null, images]);

    const complaint = result.rows[0];

    // Send SMS notification to admins (non-blocking)
    notifyAdminsNewComplaint(complaint).catch(err => {
      console.error('Failed to send SMS notification:', err);
    });

    // Send email notification to admins (non-blocking)
    sendNewComplaintEmail(complaint).catch(err => {
      console.error('Failed to send email notification:', err);
    });

    res.status(201).json({
      status: 'success',
      message: 'Complaint submitted successfully.',
      data: { complaint }
    });
  } catch (error) {
    next(error);
  }
};

// Get all complaints (public - for staff to view their submissions)
export const getAllComplaints = async (req, res, next) => {
  try {
    // Get all complaints with tickets and workers using raw SQL
    const result = await prisma.query(`
      SELECT
        c.*,
        json_build_object(
          'id', t.id,
          'ticketNumber', t."ticketNumber",
          'status', t.status,
          'priority', t.priority,
          'notes', t.notes,
          'createdAt', t."createdAt",
          'updatedAt', t."updatedAt",
          'worker', json_build_object(
            'id', w.id,
            'firstName', w."firstName",
            'lastName', w."lastName",
            'department', w.department
          )
        ) as ticket
      FROM complaints c
      LEFT JOIN tickets t ON t."complaintId" = c.id
      LEFT JOIN workers w ON t."workerId" = w.id
      ORDER BY c."createdAt" DESC
    `);

    res.status(200).json({
      status: 'success',
      data: { complaints: result.rows }
    });
  } catch (error) {
    next(error);
  }
};

// Get single complaint by ID
export const getComplaintById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get complaint with ticket and worker using raw SQL
    const result = await prisma.query(`
      SELECT
        c.*,
        json_build_object(
          'id', t.id,
          'ticketNumber', t."ticketNumber",
          'status', t.status,
          'priority', t.priority,
          'notes', t.notes,
          'createdAt', t."createdAt",
          'updatedAt', t."updatedAt",
          'worker', json_build_object(
            'id', w.id,
            'firstName', w."firstName",
            'lastName', w."lastName",
            'department', w.department,
            'phoneNumber', w."phoneNumber"
          )
        ) as ticket
      FROM complaints c
      LEFT JOIN tickets t ON t."complaintId" = c.id
      LEFT JOIN workers w ON t."workerId" = w.id
      WHERE c.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return next(new AppError('Complaint not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: { complaint: result.rows[0] }
    });
  } catch (error) {
    next(error);
  }
};

// Get departments list
export const getDepartments = async (req, res, next) => {
  try {
    const departments = ['HR_MAIN', 'HR_MANAGER', 'WPO_MAIN', 'WPO_MANAGER', 'SHIPPING_MAIN', 'SHIPPING_MANAGER', 'CASH_OFFICE', 'ACCOUNTS', 'SALES', 'AUDIT', 'E_COLLECTION', 'TRANSPORT', 'TRADING_ROOM', 'MARKETING', 'RISK', 'LBC', 'PROCUREMENT'];

    res.status(200).json({
      status: 'success',
      data: { departments }
    });
  } catch (error) {
    next(error);
  }
};
