const express = require("express");
const router = express.Router();

const {
    Signup,
    DeleteUser,
    participateEvent,
    withdrawEvent,
    FindUser,
    getUserEvent,
} = require("../controller/userController");
const { CreateEvents, upload, fetchEvents, fetchUser, loginAdmin, checkAuth, deleteEventUser, fetchCreatedEvents, updateEventUser, loginWithGoogle , Login } = require("../controller/userAdmin"); 
const authenticateToken = require("../middleware/authenticateToken");
const checkEventOwner = require("../middleware/checkEventOwner");


router.get("/", function(req, res) {res.send("Accueil");});
router.post("/fetchSignup", Signup);
router.post("/loginManage",Login);
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
router.delete("/event/:eventId", deleteEventUser);
router.post("/update/:eventId/:idUser", upload, updateEventUser);
router.get('/fetch-created-events/:userEmail', fetchCreatedEvents);
router.post("/loginGoogle",loginWithGoogle)






  module.exports = router;
