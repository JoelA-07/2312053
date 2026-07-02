const DEFAULT_AUTH_URL = "http://4.224.186.213/evaluation-service/auth";

let cachedToken = "";
let cachedExpiry = 0;

function decodeExpiry(token) {
  try {
    const payload = JSON.parse(
      Buffer.from(token.split(".")[1], "base64url").toString()
    );
    const claims = payload.MapClaims || payload;

    return Number(claims.exp || 0) * 1000;
  } catch {
    return 0;
  }
}

function hasAuthConfig() {
  return (
    process.env.AUTH_EMAIL &&
    process.env.AUTH_NAME &&
    process.env.AUTH_ROLL_NO &&
    process.env.AUTH_ACCESS_CODE &&
    process.env.AUTH_CLIENT_ID &&
    process.env.AUTH_CLIENT_SECRET
  );
}

function findToken(data) {
  return (
    data.accessToken ||
    data.access_token ||
    data.token ||
    data.access_token_value ||
    ""
  );
}

async function getAccessToken() {
  const now = Date.now();

  if (cachedToken && cachedExpiry - 30000 > now) {
    return cachedToken;
  }

  if (!hasAuthConfig()) {
    return process.env.NOTIFICATION_API_TOKEN || "";
  }

  const response = await fetch(process.env.AUTH_API_URL || DEFAULT_AUTH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      email: process.env.AUTH_EMAIL,
      name: process.env.AUTH_NAME,
      rollNo: process.env.AUTH_ROLL_NO,
      accessCode: process.env.AUTH_ACCESS_CODE,
      clientID: process.env.AUTH_CLIENT_ID,
      clientSecret: process.env.AUTH_CLIENT_SECRET,
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || "Unable to get access token");
    error.statusCode = response.status;
    throw error;
  }

  const token = findToken(data);

  if (!token) {
    const error = new Error("Auth response did not include an access token");
    error.statusCode = 502;
    throw error;
  }

  cachedToken = token;
  cachedExpiry = decodeExpiry(token) || now + 10 * 60 * 1000;
  process.env.NOTIFICATION_API_TOKEN = token;
  process.env.LOG_ACCESS_TOKEN = token;

  return cachedToken;
}

module.exports = { getAccessToken };
