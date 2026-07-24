// src/hooks/useNotifications.js
import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../utils/api.jsx';

export function useNotifications({ poll = true, interval = 30000 } = {}) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef(null);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const { data } = await api.get('notifications/unread-count');
      setUnreadCount(data.count ?? 0);
    } catch (error) {
      console.error(error);
    }
  }, []);

  const fetchNotifications = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const { data } = await api.get('notifications', { params });
      setNotifications(data.data ?? []);
      setPagination({
        current_page: data.current_page,
        last_page: data.last_page,
        total: data.total,
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (id) => {
    try {
      await api.patch(`notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error(error);
    }
  }, []);

  const markAsUnread = useCallback(async (id) => {
    try {
      await api.patch(`notifications/${id}/unread`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read_at: null } : n))
      );
      setUnreadCount((prev) => prev + 1);
    } catch (error) {
      console.error(error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await api.patch('notifications/mark-all-read');
      setNotifications((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })));
      setUnreadCount(0);
    } catch (error) {
      console.error(error);
    }
  }, []);

  const remove = useCallback(async (id) => {
    try {
      await api.delete(`notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    if (poll) {
      intervalRef.current = setInterval(fetchUnreadCount, interval);
      return () => clearInterval(intervalRef.current);
    }
  }, [poll, interval, fetchUnreadCount]);

  return {
    notifications,
    unreadCount,
    pagination,
    loading,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    remove,
  };
}