import { pool as prisma } from '../config/database.js';
import { hashPassword, comparePassword } from '../utils/hashPassword.js';
import { generateToken } from '../utils/jwt.js';
import { AppError } from '../middleware/errorHandler.js';
import { sendTicketAssignmentEmail } from '../utils/emailNotification.js';

// Admin Registration
export const adminRegister = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, phoneNumber } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return next(new AppError('Please provide all required fields', 400));
    }

    // Check if email already exists using raw SQL
    const existingAdminResult = await prisma.query(
      'SELECT id FROM admins WHERE email = $1',
      [email]
    );

    if (existingAdminResult.rows.length > 0) {
      return next(new AppError('Admin with this email already exists', 400));
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create admin using raw SQL
    const result = await prisma.query(`
      INSERT INTO admins (id, email, password, "firstName", "lastName", "phoneNumber", "isActive", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, true, NOW(), NOW())
      RETURNING id, email, "firstName", "lastName", "phoneNumber", "isActive", "createdAt", "updatedAt"
    `, [email, hashedPassword, firstName, lastName, phoneNumber || null]);

    const admin = result.rows[0];
    const token = generateToken(admin.id);

    res.status(201).json({
      status: 'success',
      message: 'Admin account created successfully',
      data: {
        admin,
        token,
        role: 'ADMIN'
      }
    });
  } catch (error) {
    next(error);
  }
};

// Admin Login
export const adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new AppError('Please provide email and password', 400));
    }

    // Query admin by email using raw SQL
    const result = await prisma.query('SELECT * FROM admins WHERE email = $1', [email]);
    const admin = result.rows[0];

    if (!admin) {
      return next(new AppError('Invalid email or password', 401));
    }

    if (!admin.isActive) {
      return next(new AppError('Your account has been deactivated', 401));
    }

    const isPasswordValid = await comparePassword(password, admin.password);

    if (!isPasswordValid) {
      return next(new AppError('Invalid email or password', 401));
    }

    // Update last login using raw SQL
    await prisma.query(
      'UPDATE admins SET "lastLogin" = NOW(), "updatedAt" = NOW() WHERE id = $1',
      [admin.id]
    );

    const token = generateToken(admin.id);
    const { password: _, ...adminWithoutPassword } = admin;

    res.status(200).json({
      status: 'success',
      data: {
        admin: adminWithoutPassword,
        token,
        role: 'ADMIN'
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get all complaints (Admin view)
export const getAllComplaints = async (req, res, next) => {
  try {
    const { status, department, page = 1, limit = 20 } = req.query;

    const skip = (page - 1) * limit;
    const conditions = [];
    const params = [];

    if (status) {
      conditions.push(`c.status = $${params.length + 1}`);
      params.push(status);
    }
    if (department) {
      conditions.push(`c.department = $${params.length + 1}`);
      params.push(department);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get complaints with pagination
    const complaintsResult = await prisma.query(`
      SELECT
        c.*,
        json_build_object(
          'id', t.id,
          'ticketNumber', t."ticketNumber",
          'status', t.status,
          'priority', t.priority,
          'createdAt', t."createdAt",
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
      ${whereClause}
      ORDER BY c."createdAt" DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `, [...params, parseInt(limit), parseInt(skip)]);

    // Get total count
    const countResult = await prisma.query(`
      SELECT COUNT(*) as count FROM complaints c ${whereClause}
    `, params);

    const total = parseInt(countResult.rows[0].count);

    res.status(200).json({
      status: 'success',
      data: {
        complaints: complaintsResult.rows,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Create ticket and assign to worker
export const createTicket = async (req, res, next) => {
  try {
    const { complaintId, workerId, priority, notes } = req.body;

    // Check if complaint exists and if it already has a ticket
    const complaintResult = await prisma.query(
      'SELECT c.*, t.id as ticket_id FROM complaints c LEFT JOIN tickets t ON t."complaintId" = c.id WHERE c.id = $1',
      [complaintId]
    );

    if (complaintResult.rows.length === 0) {
      return next(new AppError('Complaint not found', 404));
    }

    const complaint = complaintResult.rows[0];

    if (complaint.ticket_id) {
      return next(new AppError('Ticket already exists for this complaint', 400));
    }

    // Check if worker exists (if workerId provided)
    if (workerId) {
      const workerResult = await prisma.query(
        'SELECT id FROM workers WHERE id = $1',
        [workerId]
      );

      if (workerResult.rows.length === 0) {
        return next(new AppError('Worker not found', 404));
      }
    }

    // Generate ticket number
    const countResult = await prisma.query('SELECT COUNT(*) as count FROM tickets');
    const ticketCount = parseInt(countResult.rows[0].count);
    const ticketNumber = `TKT-${String(ticketCount + 1).padStart(6, '0')}`;

    const ticketStatus = workerId ? 'ASSIGNED' : 'PENDING';

    // Create ticket
    const ticketResult = await prisma.query(`
      INSERT INTO tickets (id, "ticketNumber", "complaintId", "adminId", "workerId", priority, notes, status, "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING *
    `, [ticketNumber, complaintId, req.admin.id, workerId || null, priority || 'MEDIUM', notes || null, ticketStatus]);

    const ticket = ticketResult.rows[0];

    // Update complaint status
    await prisma.query(
      'UPDATE complaints SET status = $1, "updatedAt" = NOW() WHERE id = $2',
      [ticketStatus, complaintId]
    );

    // Get worker details if assigned
    let worker = null;
    if (workerId) {
      const workerResult = await prisma.query(
        'SELECT id, "firstName", "lastName", email, department FROM workers WHERE id = $1',
        [workerId]
      );
      worker = workerResult.rows[0];

      // Send email notification to worker (non-blocking)
      if (worker) {
        sendTicketAssignmentEmail(ticket, worker, complaint).catch(err => {
          console.error('Failed to send email notification:', err);
        });
      }
    }

    res.status(201).json({
      status: 'success',
      message: 'Ticket created successfully',
      data: {
        ticket: {
          ...ticket,
          complaint,
          worker
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Create worker account
export const createWorker = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, phoneNumber } = req.body;

    // Check if worker already exists
    const existingWorkerResult = await prisma.query(
      'SELECT id FROM workers WHERE email = $1',
      [email]
    );

    if (existingWorkerResult.rows.length > 0) {
      return next(new AppError('Worker with this email already exists', 400));
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create worker (removed department and specialization fields)
    const workerResult = await prisma.query(`
      INSERT INTO workers (id, email, password, "firstName", "lastName", "phoneNumber", "isActive", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, true, NOW(), NOW())
      RETURNING id, email, "firstName", "lastName", "phoneNumber", "isActive", "createdAt"
    `, [email, hashedPassword, firstName, lastName, phoneNumber || null]);

    const worker = workerResult.rows[0];

    res.status(201).json({
      status: 'success',
      message: 'Worker account created successfully',
      data: { worker }
    });
  } catch (error) {
    next(error);
  }
};

// Get all workers
export const getAllWorkers = async (req, res, next) => {
  try {
    const { isActive } = req.query;

    const conditions = [];
    const params = [];

    if (isActive !== undefined) {
      conditions.push(`w."isActive" = $${params.length + 1}`);
      params.push(isActive === 'true');
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const workersResult = await prisma.query(`
      SELECT
        w.id,
        w.email,
        w."firstName",
        w."lastName",
        w."phoneNumber",
        w."isActive",
        w."lastLogin",
        w."createdAt",
        COUNT(t.id) as ticket_count
      FROM workers w
      LEFT JOIN tickets t ON t."workerId" = w.id
      ${whereClause}
      GROUP BY w.id, w.email, w."firstName", w."lastName", w."phoneNumber", w."isActive", w."lastLogin", w."createdAt"
      ORDER BY w."createdAt" DESC
    `, params);

    res.status(200).json({
      status: 'success',
      data: { workers: workersResult.rows }
    });
  } catch (error) {
    next(error);
  }
};

// Update worker
export const updateWorker = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, phoneNumber, isActive } = req.body;

    // Check if worker exists
    const workerResult = await prisma.query(
      'SELECT id FROM workers WHERE id = $1',
      [id]
    );

    if (workerResult.rows.length === 0) {
      return next(new AppError('Worker not found', 404));
    }

    // Build update fields dynamically
    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (firstName) {
      updates.push(`"firstName" = $${paramIndex++}`);
      params.push(firstName);
    }
    if (lastName) {
      updates.push(`"lastName" = $${paramIndex++}`);
      params.push(lastName);
    }
    if (phoneNumber !== undefined) {
      updates.push(`"phoneNumber" = $${paramIndex++}`);
      params.push(phoneNumber);
    }
    if (isActive !== undefined) {
      updates.push(`"isActive" = $${paramIndex++}`);
      params.push(isActive);
    }

    updates.push(`"updatedAt" = NOW()`);
    params.push(id);

    const updatedWorkerResult = await prisma.query(`
      UPDATE workers
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, email, "firstName", "lastName", "phoneNumber", "isActive", "updatedAt"
    `, params);

    res.status(200).json({
      status: 'success',
      data: { worker: updatedWorkerResult.rows[0] }
    });
  } catch (error) {
    next(error);
  }
};

// Delete worker
export const deleteWorker = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if worker exists
    const workerResult = await prisma.query(
      'SELECT id FROM workers WHERE id = $1',
      [id]
    );

    if (workerResult.rows.length === 0) {
      return next(new AppError('Worker not found', 404));
    }

    await prisma.query('DELETE FROM workers WHERE id = $1', [id]);

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    next(error);
  }
};

// Get dashboard statistics
export const getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalComplaintsResult,
      pendingComplaintsResult,
      inProgressComplaintsResult,
      resolvedComplaintsResult,
      totalWorkersResult,
      activeWorkersResult,
      complaintsByDepartmentResult
    ] = await Promise.all([
      prisma.query('SELECT COUNT(*) as count FROM complaints'),
      prisma.query("SELECT COUNT(*) as count FROM complaints WHERE status = 'PENDING'"),
      prisma.query("SELECT COUNT(*) as count FROM complaints WHERE status = 'IN_PROGRESS'"),
      prisma.query("SELECT COUNT(*) as count FROM complaints WHERE status = 'RESOLVED'"),
      prisma.query('SELECT COUNT(*) as count FROM workers'),
      prisma.query('SELECT COUNT(*) as count FROM workers WHERE "isActive" = true'),
      prisma.query('SELECT department, COUNT(*) as count FROM complaints GROUP BY department')
    ]);

    const complaintsByDepartment = complaintsByDepartmentResult.rows.map(row => ({
      department: row.department,
      _count: parseInt(row.count)
    }));

    res.status(200).json({
      status: 'success',
      data: {
        stats: {
          complaints: {
            total: parseInt(totalComplaintsResult.rows[0].count),
            pending: parseInt(pendingComplaintsResult.rows[0].count),
            inProgress: parseInt(inProgressComplaintsResult.rows[0].count),
            resolved: parseInt(resolvedComplaintsResult.rows[0].count)
          },
          workers: {
            total: parseInt(totalWorkersResult.rows[0].count),
            active: parseInt(activeWorkersResult.rows[0].count)
          }
        },
        complaintsByDepartment
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update ticket assignment
export const updateTicket = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { workerId, priority, notes, status } = req.body;

    // Check if ticket exists
    const ticketResult = await prisma.query(
      'SELECT * FROM tickets WHERE id = $1',
      [id]
    );

    if (ticketResult.rows.length === 0) {
      return next(new AppError('Ticket not found', 404));
    }

    const ticket = ticketResult.rows[0];

    // Build update fields dynamically
    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (workerId !== undefined) {
      updates.push(`"workerId" = $${paramIndex++}`);
      params.push(workerId);
    }
    if (priority) {
      updates.push(`priority = $${paramIndex++}`);
      params.push(priority);
    }
    if (notes !== undefined) {
      updates.push(`notes = $${paramIndex++}`);
      params.push(notes);
    }
    if (status) {
      updates.push(`status = $${paramIndex++}`);
      params.push(status);
    }

    updates.push(`"updatedAt" = NOW()`);
    params.push(id);

    await prisma.query(`
      UPDATE tickets
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
    `, params);

    // Update complaint status if ticket status changed
    if (status) {
      await prisma.query(
        'UPDATE complaints SET status = $1, "updatedAt" = NOW() WHERE id = $2',
        [status, ticket.complaintId]
      );
    }

    // Get updated ticket with complaint and worker
    const updatedTicketResult = await prisma.query(`
      SELECT
        t.*,
        json_build_object(
          'id', c.id,
          'staffName', c."staffName",
          'department', c.department,
          'title', c.title,
          'description', c.description,
          'location', c.location,
          'images', c.images,
          'status', c.status
        ) as complaint,
        json_build_object(
          'id', w.id,
          'firstName', w."firstName",
          'lastName', w."lastName",
          'email', w.email
        ) as worker
      FROM tickets t
      LEFT JOIN complaints c ON c.id = t."complaintId"
      LEFT JOIN workers w ON w.id = t."workerId"
      WHERE t.id = $1
    `, [id]);

    res.status(200).json({
      status: 'success',
      data: { ticket: updatedTicketResult.rows[0] }
    });
  } catch (error) {
    next(error);
  }
};


// Update Admin Profile
export const updateAdminProfile = async (req, res, next) => {
  try {
    const adminId = req.admin.id;
    const { firstName, lastName, email } = req.body;

    // Check if email is already taken by another admin
    if (email) {
      const existingAdminResult = await prisma.query(
        'SELECT id FROM admins WHERE email = $1',
        [email]
      );

      const existingAdmin = existingAdminResult.rows[0];

      if (existingAdmin && existingAdmin.id !== adminId) {
        return next(new AppError('Email is already in use', 400));
      }
    }

    // Build update fields dynamically
    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (firstName) {
      updates.push(`"firstName" = $${paramIndex++}`);
      params.push(firstName);
    }
    if (lastName) {
      updates.push(`"lastName" = $${paramIndex++}`);
      params.push(lastName);
    }
    if (email) {
      updates.push(`email = $${paramIndex++}`);
      params.push(email);
    }

    updates.push(`"updatedAt" = NOW()`);
    params.push(adminId);

    const updatedAdminResult = await prisma.query(`
      UPDATE admins
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, email, "firstName", "lastName", "phoneNumber", "isActive", "createdAt", "updatedAt"
    `, params);

    res.status(200).json({
      status: 'success',
      data: { admin: updatedAdminResult.rows[0] }
    });
  } catch (error) {
    next(error);
  }
};

// Update Admin Password
export const updateAdminPassword = async (req, res, next) => {
  try {
    const adminId = req.admin.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return next(new AppError('Please provide current and new password', 400));
    }

    const adminResult = await prisma.query(
      'SELECT * FROM admins WHERE id = $1',
      [adminId]
    );

    if (adminResult.rows.length === 0) {
      return next(new AppError('Admin not found', 404));
    }

    const admin = adminResult.rows[0];

    const isPasswordValid = await comparePassword(currentPassword, admin.password);

    if (!isPasswordValid) {
      return next(new AppError('Current password is incorrect', 401));
    }

    if (newPassword.length < 6) {
      return next(new AppError('Password must be at least 6 characters', 400));
    }

    const hashedNewPassword = await hashPassword(newPassword);

    await prisma.query(
      'UPDATE admins SET password = $1, "updatedAt" = NOW() WHERE id = $2',
      [hashedNewPassword, adminId]
    );

    res.status(200).json({
      status: 'success',
      message: 'Password updated successfully'
    });
  } catch (error) {
    next(error);
  }
};
