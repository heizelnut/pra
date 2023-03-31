require('dotenv').config()

const express = require('express')
const app = express()
const mysql = require('mysql2')
const session = require('express-session')
const passport = require('passport')
const GoogleStrategy = require('passport-google-oidc')

let userProfile



// Middlewares
app.use(session({
    secret: process.env.SESSION_SECRET,
    saveUninitialized: true,
    cookie: { maxAge: 86400000 },
    resave: false 
}));
app.use(passport.initialize())
app.use(passport.session())
app.use(express.json())
app.use('/dashboard', express.static('public'))



// OAuth
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost/redirect"
    }, function(accessToken, refreshToken, profile, done) {
        userProfile=profile;
        return done(null, userProfile);
    }
))



//GET Paths
app.get('/', passport.authenticate('google', { scope : ['email', 'profile', 'https://www.googleapis.com/auth/user.organization.read'] }));
app.get('/redirect',
    passport.authenticate('google', { failureRedirect: '/error' }),
    function(req, res) {
        console.log(req.user)
        res.redirect('/dashboard');
    }
)



//Server listen
app.listen(process.env.PORT, () => console.log('\x1b[32m[Express] Server listening on port ' + process.env.PORT + "\x1b[0m"));



//DB Connection
// const db = mysql_module.createConnection({
//     host: 'riccardoconte.lol',
//     user: 'root',
//     password: 'roger7904',
//     database: 'pra_test'
// })
// db.connect((err) => {
//     if(err) {
//         console.log("\x1b[31m[MySQL2] Unable to establish database connection!" + "\x1b[0m")
//         console.log("\x1b[31m[MySQL2] Error code: " + err.code + "\x1b[0m")
//         console.log("\x1b[31m[MySQL2] " + err.sqlMessage + "\x1b[0m")
//         return
//     }
//     console.log("\x1b[32m[MySQL2] Database server connection established\x1b[0m")
// })
