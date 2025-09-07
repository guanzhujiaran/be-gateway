const express = require("express");

const cookParser = require("cookie-parser");
const router = express.Router();

router.use(cookParser());

module.exports = router;