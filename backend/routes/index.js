const express = require("express");
const router = express.Router();

const devicesRoute = require("./devices");
const sensorDataRoute = require("./sensor-data");
const usersRoute = require("./users");

router.use("/nvrox/devices", devicesRoute);
router.use("/nvrox/sensor-data", sensorDataRoute);
router.use("/nvrox/users", usersRoute);

module.exports = router;
