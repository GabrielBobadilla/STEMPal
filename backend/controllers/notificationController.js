const supabase = require('../config/supabase');

const getNotifications = async (req, res) => {
  try {
    const { data: notifications } = await supabase.from('notifications')
      .select('*').eq('user_id', req.user.id)
      .order('created_at', { ascending: false }).limit(50);
    res.json(notifications || []);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const getUnreadCount = async (req, res) => {
  try {
    const { count } = await supabase.from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', req.user.id).eq('is_read', false);
    res.json({ count: count || 0 });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const markAsRead = async (req, res) => {
  try {
    const { data: doc } = await supabase.from('notifications')
      .select('user_id').eq('id', req.params.id).single();
    if (!doc || doc.user_id !== req.user.id) {
      return res.status(404).json({ message: 'Notification not found.' });
    }
    await supabase.from('notifications').update({ is_read: true }).eq('id', req.params.id);
    res.json({ message: 'Notification marked as read.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', req.user.id).eq('is_read', false);
    res.json({ message: 'All notifications marked as read.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const createNotification = async (req, res) => {
  try {
    const { title, message, type } = req.body;
    const { data: row } = await supabase.from('notifications').insert({
      user_id: req.user.id, title, message, type: type || 'study_reminder',
      is_read: false, created_at: new Date().toISOString()
    }).select().single();
    res.status(201).json({ id: row?.id, message: 'Notification created.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const deleteNotification = async (req, res) => {
  try {
    const { data: doc } = await supabase.from('notifications')
      .select('user_id').eq('id', req.params.id).single();
    if (!doc || doc.user_id !== req.user.id) {
      return res.status(404).json({ message: 'Notification not found.' });
    }
    await supabase.from('notifications').delete().eq('id', req.params.id);
    res.json({ message: 'Notification deleted.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const createSystemNotification = async (userId, title, message, type) => {
  try {
    await supabase.from('notifications').insert({
      user_id: userId, title, message, type,
      is_read: false, created_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Create notification error:', error);
  }
};

module.exports = { getNotifications, getUnreadCount, markAsRead, markAllAsRead, createNotification, deleteNotification, createSystemNotification };
