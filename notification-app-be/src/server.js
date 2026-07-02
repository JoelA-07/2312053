const app = require("./app");
const { Log } = require("../../logging-middleware");

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  const message = `Notification backend running on port ${PORT}`;
  console.log(message);
  Log("backend", "info", "service", message);
});
