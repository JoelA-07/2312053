const LOG_API_URL = "http://4.224.186.213/evaluation-service/logs";

export async function Log(stack, level, packageName, message) {
  try {
    await fetch(LOG_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
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
