function sendSuccess(res, data, statusCode = 200) {
  res.status(statusCode).json(data);
}

module.exports = { sendSuccess };
