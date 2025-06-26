const express = require("express");
const router = express.Router();

// Placeholder admin route
router.get("/", (req, res) => {
  res.json({ message: "Admin route placeholder" });
});

module.exports = router;
