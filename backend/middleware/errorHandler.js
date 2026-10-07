function notFound(req, res) {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
}

function errorHandler(err, req, res, next) {
  console.error(err);

  if (err.code === "ER_DUP_ENTRY") {
    return res.status(409).json({
      success: false,
      message: "A record with the same unique value already exists."
    });
  }

  if (err.code === "ER_NO_REFERENCED_ROW_2") {
    return res.status(400).json({
      success: false,
      message: "The referenced record does not exist."
    });
  }

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.statusCode ? err.message : "An unexpected server error occurred."
  });
}

module.exports = { notFound, errorHandler };
