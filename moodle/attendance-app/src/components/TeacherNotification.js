import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const TeacherNotification = ({ courseId }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll setiap 30 detik
    return () => clearInterval(interval);
  }, [courseId]);

  const fetchNotifications = async () => {
    try {
      const response = await axios.get(`http://localhost:3000/notifications`, {
        params: { courseId }
      });
      
      const newNotifications = response.data;
      setNotifications(newNotifications);
      
      const newUnread = newNotifications.filter(n => !n.read).length;
      if (newUnread > unreadCount) {
        // Ada notifikasi baru
        const latestNotif = newNotifications[0];
        toast.info(latestNotif.message, {
          position: "top-right",
          autoClose: 5000
        });
      }
      setUnreadCount(newUnread);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await axios.post(`http://localhost:3000/notifications/${notificationId}/read`);
      setNotifications(notifications.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'attendance':
        return '👤';
      case 'warning':
        return '⚠️';
      case 'success':
        return '✅';
      default:
        return '📌';
    }
  };

  return (
    <div className="notifications">
      <div className="notifications-header">
        <h3>Notifikasi</h3>
        {unreadCount > 0 && (
          <span className="badge">{unreadCount}</span>
        )}
      </div>

      <div className="notifications-list">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`notification-item ${notification.read ? 'read' : 'unread'}`}
            onClick={() => !notification.read && markAsRead(notification.id)}
          >
            <div className="notification-icon">
              {getNotificationIcon(notification.type)}
            </div>
            <div className="notification-content">
              <div className="notification-message">
                {notification.message}
              </div>
              <div className="notification-time">
                {new Date(notification.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeacherNotification;
