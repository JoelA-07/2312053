const notificationService = require("../services/notificationService");
const { sendSuccess } = require("../utils/apiResponse");
const { asyncHandler } = require("../utils/asyncHandler");
const { Log } = require("../../../logging-middleware");

const getNotifications = asyncHandler(async (req, res) => {
  const result = await notificationService.getNotifications(req.query);

  Log(
    "backend",
    "info",
    "controller",
    `Fetched ${result.notifications.length} notifications`
  );

  sendSuccess(res, result);
});

const getNotificationById = asyncHandler(async (req, res) => {
  const notification = await notificationService.getNotificationById(
    req.params.notificationId,
    req.query
  );

  sendSuccess(res, { notification });
});

const getUnreadCount = asyncHandler(async (req, res) => {
  const unreadCount = await notificationService.getUnreadCount(req.query);

  sendSuccess(res, { unreadCount });
});

const getPriorityInbox = asyncHandler(async (req, res) => {
  const result = await notificationService.getPriorityInbox(req.query);

  Log(
    "backend",
    "info",
    "controller",
    `Fetched ${result.notifications.length} priority notifications`
  );

  sendSuccess(res, result);
});

const markAsRead = asyncHandler(async (req, res) => {
  const notification = notificationService.markAsRead(req.params.notificationId);

  Log(
    "backend",
    "info",
    "controller",
    `Marked notification ${req.params.notificationId} as read`
  );

  sendSuccess(res, {
    message: "Notification marked as read",
    notification,
  });
});

const markAllAsRead = asyncHandler(async (req, res) => {
  const updatedCount = await notificationService.markAllAsRead(req.query);

  Log("backend", "info", "controller", `Marked ${updatedCount} notifications as read`);

  sendSuccess(res, {
    message: "All notifications marked as read",
    updatedCount,
  });
});


const createNotification = asyncHandler(async (req, res) => {
  const result = notificationService.createNotification(req.body);

  Log(
    "backend",
    "info",
    "controller",
    `Created ${result.createdCount} notification records`
  );

  sendSuccess(res, result, 201);
});

module.exports = {
  getNotifications,
  getNotificationById,
  getPriorityInbox,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  createNotification,
};
