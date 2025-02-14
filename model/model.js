const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  username: {
    type: String,
  },
  phoneNumber: {
    type: Number,
    match: /^[0-9]+$/,
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
});

// Modèle exporté
const UserList = mongoose.model("UserList", UserSchema);
module.exports = UserList;
