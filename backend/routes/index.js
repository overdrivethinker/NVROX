const express = require("express");
const router = express.Router();

const devicesRoute = require("./devices");
const sensorDataRoute = require("./sensor-data");

router.use("/devices", devicesRoute);
router.use("/sensor-data", sensorDataRoute);

module.exports = router;
