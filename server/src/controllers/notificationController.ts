import { Response } from 'express';
import { dbStore } from '../db/index.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export const getMyNotifications = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  const notifications = dbStore.notifications
    .filter(n => n.userId === req.user!.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return res.json({
    success: true,
    data: {
      notifications,
      unreadCount,
    },
  });
};

export const markAsRead = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  const { id } = req.params;
  if (id === 'all') {
    dbStore.notifications
      .filter(n => n.userId === req.user!.id)
      .forEach(n => { n.isRead = true; });
    return res.json({ success: true, message: 'All notifications marked as read.' });
  }

  const notif = dbStore.notifications.find(n => n.id === id && n.userId === req.user!.id);
  if (notif) {
    notif.isRead = true;
  }

  return res.json({ success: true, message: 'Notification marked as read.' });
};
