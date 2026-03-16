const router = require("express").Router();

/**
 * @route   GET /api/v1/ping
 * @desc    Ping接口，用于检测服务器连通性
 * @access  Public (无需认证)
 */
router.get("", (req, res) => {
  res.json({
    code: 0,
    message: "pong",
    data: {
      timestamp: Date.now(),
      uptime: process.uptime(),
    },
  });
});

module.exports = router;
