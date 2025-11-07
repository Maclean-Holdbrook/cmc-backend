import { verifyToken } from '../utils/jwt.js';
import { pool as prisma } from '../config/database.js';
import { AppError } from './errorHandler.js';

// Admin authentication middleware
export const protectAdmin = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('Not authorized to access this route', 401));
    }

    // Verify token
    const decoded = verifyToken(token);

    if (!decoded) {
      return next(new AppError('Invalid or expired token', 401));
    }

    // Get admin from token using raw SQL
    const result = await prisma.query(
      'SELECT id, "firstName", "lastName", email, "isActive" FROM admins WHERE id = $1',
      [decoded.id]
    );
    const admin = result.rows[0];

    if (!admin) {
      return next(new AppError('Admin not found', 404));
    }

    if (!admin.isActive) {
      return next(new AppError('Admin account is inactive', 401));
    }

    req.admin = admin;
    next();
  } catch (error) {
    return next(new AppError('Not authorized to access this route', 401));
  }
};

// Worker authentication middleware
export const protectWorker = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('Not authorized to access this route', 401));
    }

    // Verify token
    const decoded = verifyToken(token);

    if (!decoded) {
      return next(new AppError('Invalid or expired token', 401));
    }

    // Get worker from token using raw SQL
    const result = await prisma.query(
      'SELECT id, "firstName", "lastName", email, department, "isActive" FROM workers WHERE id = $1',
      [decoded.id]
    );
    const worker = result.rows[0];

    if (!worker) {
      return next(new AppError('Worker not found', 404));
    }

    if (!worker.isActive) {
      return next(new AppError('Worker account is inactive', 401));
    }

    req.worker = worker;
    next();
  } catch (error) {
    return next(new AppError('Not authorized to access this route', 401));
  }
};
