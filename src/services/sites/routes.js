const router = require("express").Router();
const controller = require("./controller");
const { verifyToken } = require("../../middleware/auth");

router.use("/", verifyToken, controller);

module.exports = router;
