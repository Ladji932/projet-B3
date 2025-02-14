const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
    const token = req.headers['authorization']?.split(' ')[1] || req.cookies.auth_token;

    if (!token) {
        console.log('Accès interdit: pas de token');
        return res.status(403).send('Accès interdit');
    }

    jwt.verify(token, process.env.SECRET_KEY, (err, user) => {
        if (err) {
            console.log('Accès interdit', err); 
            return res.status(403).send('Token invalide');
        }
        req.user = user; 
        next();  
    });
}

module.exports = authenticateToken;
