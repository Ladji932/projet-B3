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

console.log(process.env.COOKIE_SECRET)

mongoose.connect('mongodb://localhost:27017/fil-rouge')
.then(() => console.log("connected"))
.catch(err => console.log("MongoDB connection error:", err));


app.use(cors({
    origin: 'http://localhost:5173',
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
