const express = require("express");
const router = express.Router();
const cron = require("node-cron");

const {
    showQrCode,
    Signup,
    DeleteUser,
    Login,
    participateEvent,
    withdrawEvent,
    FindUser,
    getUserEvent,
} = require("../controller/userController");
const { CreateEvents, upload, fetchEvents, fetchUser, loginAdmin, checkAuth } = require("../controller/userAdmin"); 
const authenticateToken = require("../middleware/authenticateToken");

router.get("/", function(req, res) {res.send("Accueil");});
router.get("/qrcode/:username/:email", showQrCode);
router.post("/fetchSignup", Signup);
router.post("/loginManage", Login);
router.post("/createEvent", upload, CreateEvents); 
router.get("/fetch-events", fetchEvents);
router.delete("/user/:_id", DeleteUser);
router.post('/participate/:userId/:eventId', participateEvent);
router.post('/withdraw/:userId/:eventId', withdrawEvent);
router.get("/fetch-user/:idUser", fetchUser);
router.post("/fetch-user-events", getUserEvent);
router.get("/user-events", authenticateToken, FindUser);
router.get("/checkAuth", checkAuth);
router.post("/adminLogin", loginAdmin);





  module.exports = router;
