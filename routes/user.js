const express = require("express");
const router = express.Router();
const userController  = require("../controllers/userController");
const { isLoggedIn } = require("../utils/middlewares");

router.get("/signup", userController.renderSignup);
router.post("/signup", userController.signup);

router.get("/signin", userController.renderSignin);
router.post("/signin", userController.signin);

router.get("/otpVerification", isLoggedIn, userController.otpVerification);
router.post("/otpVerification", isLoggedIn, userController.verifyOtp);

module.exports = router;