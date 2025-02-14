const mongoose = require('mongoose');

// Utiliser mongoose.Schema directement
const EventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { 
    type: String, 
    enum: [
      "culturel", 
      "sportif", 
      "communautaire", 
      "musique", 
      "théâtre", 
      "conférence", 
      "festival", 
      "art", 
      "bien-être", 
      "éducation", 
      "technologie", 
      "gastronomie", 
      "environnement", 
      "mode", 
      "entrepreneuriat", 
      "littérature", 
      "caritatif", 
      "cinéma", 
      "famille", 
      "voyage"
    ], 
    required: true 
  },
    dateCreated: { type: Date, required: true },
  dateEvent: { type: Date, required: true },
  location: { type: String, required: true },
  image: { type: Buffer },
  contactInfo: {
    email: { type: String },
    phone: { type: String },
  },
  createdBy: { type: String, required: true },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "UserList" }],
});

// Modèle exporté
const EventList = mongoose.model("EventList", EventSchema);
module.exports = EventList;
