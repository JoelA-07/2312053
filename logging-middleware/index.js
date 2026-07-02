const LOG_API_URL =
  process.env.LOG_API_URL || "http://4.224.186.213/evaluation-service/logs";

const allowedStacks = ["backend", "frontend"];
const allowedLevels = ["debug", "info", "warn", "error", "fatal"];
const allowedPackages = [
  "api",
  "component",
  "hook",
  "page",
  "state",
  "style",
  "auth",
  "config",
  "middleware",
  "utils",
  "cache",
  "controller",
  "cron_job",
  "db",
  "domain",
  "handler",
  "repository",
  "route",
  "service",
];

function isValidLog(stack, level, packageName, message) {
  return (
    allowedStacks.includes(stack) &&
    allowedLevels.includes(level) &&
    allowedPackages.includes(packageName) &&
    typeof message === "string" &&
    message.trim().length > 0
  );
}

async function Log(stack, level, packageName, message) {
  const logData = {
    stack: String(stack || "").toLowerCase(),
    level: String(level || "").toLowerCase(),
    package: String(packageName || "").toLowerCase(),
    message,
  };

  if (!isValidLog(logData.stack, logData.level, logData.package, message)) {
    console.error("Invalid log data", logData);
    return null;
  }

  const headers = {
    "Content-Type": "application/json",
  };

  if (process.env.LOG_ACCESS_TOKEN) {
    headers.Authorization = `Bearer ${process.env.LOG_ACCESS_TOKEN}`;
  }

  try {
    const response = await fetch(LOG_API_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(logData),
    });

    if (!response.ok) {
      console.error(`Log API failed with status ${response.status}`);
      return null;
    }

    return response.json();
  } catch (error) {
    console.error(`Log API error - ${error.message}`);
    return null;
  }
}

function loggingMiddleware(req, res, next) {
  const startedAt = Date.now();
  const method = req.method;
  const url = req.originalUrl || req.url;

  res.on("finish", () => {
    const duration = Date.now() - startedAt;
    const status = res.statusCode;
    const level = status >= 500 ? "error" : status >= 400 ? "warn" : "info";
    const message = `${method} ${url} ${status} - ${duration}ms`;

    console.log(message);
    Log("backend", level, "middleware", message);
  });

  next();
}

function errorLoggingMiddleware(err, req, res, next) {
  const method = req.method;
  const url = req.originalUrl || req.url;
  const message = err && err.message ? err.message : "Unknown error";
  const logMessage = `${method} ${url} failed - ${message}`;

  console.error(logMessage);
  Log("backend", "error", "middleware", logMessage);
  next(err);
}

module.exports = {
  Log,
  loggingMiddleware,
  errorLoggingMiddleware,
};
