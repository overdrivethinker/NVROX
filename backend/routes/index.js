const express = require("express");
const router = express.Router();

const devicesRoute = require("./devices");
const sensorDataRoute = require("./sensor-data");

router.use("/nvrox/devices", devicesRoute);
router.use("/nvrox/sensor-data", sensorDataRoute);

module.exports = router;
