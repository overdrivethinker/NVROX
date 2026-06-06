const express = require("express");
const router = express.Router();

const devicesRoute = require("./devices");
const sensorDataRoute = require("./sensor-data");
const usersRoute = require("./users");
const authRoute = require("./auth");

router.use("/nvrox/devices", devicesRoute);
router.use("/nvrox/sensor-data", sensorDataRoute);
router.use("/nvrox/users", usersRoute);
router.use("/nvrox/auth", authRoute);

module.exports = router;
