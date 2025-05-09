module.exports = (req, res, next) => {
  try {
    const user = req.user;

    if (!user || user.role !== 'admin') {
      return res.status(403).json({
        message: "Access denied. Admins only.",
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};
