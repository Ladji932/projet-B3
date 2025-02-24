const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { 
    type: String, 
    enum: [
      "culturel", "sportif", "communautaire", "musique", "théâtre", 
      "conférence", "festival", "art", "bien-être", "éducation", 
      "technologie", "gastronomie", "environnement", "mode", "entrepreneuriat", 
      "littérature", "caritatif", "cinéma", "famille", "voyage"
    ], 
    required: true 
  },
  dateCreated: { type: Date, required: true, default: Date.now },
  dateEvent: { type: Date, required: true },
  location: { type: String, required: true },
  image: { type: Buffer },
  createdBy: { type: String, required: true }, // Stocke l'email de l'utilisateur
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "UserList", required: true }, // Stocke l'ID de l'utilisateur
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "UserList" }],
});

const EventList = mongoose.model("EventList", EventSchema);
module.exports = EventList;
