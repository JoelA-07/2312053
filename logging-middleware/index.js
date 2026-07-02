const defaultLogUrl = "http://4.224.186.213/evaluation-service/logs";
const logConfig = {
  url: "",
  token: "",
};

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

function getEnvValue(name) {
  if (typeof process === "undefined" || !process.env) {
    return "";
  }

  return process.env[name] || "";
}

function setLogConfig(config) {
  if (!config) {
    return;
  }

  if (config.url) {
    logConfig.url = config.url;
  }

  if (config.token) {
    logConfig.token = config.token;
  }
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
  const token = logConfig.token || getEnvValue("LOG_ACCESS_TOKEN");

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const logUrl = logConfig.url || getEnvValue("LOG_API_URL") || defaultLogUrl;
    const response = await fetch(logUrl, {
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
    Log("backend", level, "route", message);
  });

  next();
}

function errorLoggingMiddleware(err, req, res, next) {
  const method = req.method;
  const url = req.originalUrl || req.url;
  const message = err && err.message ? err.message : "Unknown error";
  const logMessage = `${method} ${url} failed - ${message}`;

  console.error(logMessage);
  Log("backend", "error", "route", logMessage);
  next(err);
}

module.exports = {
  Log,
  setLogConfig,
  loggingMiddleware,
  errorLoggingMiddleware,
};
