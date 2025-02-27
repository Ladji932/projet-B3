require("dotenv").config();
const EventList = require("../model/eventList");
const userList = require('../model/model');
const { OAuth2Client } = require('google-auth-library');
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const activeUsers = new Map();
const client = new OAuth2Client("772746900391-ibsq5i8d9ahpv2o4c3uos0b15hab77sh.apps.googleusercontent.com");
const sharp = require('sharp');
const multer = require("multer");
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

const Login = async (req, res) => {
  const { email, password } = req.body;

  try {
      // Recherche de l'utilisateur par email
      const findUser = await userList.findOne({ email });
      if (!findUser) {
          console.log("User not found");
          return res.status(404).json({ message: "Utilisateur non trouvé" });
      }

      // Vérification du mot de passe
      if (!findUser.password) {
          console.log("Password not found for user");
          return res.status(401).json({ message: "Mot de passe non trouvé" });
      }

      const PasswordValidator = await bcrypt.compare(password, findUser.password);
      if (!PasswordValidator) {
          return res.status(401).json({ message: "Mot de passe incorrect" });
      }

      // Génération du token
      const token = jwt.sign({ userId: findUser._id, email: findUser.email }, secretKey, { expiresIn: '1h' });

      // Envoie du token dans la réponse
      res.status(200).json({ message: 'Connexion réussie', token });

  } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Erreur serveur" });
  }
}




const loginWithGoogle = async (req, res) => {
  const { idToken } = req.body;

  try {
    const ticket = await client.verifyIdToken({
      idToken: idToken,
      audience: "772746900391-ibsq5i8d9ahpv2o4c3uos0b15hab77sh.apps.googleusercontent.com",
    });
    const payload = ticket.getPayload();

    let user = await userList.findOne({ googleId: payload.sub });

    // Si l'utilisateur n'existe pas, crée un nouveau compte
    if (!user) {
      user = new userList({
        googleId: payload.sub,
        email: payload.email,
        username: payload.name,
      });
      await user.save();
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role }, 
      process.env.SECRET_KEY, 
      { expiresIn: "7d" }
    );

    console.log("Token généré:", token); // Affiche le token dans la console du serveur

    res.status(200).json({ message: "Connexion réussie", user, token });

  } catch (error) {
    console.error("Erreur lors de la connexion Google", error);
    res.status(500).json({ message: "Erreur de serveur" });
  }
};





const CreateEvents = async (req, res) => {
  const { title, description, category, location, contactInfo, createdBy, dateEvent, dateCreated, userId } = req.body;

  if (!title || !description || !category || !dateEvent || !location || !dateCreated || !userId) {
    return res.status(400).json({ message: "Tous les champs obligatoires, y compris userId, doivent être remplis." });
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
    let imageBuffer;

    // Vérifiez si l'image est un GIF
    if (req.file.mimetype === 'image/gif') {
      console.log('L\'image est au format GIF. Aucune conversion nécessaire.');
      imageBuffer = req.file.buffer; // Pas besoin de conversion
    } else if (req.file.mimetype === 'image/webp') {
      console.log('L\'image est déjà au format WebP.');
      imageBuffer = req.file.buffer; // Pas besoin de conversion
    } else {
      console.log('Conversion de l\'image en WebP...');
      imageBuffer = await sharp(req.file.buffer)
        .webp({ quality: 80 }) // Ajustez la qualité selon vos besoins
        .toBuffer();
      console.log('Image convertie en WebP avec succès.');
    }

    // Vérifiez les informations sur le buffer de l'image
    console.log(`Taille du buffer de l'image: ${imageBuffer.length} octets`);

    const newEvent = new EventList({
      userId,
      title,
      description,
      category,
      dateEvent,
      dateCreated,
      location,
      image: imageBuffer, // Stocker l'image (GIF ou WebP)
      contactInfo: parsedContactInfo,
      createdBy,
    });

    await newEvent.save();
    console.log('Événement créé avec succès.');
    res.status(201).json({ message: "Événement créé avec succès.", event: newEvent });
  } catch (error) {
    console.error("Erreur lors de la création de l'événement:", error);
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


const checkAuth = (req, res) => {
  console.log("🔹 Requête reçue sur /api/checkAuth");

  const authHeader = req.headers.authorization;
  console.log("🔹 Header Authorization :", authHeader);

  if (!authHeader) {
    console.log("❌ Aucun header Authorization trouvé");
    return res.status(401).json({ message: "Non autorisé" });
  }

  const token = authHeader.split(" ")[1];
  console.log("🔹 Token extrait :", token);

  if (!token) {
    console.log("❌ Aucun token fourni");
    return res.status(401).json({ message: "Non autorisé" });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    console.log("✅ Token décodé :", decoded);

    if (decoded.role === "user" || decoded.role === "admin") {
      console.log(`✅ Utilisateur authentifié avec rôle : ${decoded.role}`);
      return res.json({ message: "Utilisateur authentifié", role: decoded.role });
    } else {
      console.log("❌ Rôle non autorisé :", decoded.role);
      throw new Error("Rôle non autorisé");
    }
  } catch (error) {
    console.log("❌ Erreur lors de la vérification du token :", error.message);
    return res.status(401).json({ message: "Token invalide" });
  }
};


const loginAdmin = (req, res) => {
  const { email, password } = req.body;

  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    const token = jwt.sign({ email, role: "admin" }, SECRET_KEY, { expiresIn: "2h" });

    return res.json({ message: "Connexion réussie", token, user: { email, role: "admin" } });
  }

  res.status(401).json({ message: "Identifiants incorrects" });
};



const deleteEventUser = async (req, res) => {
  const { eventId } = req.params;
  const { userId } = req.body;

  try {
    const event = await EventList.findById(eventId);

    if (!event) {
      return res.status(404).json({ message: "Événement non trouvé." });
    }

    if (event.userId.toString() !== userId) {
      console.log("Accès refusé. Vous n'êtes pas l'auteur de cet événement.")
      return res.status(403).json({ message: "Accès refusé. Vous n'êtes pas l'auteur de cet événement." });
    }

    await EventList.findByIdAndDelete(eventId);
    res.status(200).json({ message: "Événement supprimé avec succès." });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la suppression de l'événement.", error });
  }
};



const updateEventUser = async (req, res) => {
  const { idUser, eventId } = req.params;
  const { title, description, location, category, dateEvent } = req.body;
  const image = req.file;

  try {
    const event = await EventList.findById(eventId);

    if (!event) {
      return res.status(404).json({ message: "Événement non trouvé." });
    }

    event.title = title || event.title;
    event.description = description || event.description;
    event.location = location || event.location;
    event.category = category || event.category;
    event.dateEvent = dateEvent || event.dateEvent;
    
    if (image) {
      event.image = image.buffer; // Assurez-vous d'assigner uniquement le buffer
    }

    await event.save();
    res.status(200).json({ message: "Événement mis à jour avec succès.", event });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la mise à jour de l'événement.", error });
    console.log(error);
  }
};
const fetchCreatedEvents = async (req, res) => {
  const { userEmail } = req.params;

  try {
    const events = await EventList.find({ createdBy: userEmail });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération des événements créés." });
    console.error("Erreur lors de la récupération des événements créés:", error);

  }
};





module.exports = {
  upload,
  CreateEvents,
  fetchEvents,
  fetchUser,
  loginAdmin,
  checkAuth,
  deleteEventUser,
  fetchCreatedEvents,
  updateEventUser,
  loginWithGoogle,
  Login
};
