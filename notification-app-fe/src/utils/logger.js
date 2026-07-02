const LOG_API_URL =
  import.meta.env.VITE_LOG_API_URL ||
  "http://4.224.186.213/evaluation-service/logs";

export async function Log(stack, level, packageName, message) {
  try {
    const headers = {
      "Content-Type": "application/json",
    };

    if (import.meta.env.VITE_LOG_ACCESS_TOKEN) {
      headers.Authorization = `Bearer ${import.meta.env.VITE_LOG_ACCESS_TOKEN}`;
    }

    await fetch(LOG_API_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({
        stack,
        level,
        package: packageName,
        message,
      }),
    });
  } catch (error) {
    console.error("Log API error", error.message);
  }
}
