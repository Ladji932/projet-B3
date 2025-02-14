require("dotenv").config();
const EventList = require("../model/eventList");
const userList = require('../model/model');
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const UserList = require("../model/model");
const secretKey = process.env.SECRET_KEY;
const { ADMIN_EMAIL, ADMIN_PASSWORD, SECRET_KEY } = process.env;

// Middleware
module.exports.checkAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      message: "Accès refusé. Vous n'êtes pas administrateur.",
    });
  }
  next();
};

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const fileTypes = /jpeg|jpg|png|gif/;
  const extname = fileTypes.test(file.originalname.toLowerCase());
  const mimetype = fileTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb("Erreur : Seuls les fichiers images (jpg, jpeg, png, gif) sont autorisés.");
  }
};

const upload = multer({
  storage,
  fileFilter,
}).single("image");

const CreateEvents = async (req, res) => {
  const { title, description, category, location, contactInfo, createdBy , dateEvent , dateCreated} = req.body;

  if (!title || !description || !category || !dateEvent || !location || !dateCreated) {
    return res.status(400).json({ message: "Tous les champs obligatoires doivent être remplis." });
  }

  let parsedContactInfo;
  try {
    parsedContactInfo = contactInfo ? JSON.parse(contactInfo) : undefined;
  } catch {
    return res.status(400).json({
      message: "Les informations de contact doivent être un JSON valide.",
    });
  }

  if (!req.file) {
    return res.status(400).json({ message: "Veuillez télécharger une image pour l'événement." });
  }

  try {
    const newEvent = new EventList({
      title,
      description,
      category,
      dateEvent,
      dateCreated,
      location,
      image: req.file.buffer,
      contactInfo: parsedContactInfo,
      createdBy,
    });

    await newEvent.save();
    res.status(201).json({ message: "Événement créé avec succès.", event: newEvent });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la création de l'événement.", error });
  }
};

// Récupérer tous les événements
const fetchEvents = async (req, res) => {
  try {
    const events = await EventList.find();
    const transformedEvents = events.map((event) => ({
      ...event.toObject(),
      image: event.image
        ? `data:image/jpeg;base64,${event.image.toString("base64")}`
        : null, // Assurez-vous que l'image est encodée en base64 pour le frontend
    }));
    res.status(200).json({ events: transformedEvents });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de la récupération des événements." });
  }
};


const fetchUser = async (req, res) => {
  const { idUser } = req.params; 
  try {
    const user = await UserList.find({ _id: idUser }); 
    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de la récupération de l'user" });
  }
};


const checkAuth = (req,res) => {
  const token = req.cookies.adminToken; 
  if (!token) return res.status(401).json({ message: "Non autorisé" });

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    if (decoded.role !== "admin") throw new Error();
    res.json({ message: "Utilisateur authentifié" });
  } catch {
    res.status(401).json({ message: "Token invalide" });
  }
};


const loginAdmin = (req, res) => {
  const { email, password } = req.body;
  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    const token = jwt.sign({ email, role: "admin" }, SECRET_KEY, { expiresIn: "2h" });

    res.cookie("adminToken", token, {
      secure: false,     
      sameSite: "Strict", 
      maxAge: 2 * 60 * 60 * 1000, // Expire dans 2h
    });

    return res.json({ message: "Connexion réussie", user: { email, role: "admin" } });
  }
  res.status(401).json({ message: "Identifiants incorrects" });
};



module.exports = {
  upload,
  CreateEvents,
  fetchEvents,
  fetchUser,
  loginAdmin,
  checkAuth
};
