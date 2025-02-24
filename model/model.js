const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  password: { 
    type: String, 
    validate: {
      validator: function(value) {
        // Le mot de passe est requis uniquement si l'utilisateur ne s'est pas connecté via Google ou Apple
        return this.googleId || this.appleId || value;
      },
      message: "Un mot de passe est requis pour les utilisateurs qui ne se connectent pas via Google ou Apple."
    }
  },
  username: {
    type: String,
  },
  participatedEvents: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EventList',
    },
  ],
  role: { 
    type: String, 
    enum: ['user', 'admin'], 
    default: 'user',
  },
  googleId: {
    type: String,
    unique: true, 
    sparse: true, // Permet d'avoir plusieurs utilisateurs sans Google ID
  },
  appleId: {
    type: String,
    unique: true, 
    sparse: true, // Permet d'avoir plusieurs utilisateurs sans Apple ID
  },
});

// Modèle exporté
const UserList = mongoose.model("UserList", UserSchema);
module.exports = UserList;
