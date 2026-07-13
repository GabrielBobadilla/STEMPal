const db = require('../config/db');
const { FieldValue } = require('firebase-admin').firestore;

const getNotifications = async (req, res) => {
  try {
    const snap = await db.collection('notifications')
      .where('user_id', '==', req.user.id)
      .orderBy('created_at', 'desc').limit(50).get();
    const notifications = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const getUnreadCount = async (req, res) => {
  try {
    const snap = await db.collection('notifications')
      .where('user_id', '==', req.user.id)
      .where('is_read', '==', false).get();
    res.json({ count: snap.size });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const markAsRead = async (req, res) => {
  try {
    const doc = await db.collection('notifications').doc(req.params.id).get();
    if (!doc.exists || doc.data().user_id !== req.user.id) {
      return res.status(404).json({ message: 'Notification not found.' });
    }
    await doc.ref.update({ is_read: true });
    res.json({ message: 'Notification marked as read.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    const snap = await db.collection('notifications').where('user_id', '==', req.user.id).where('is_read', '==', false).get();
    const batch = db.batch();
    snap.docs.forEach(doc => batch.update(doc.ref, { is_read: true }));
    await batch.commit();
    res.json({ message: 'All notifications marked as read.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const createNotification = async (req, res) => {
  try {
    const { title, message, type } = req.body;
    const ref = await db.collection('notifications').add({
      user_id: req.user.id, title, message, type: type || 'study_reminder',
      is_read: false, created_at: FieldValue.serverTimestamp()
    });
    res.status(201).json({ id: ref.id, message: 'Notification created.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const deleteNotification = async (req, res) => {
  try {
    const doc = await db.collection('notifications').doc(req.params.id).get();
    if (!doc.exists || doc.data().user_id !== req.user.id) {
      return res.status(404).json({ message: 'Notification not found.' });
    }
    await doc.ref.delete();
    res.json({ message: 'Notification deleted.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const createSystemNotification = async (userId, title, message, type) => {
  try {
    await db.collection('notifications').add({
      user_id: userId, title, message, type,
      is_read: false, created_at: FieldValue.serverTimestamp()
    });
  } catch (error) {
    console.error('Create notification error:', error);
  }
};

module.exports = { getNotifications, getUnreadCount, markAsRead, markAllAsRead, createNotification, deleteNotification, createSystemNotification };
