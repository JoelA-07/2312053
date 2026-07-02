const express = require("express");
const cors = require("cors");
const notificationRoutes = require("./routes/notificationRoutes");
const { loggingMiddleware, errorLoggingMiddleware } = require("../../logging-middleware");
const { errorHandler } = require("./middleware/errorHandler");

const app = express();

app.use(cors());
app.use(express.json());
app.use(loggingMiddleware);

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "notification-app-be",
  });
});

app.use("/api/notifications", notificationRoutes);

app.use(errorLoggingMiddleware);
app.use(errorHandler);

module.exports = app;
