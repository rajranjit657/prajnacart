import { Response } from 'express';
import { pool } from '../db/index.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

const mapNotification = (row: any) => ({
  id: row.id,
  userId: row.user_id,
  title: row.title,
  message: row.message,
  type: row.type ?? undefined,
  link: row.link ?? undefined,
  isRead: Boolean(row.is_read),
  createdAt: row.created_at
    ? new Date(row.created_at).toISOString()
    : new Date().toISOString(),
});

export const getMyNotifications = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authenticated',
    });
  }

  try {
    const result = await pool.query(
      `
      SELECT
        id,
        user_id,
        title,
        message,
        type,
        link,
        is_read,
        created_at
      FROM notifications
      WHERE user_id = $1
      ORDER BY created_at DESC
      `,
      [req.user.id]
    );

    const notifications = result.rows.map(mapNotification);

    const unreadCount = notifications.filter(
      (notification) => !notification.isRead
    ).length;

    return res.json({
      success: true,
      data: {
        notifications,
        unreadCount,
      },
    });
  } catch (error: any) {
    console.error(
      'Get notifications error:',
      error.message
    );

    return res.status(500).json({
      success: false,
      message: 'Unable to load notifications.',
    });
  }
};

export const markAsRead = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authenticated',
    });
  }

  const { id } = req.params;

  try {
    if (id === 'all') {
      await pool.query(
        `
        UPDATE notifications
        SET is_read = TRUE
        WHERE user_id = $1
        `,
        [req.user.id]
      );

      return res.json({
        success: true,
        message: 'All notifications marked as read.',
      });
    }

    const result = await pool.query(
      `
      UPDATE notifications
      SET is_read = TRUE
      WHERE id = $1
        AND user_id = $2
      RETURNING id
      `,
      [id, req.user.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found.',
      });
    }

    return res.json({
      success: true,
      message: 'Notification marked as read.',
    });
  } catch (error: any) {
    console.error(
      'Mark notification as read error:',
      error.message
    );

    return res.status(500).json({
      success: false,
      message:
        'Unable to update notification status.',
    });
  }
};