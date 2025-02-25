const express = require('express');
const helmet = require('helmet');
const mongoose = require('mongoose');
const route = require('./routes/routes');
const cors = require('cors');
const cookieParser = require('cookie-parser')
require('dotenv').config();


const app = express();
const PORT = 3002;
app.use(express.json());
app.use(express.urlencoded({ extended: true }))
app.use(helmet());
app.use(cookieParser(process.env.COOKIE_SECRET));

const dbPassword = process.env.DB_PASSWORD; 
const dbName = process.env.DB_NAME; 

uri = `mongodb+srv://ladji93:${dbPassword}@cluster0.29c8l.mongodb.net/${dbName}?retryWrites=true&w=majority`;
//const uri = `mongodb://localhost:27017/EventEase`;


mongoose.connect(uri)
  .then(() => {
    console.log('Connexion réussie à la base de données');
  })
  .catch(err => {
    console.error('Erreur de connexion à la base de données', err);
  });

app.use(cors({
    origin: ['http://localhost:5173', 'https://projet-b3-front.vercel.app'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

app.use('/api', route); 

app.listen(PORT, (err) => {
    if (err) {
        console.log("Error in server setup", err);
    } else {
        console.log("Server listening on Port", PORT);
    }
});
