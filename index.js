const mysql_module = require("mysql2")
const express = require("express")
const session = require('express-session');
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
const passport = require('passport');

const app = express()
const port = process.env.PORT || 3000

const CLIENT_ID = '285067580089-5ouscqf9s5aibk671jfeidfbc324tate.apps.googleusercontent.com'
const CLIENT_SECRET = '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'

let userProfile, user

app.use(session({
    resave: false,
    saveUninitialized: true,
    secret: 'SECRET' 
}));

app.get('/', function(req, res) {
    res.redirect('/auth')
});
app.listen(port , () => console.log('\x1b[32m[Express] Server listening on port ' + port + "\x1b[0m"));

app.use(passport.initialize())
app.use(passport.session())

app.get('/success', (req, res) => res.send(userProfile))
app.get('/error', (req, res) => res.send("error logging in"))

passport.serializeUser(function(user, cb) {
    cb(null, user)
})

passport.deserializeUser(function(obj, cb) {
    cb(null, obj)
})

passport.use(new GoogleStrategy({
        clientID: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
        callbackURL: "http://localhost:3000/callback"
    },
  function(accessToken, refreshToken, profile, done) {
      userProfile=profile;
      return done(null, userProfile);
    }
))

app.get('/auth', passport.authenticate('google', { scope : ['email', 'profile', 'https://www.googleapis.com/auth/user.organization.read'] }))
app.use(express.json())
app.get('/callback',
    passport.authenticate('google', { failureRedirect: '/error' }),
    function(req, res) {
        console.log(req.session.passport.user._json)
        res.redirect('/dashboard');
    }
)

app.use('/dashboard', express.static('public'))

// app.use(express.json())
app.post('/', (req, res) => {
    console.log(req.body)
})
app.get('/', (req, res) => {})

const mysql = mysql_module.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'fermi',
    database: 'pra_test'
})
mysql.connect((err) => {
    if(err) {
        console.log("\x1b[31m[MySQL2] Unable to establish database connection!" + "\x1b[0m")
        console.log("\x1b[31m[MySQL2] Error code: " + err.code + "\x1b[0m")
        console.log("\x1b[31m[MySQL2] " + err.sqlMessage + "\x1b[0m")
        return
    }
    console.log("\x1b[32m[MySQL2] Database server connection established\x1b[0m")
})
