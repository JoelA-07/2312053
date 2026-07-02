import { useState, useEffect } from "react";
import { fetchNotifications } from "../api/notifications";
import { Log } from "../utils/logger";
import {
  getViewedNotificationIds,
  saveViewedNotificationId,
} from "../utils/viewedNotifications";

export function useNotifications({ page, filter, limit = 10 }) {
  const [notifications, setNotifications] = useState([]);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    const load = async () => {
      try {
        setLoading(true);
        setError("");

        const listData = await fetchNotifications({ page, limit, type: filter });

        if (ignore) {
          return;
        }

        const viewedIds = getViewedNotificationIds();
        const nextNotifications = (listData.notifications ?? []).map((notification) => ({
          ...notification,
          isRead: viewedIds.includes(notification.id),
        }));

        setNotifications(nextNotifications);
        setTotal(listData.total ?? 0);
        setUnreadCount(
          nextNotifications.filter((notification) => !notification.isRead).length
        );
        Log("frontend", "info", "hook", "Notifications loaded successfully");
      } catch (err) {
        if (!ignore) {
          setError(err.message || "Unable to load notifications");
          Log("frontend", "error", "hook", "Unable to load notifications");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      ignore = true;
    };
  }, [page, filter, limit]);

  const markAsRead = (notificationId) => {
    saveViewedNotificationId(notificationId);
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === notificationId
          ? { ...notification, isRead: true }
          : notification
      )
    );
    setUnreadCount((current) => Math.max(current - 1, 0));
    Log("frontend", "info", "hook", `Notification ${notificationId} marked as read`);
  };

  const totalPages = Math.max(Math.ceil(total / limit), 1);

  return {
    notifications,
    total,
    totalPages,
    unreadCount,
    loading,
    error,
    markAsRead,
  };
}
