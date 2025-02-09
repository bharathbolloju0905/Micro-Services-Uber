const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/authmiddleware");
const createRide = require("../controllers/RideControllers");

router.post("/create-ride",authenticate.authenticate,createRide.createRide);
router.put("/acceptRide",authenticate.authenticateCaptain,createRide.updateRide);

module.exports = router;