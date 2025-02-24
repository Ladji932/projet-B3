const express = require('express');
const router = express.Router();
const EventList = require('../model/eventList'); // Assurez-vous d'importer votre modèle

const checkEventOwner = async (req, res, next) => {
  const { eventId } = req.params; // Récupérer l'ID de l'événement depuis les paramètres de la requête
  const userId = req.body.userId; // Récupérer l'ID de l'utilisateur depuis le corps de la requête

  const event = await EventList.findById(eventId);
  if (!event) {
    return res.status(404).json({ message: "Événement non trouvé." });
  }

  if (event.createdBy.toString() !== userId) {
    return res.status(403).json({ message: "Vous n'avez pas la permission de modifier cet événement." });
  }

  next(); // Si l'utilisateur est le propriétaire, passer au middleware suivant
};

