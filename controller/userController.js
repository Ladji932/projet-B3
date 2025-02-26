require("dotenv").config()
const nodemailer = require("nodemailer");
const userList = require('../model/model');
const EventList = require('../model/eventList');
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const secretKey = process.env.SECRET_KEY;
const fs = require('fs');
const path = require('path');
const Qrcode = require('qrcode');
const cron = require("node-cron");
const mongoose = require('mongoose');
const activeUsers = new Map()
const { console } = require("inspector");



transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
    }
});


/*
module.exports.Login = async (req, res) => {
  const { email, password } = req.body;
  console.log(email,password)
  console.log(activeUsers)


  try {
      const findUser = await userList.findOne({ email });
      if (!findUser) {
          console.log("User not found");
          return res.status(404).json({ message: "Utilisateur non trouvé" });
      }

      const PasswordValidator = await bcrypt.compare(password, findUser.password);
      if (!PasswordValidator) {
          return res.status(401).json({ message: "Mot de passe incorrect" });
      }

      const token = jwt.sign({ userId: findUser._id, email: findUser.email }, secretKey, { expiresIn: '1h' });
      const expiration = Date.now() + 60 * 60 * 1000; 

      activeUsers.set(findUser._id.toString(), expiration);
      console.log(activeUsers)

      res.cookie('auth_token', token, { 
      domain: 'projet-b3.onrender.com',
       secure: true, 
       httpOnly: false, 
       sameSite: 'None',
        maxAge: 3600000, 
    });
    

      res.status(200).json({ message: 'Connexion réussie',token });
      console.log("Cookie envoyé :", token);


  } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Erreur serveur" });
  }
}*/





module.exports.Logout = async (req, res) => {
  const authToken = req.headers.authorization?.split(" ")[1];

  if (!authToken) return res.status(403).json({ message: "Token manquant" });

  try {
    const decoded = jwt.verify(authToken, process.env.SECRET_KEY);
    activeUsers.delete(decoded.userId);
    res.status(200).json({ message: "Déconnexion réussie" });
  } catch (err) {
    res.status(401).json({ message: "Token invalide ou expiré" });
  }
};


module.exports.Signup = async (req, res) => {
    const { login, mail, password, phone } = req.body;
    try {
        if (!password) {
            return res.status(400).json({ message: "Password is required" });
        }

        const emailExisting = await userList.findOne({ email: mail });
        
        if (emailExisting) {
            return res.status(400).json({ message: "This email is already used" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new userList({
            username: login,
            email: mail,
            password: hashedPassword,
            phoneNumber: phone
        });

        await newUser.save();

        const mailOptions = {
            from: '"maigaladji47@gmail.com"',
            to: newUser.email,
            subject: "Bienvenue sur Event Ease !",
            html: `
                <h1>Bienvenue ${newUser.username}!</h1>
                <p>Merci de vous être inscrit sur Event Ease. Votre inscription a bien été enregistrée.</p>
                <p>À bientôt !</p>
            `,
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error("Erreur lors de l'envoi de l'email", error);
                return res.status(500).json({ message: "Erreur lors de l'envoi de l'email" });
            }
            res.status(201).json({ message: "User created, welcome email sent" });
        });

    } catch (error) {
        console.error(error);
        res.status(400).json({ message: "Error in User creation" });
    }
};

module.exports.DeleteUser = async (req, res) => {
    const {_id} = req.params; 


    try {
        const user = await EventList.findByIdAndDelete(_id);  
        
        if (!user) {
            console.log("évenements non trouvé");
            return res.status(404).json({ message: "évenements non trouvé" });
        }

        await EventList.deleteOne({ _id: _id });
        
        return res.status(200).json({ message: "Utilisateur supprimé avec succès" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erreur serveur" });
    }
};








module.exports.FindUser = async (req, res) => {
  console.log("OKK")
  const authToken = req.headers.authorization?.split(" ")[1];
  console.log(authToken)
  console.log(process.env.SECRET_KEY)

  if (!authToken) {
    console.log("Token manquant")
    return res.status(403).json({ message: "Token manquant" });
  }

  try {
    const decoded = jwt.verify(authToken, process.env.SECRET_KEY); 
    const userId = decoded.userId;

    console.log(userId);

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "UserId invalide." });
    }

    try {
      const user = await userList.findById(userId);

      if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouvé." });
      }

      const userEvents = await EventList.find({ '_id': { $in: user.participatedEvents } });

      if (userEvents.length === 0) {
        return res.status(404).json({ message: "Aucun événement trouvé pour cet utilisateur." });
      }

      res.status(200).json({ events: userEvents });

    } catch (err) {
      console.error("Erreur lors de la récupération des événements :", err);
      res.status(500).json({ message: "Erreur serveur lors de la récupération des événements." });
    }
    
  } catch (err) {
    return res.status(401).json({ message: "Token invalide ou expiré" });
  }
};



module.exports.participateEvent = async (req, res) => {
  const { userId, eventId } = req.params;

  try {
    // Vérifier l'utilisateur
    const user = await userList.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé." });
    }

    // Vérifier l'événement
    const event = await EventList.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Événement non trouvé." });
    }

    // Vérifier si l'utilisateur participe déjà
    if (user.participatedEvents.includes(eventId)) {
      return res.status(400).json({ message: "Vous participez déjà à cet événement." });
    }

    // Ajouter l'utilisateur à l'événement et vice-versa
    user.participatedEvents.push(eventId);
    event.participants.push(userId);

    // Sauvegarder les changements
    await user.save();
    await event.save();

    const mailOptions = {
      from: '"maigaladji47@gmail.com"',
      to: user.email,
      subject: `Merci de participer à l'événement: ${event.title}`,
      html: `
        <h1>Merci de votre participation, ${user.username}!</h1>
        <p>Nous sommes heureux de vous compter parmi les participants à l'événement "${event.title}".</p>
        <p>À bientôt à l'événement !</p>
      `,
    };

    // Envoyer l'email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Erreur lors de l'envoi de l'email", error);
        return res.status(500).json({ message: "Erreur lors de l'envoi de l'email" });
      }
      res.status(200).json({ message: "Participation enregistrée et email envoyé." });
    });
  } catch (error) {
    console.error("Erreur lors de la gestion de la participation :", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

  

  
module.exports.withdrawEvent = async (req, res) => {
  const { userId, eventId } = req.params;


  try {
    const user = await userList.findById(userId);
    if (!user) {
      console.error("Utilisateur introuvable.");
      return res.status(404).json({ message: "Utilisateur non trouvé." });
    }

    const event = await EventList.findById(eventId);
    if (!event) {
      console.error("Événement introuvable.");
      return res.status(404).json({ message: "Événement non trouvé." });
    }

    if (!user.participatedEvents.includes(eventId)) {
      console.error("Utilisateur non inscrit à cet événement.");
      return res.status(400).json({ message: "Vous ne participez pas à cet événement." });
    }


    user.participatedEvents = user.participatedEvents.filter(_id => _id.toString() !== eventId.toString());
    event.participants = event.participants.filter(_id => _id.toString() !== userId.toString());


    await user.save();
    await event.save();

    res.status(200).json({ message: "Vous ne participez plus à cet événement." });
  } catch (error) {
    console.error("Erreur lors du retrait :", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
};










module.exports.getUserEvent = async (req, res) => {
 
  const { eventIds } = req.body;
  console.log("Données de la requête:", req.body);
  
  if (!eventIds || eventIds.length === 0) {
      return res.status(400).json({ message: "Aucun ID d'événement fourni." });
  }
  
  // Utiliser directement mongoose.Types.ObjectId sur les IDs présents dans l'array
  const eventIdArray = eventIds.map(id => new mongoose.Types.ObjectId(id));
  
  try {
      // Rechercher les événements en utilisant ces ObjectIds
      const events = await EventList.find({
          '_id': { $in: eventIdArray }
      });
  
      if (events.length === 0) {
          return res.status(404).json({ message: "Aucun événement trouvé." });
      }
  
      // Retourner les événements trouvés
      return res.status(200).json(events);
  } catch (error) {
      console.error("Erreur serveur:", error);
      return res.status(500).json({ message: "Erreur lors de la récupération des événements." });
  }
  
};






cron.schedule("0 0 */5 * *", async () => {
  console.log("Vérification des utilisateurs connectés pour envoi d'email...");

  const now = Date.now();
  for (let [userId, expiration] of activeUsers.entries()) {
    if (now > expiration) {
      activeUsers.delete(userId);
      continue;
    }

    try {
      const user = await userList.findById(userId);
      if (!user) continue;

      const userEvents = await EventList.find({ '_id': { $in: user.participatedEvents } });

      const upcomingEvents = userEvents.filter(event => new Date(event.dateEvent) > now);

      if (upcomingEvents.length === 0) {
        console.log(`Aucun événement futur trouvé pour ${user.email}`);
        continue;
      }

      let emailHTML = `
      <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4;">
        <div style="max-width: 600px; background: white; padding: 20px; border-radius: 8px; box-shadow: 0px 0px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #333;">Bonjour ${user.username},</h2>
          <p style="font-size: 16px; color: #555;">Vous avez <strong>${upcomingEvents.length}</strong> événement(s) à venir :</p>
          <ul style="list-style: none; padding: 0;">`;

      upcomingEvents.forEach(event => {
        const timeDiff = new Date(event.dateEvent) - now;
        const daysLeft = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        const hoursLeft = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutesLeft = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

        let timeMessage = "";
        if (daysLeft > 0) {
          timeMessage = `${daysLeft} jours, ${hoursLeft}h et ${minutesLeft}m`;
        } else if (hoursLeft > 0) {
          timeMessage = `${hoursLeft}h et ${minutesLeft}m`;
        } else {
          timeMessage = `${minutesLeft} minutes`;
        }

        emailHTML += `
          <li style="background: #007bff; color: white; margin: 10px 0; padding: 10px; border-radius: 5px;">
            <strong>${event.title}</strong> : <br> 
            <span style="font-size: 14px;">Il vous reste <strong>${timeMessage}</strong> avant le début de l'événement.</span>
          </li>`;
      });

      emailHTML += `
          </ul>
          <p style="color: #888;">À bientôt !</p>
        </div>
      </div>`;

      console.log(`Utilisateur: ${user.email}, email préparé en HTML`);

      const mailOptions = {
        from: process.env.MAIL_USER,
        to: user.email,
        subject: "Notification automatique",
        html: emailHTML,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error(`Erreur envoi email à ${user.email}:`, error);
        } else {
          console.log(`Notification envoyée à ${user.email}`);
        }
      });

    } catch (error) {
      console.error(`Erreur pour l'utilisateur ${userId}:`, error);
    }
  }
});


