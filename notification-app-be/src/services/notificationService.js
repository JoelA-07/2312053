const { Log } = require("../../../logging-middleware");
const { getAccessToken } = require("./authService");
const { getPriorityNotifications } = require("../utils/priority");

const DEFAULT_API_URL = "http://4.224.186.213/evaluation-service/notifications";
const readNotificationIds = new Set();
const localNotifications = [];

function buildApiUrl(query = {}) {
  const url = new URL(process.env.NOTIFICATION_API_URL || DEFAULT_API_URL);

  ["limit", "page", "notification_type"].forEach((key) => {
    if (query[key]) {
      const value =
        key === "limit" ? Math.max(Number(query[key]) || 5, 5) : query[key];

      url.searchParams.set(key, value);
    }
  });

  return url;
}

async function getAuthHeader(query = {}) {
  try {
    const token = await getAccessToken();

    if (token) {
      return `Bearer ${token}`;
    }
  } catch (error) {
    Log("backend", "error", "auth", error.message);
  }

  return query.authorization || "";
}

function normalizeNotification(notification) {
  const id = notification.ID || notification.id;

  return {
    id,
    type: notification.Type || notification.type,
    message: notification.Message || notification.message || "",
    timestamp: notification.Timestamp || notification.timestamp || null,
    isRead: readNotificationIds.has(id) || Boolean(notification.isRead),
  };
}

async function fetchRemoteNotifications(query) {
  const url = buildApiUrl(query);
  const headers = {
    Accept: "application/json",
  };

  const authHeader = await getAuthHeader(query);

  if (authHeader) {
    headers.Authorization = authHeader;
  }

  const response = await fetch(url, { headers });

  if (!response.ok) {
    Log(
      "backend",
      "error",
      "service",
      `Notification API failed with status ${response.status}`
    );

    const error = new Error("Unable to fetch notifications");
    error.statusCode = 502;
    throw error;
  }

  const data = await response.json();
  return Array.isArray(data.notifications) ? data.notifications : [];
}

async function getNotifications(query = {}) {
  const remoteNotifications = await fetchRemoteNotifications(query);
  const notifications = [...localNotifications, ...remoteNotifications].map(
    normalizeNotification
  );

  return {
    notifications,
    page: Number(query.page || 1),
    limit: Number(query.limit || notifications.length),
    total: notifications.length,
  };
}

async function getNotificationById(notificationId, query = {}) {
  const result = await getNotifications(query);
  const notification = result.notifications.find((item) => item.id === notificationId);

  if (!notification) {
    const error = new Error("Notification not found");
    error.statusCode = 404;
    throw error;
  }

  return notification;
}

async function getUnreadCount(query = {}) {
  const result = await getNotifications(query);

  return result.notifications.filter((notification) => !notification.isRead).length;
}

async function getPriorityInbox(query = {}) {
  const limit = Number(query.limit || 10);
  const result = await getNotifications({
    ...query,
    page: 1,
    limit: query.sourceLimit || 100,
  });
  const unreadNotifications = result.notifications.filter(
    (notification) => !notification.isRead
  );

  return {
    notifications: getPriorityNotifications(unreadNotifications, limit),
    limit,
    total: unreadNotifications.length,
  };
}

function markAsRead(notificationId) {
  if (!notificationId) {
    const error = new Error("Notification id is required");
    error.statusCode = 400;
    throw error;
  }

  readNotificationIds.add(notificationId);

  return {
    id: notificationId,
    isRead: true,
  };
}

async function markAllAsRead(query = {}) {
  const result = await getNotifications(query);

  result.notifications.forEach((notification) => {
    readNotificationIds.add(notification.id);
  });

  return result.notifications.length;
}

function createNotification(body) {
  const { studentIds, type, message } = body;

  if (!Array.isArray(studentIds) || studentIds.length === 0) {
    const error = new Error("studentIds should be a non-empty array");
    error.statusCode = 400;
    throw error;
  }

  if (!["Event", "Result", "Placement"].includes(type)) {
    const error = new Error("type should be Event, Result, or Placement");
    error.statusCode = 400;
    throw error;
  }

  if (!message || typeof message !== "string") {
    const error = new Error("message is required");
    error.statusCode = 400;
    throw error;
  }

  const timestamp = new Date().toISOString();

  studentIds.forEach((studentId) => {
    localNotifications.push({
      id: `local-${studentId}-${Date.now()}`,
      studentId,
      Type: type,
      Message: message,
      Timestamp: timestamp,
      isRead: false,
    });
  });

  return {
    message: "Notifications created",
    createdCount: studentIds.length,
  };
}

module.exports = {
  getNotifications,
  getNotificationById,
  getPriorityInbox,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  createNotification,
};
