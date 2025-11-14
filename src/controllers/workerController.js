import { pool as prisma } from '../config/database.js';
import { hashPassword, comparePassword } from '../utils/hashPassword.js';
import { generateToken } from '../utils/jwt.js';
import { AppError } from '../middleware/errorHandler.js';

// Worker Login
export const workerLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new AppError('Please provide email and password', 400));
    }

    const workerResult = await prisma.query(
      'SELECT * FROM workers WHERE email = $1',
      [email]
    );

    if (workerResult.rows.length === 0) {
      return next(new AppError('Invalid email or password', 401));
    }

    const worker = workerResult.rows[0];

    if (!worker.isActive) {
      return next(new AppError('Your account has been deactivated', 401));
    }

    const isPasswordValid = await comparePassword(password, worker.password);

    if (!isPasswordValid) {
      return next(new AppError('Invalid email or password', 401));
    }

    await prisma.query(
      'UPDATE workers SET "lastLogin" = NOW(), "updatedAt" = NOW() WHERE id = $1',
      [worker.id]
    );

    const token = generateToken(worker.id);
    const { password: _, ...workerWithoutPassword } = worker;

    res.status(200).json({
      status: 'success',
      data: {
        worker: workerWithoutPassword,
        token,
        role: 'WORKER'
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get worker's assigned tickets
export const getMyTickets = async (req, res, next) => {
  try {
    const { status } = req.query;

    const conditions = [`t."workerId" = $1`];
    const params = [req.worker.id];

    if (status) {
      conditions.push(`t.status = $2`);
      params.push(status);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const ticketsResult = await prisma.query(`
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
          'status', c.status,
          'createdAt', c."createdAt"
        ) as complaint
      FROM tickets t
      LEFT JOIN complaints c ON c.id = t."complaintId"
      ${whereClause}
      ORDER BY t."createdAt" DESC
    `, params);

    res.status(200).json({
      status: 'success',
      data: { tickets: ticketsResult.rows }
    });
  } catch (error) {
    next(error);
  }
};

// Get single ticket by ID
export const getTicketById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const ticketResult = await prisma.query(`
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
          'status', c.status,
          'createdAt', c."createdAt"
        ) as complaint,
        json_build_object(
          'firstName', a."firstName",
          'lastName', a."lastName",
          'email', a.email
        ) as admin,
        json_agg(
          json_build_object(
            'id', tu.id,
            'message', tu.message,
            'status', tu.status,
            'createdAt', tu."createdAt"
          ) ORDER BY tu."createdAt" DESC
        ) FILTER (WHERE tu.id IS NOT NULL) as updates
      FROM tickets t
      LEFT JOIN complaints c ON c.id = t."complaintId"
      LEFT JOIN admins a ON a.id = t."adminId"
      LEFT JOIN "ticket_updates" tu ON tu."ticketId" = t.id
      WHERE t.id = $1
      GROUP BY t.id, c.id, a.id
    `, [id]);

    if (ticketResult.rows.length === 0) {
      return next(new AppError('Ticket not found', 404));
    }

    const ticket = ticketResult.rows[0];

    // Check if ticket is assigned to this worker
    if (ticket.workerId !== req.worker.id) {
      return next(new AppError('You are not authorized to view this ticket', 403));
    }

    res.status(200).json({
      status: 'success',
      data: { ticket }
    });
  } catch (error) {
    next(error);
  }
};

// Update ticket status
export const updateTicketStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, message } = req.body;

    if (!status) {
      return next(new AppError('Status is required', 400));
    }

    if (!message || message.trim() === '') {
      return next(new AppError('Update message is required', 400));
    }

    const ticketResult = await prisma.query(
      'SELECT * FROM tickets WHERE id = $1',
      [id]
    );

    if (ticketResult.rows.length === 0) {
      return next(new AppError('Ticket not found', 404));
    }

    const ticket = ticketResult.rows[0];

    // Check if ticket is assigned to this worker
    if (ticket.workerId !== req.worker.id) {
      return next(new AppError('You are not authorized to update this ticket', 403));
    }

    // Update ticket status
    await prisma.query(
      'UPDATE tickets SET status = $1, "updatedAt" = NOW() WHERE id = $2',
      [status, id]
    );

    // Update complaint status
    await prisma.query(
      'UPDATE complaints SET status = $1, "updatedAt" = NOW() WHERE id = $2',
      [status, ticket.complaintId]
    );

    // Create ticket update (message is now required)
    await prisma.query(
      'INSERT INTO "ticket_updates" (id, "ticketId", message, status, "createdAt") VALUES (gen_random_uuid(), $1, $2, $3, NOW())',
      [id, message, status]
    );

    // Get updated ticket with complaint and updates
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
          'status', c.status,
          'createdAt', c."createdAt"
        ) as complaint,
        json_agg(
          json_build_object(
            'id', tu.id,
            'message', tu.message,
            'status', tu.status,
            'createdAt', tu."createdAt"
          ) ORDER BY tu."createdAt" DESC
        ) FILTER (WHERE tu.id IS NOT NULL) as updates
      FROM tickets t
      LEFT JOIN complaints c ON c.id = t."complaintId"
      LEFT JOIN "ticket_updates" tu ON tu."ticketId" = t.id
      WHERE t.id = $1
      GROUP BY t.id, c.id
    `, [id]);

    res.status(200).json({
      status: 'success',
      message: 'Ticket status updated successfully',
      data: { ticket: updatedTicketResult.rows[0] }
    });
  } catch (error) {
    next(error);
  }
};

// Add update/note to ticket
export const addTicketUpdate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { message, status } = req.body;

    if (!message) {
      return next(new AppError('Message is required', 400));
    }

    const ticketResult = await prisma.query(
      'SELECT * FROM tickets WHERE id = $1',
      [id]
    );

    if (ticketResult.rows.length === 0) {
      return next(new AppError('Ticket not found', 404));
    }

    const ticket = ticketResult.rows[0];

    // Check if ticket is assigned to this worker
    if (ticket.workerId !== req.worker.id) {
      return next(new AppError('You are not authorized to update this ticket', 403));
    }

    // Create ticket update
    const updateResult = await prisma.query(
      'INSERT INTO "ticket_updates" (id, "ticketId", message, status, "createdAt") VALUES (gen_random_uuid(), $1, $2, $3, NOW()) RETURNING *',
      [id, message, status || ticket.status]
    );

    const update = updateResult.rows[0];

    // If status is provided, update ticket and complaint status
    if (status) {
      await prisma.query(
        'UPDATE tickets SET status = $1, "updatedAt" = NOW() WHERE id = $2',
        [status, id]
      );

      await prisma.query(
        'UPDATE complaints SET status = $1, "updatedAt" = NOW() WHERE id = $2',
        [status, ticket.complaintId]
      );
    }

    res.status(201).json({
      status: 'success',
      message: 'Update added successfully',
      data: { update }
    });
  } catch (error) {
    next(error);
  }
};

// Get worker's statistics
export const getWorkerStats = async (req, res, next) => {
  try {
    const [
      totalTicketsResult,
      pendingTicketsResult,
      inProgressTicketsResult,
      resolvedTicketsResult
    ] = await Promise.all([
      prisma.query('SELECT COUNT(*) as count FROM tickets WHERE "workerId" = $1', [req.worker.id]),
      prisma.query("SELECT COUNT(*) as count FROM tickets WHERE \"workerId\" = $1 AND status = 'ASSIGNED'", [req.worker.id]),
      prisma.query("SELECT COUNT(*) as count FROM tickets WHERE \"workerId\" = $1 AND status = 'IN_PROGRESS'", [req.worker.id]),
      prisma.query("SELECT COUNT(*) as count FROM tickets WHERE \"workerId\" = $1 AND status = 'RESOLVED'", [req.worker.id])
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        stats: {
          total: parseInt(totalTicketsResult.rows[0].count),
          pending: parseInt(pendingTicketsResult.rows[0].count),
          inProgress: parseInt(inProgressTicketsResult.rows[0].count),
          resolved: parseInt(resolvedTicketsResult.rows[0].count)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get current worker profile
export const getMyProfile = async (req, res, next) => {
  try {
    const workerResult = await prisma.query(
      'SELECT id, email, "firstName", "lastName", "phoneNumber", "isActive", "lastLogin", "createdAt" FROM workers WHERE id = $1',
      [req.worker.id]
    );

    if (workerResult.rows.length === 0) {
      return next(new AppError('Worker not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: { worker: workerResult.rows[0] }
    });
  } catch (error) {
    next(error);
  }
};
