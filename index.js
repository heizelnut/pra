require('dotenv').config()

const express = require('express')
const app = express()
const mysql = require('mysql2')
const nodemailer = require('nodemailer')
const session = require('express-session')
const passport = require('passport')
const GoogleStrategy = require('passport-google-oidc')
const path = require('path')

let userProfile



// Middlewares
app.use(session({
    secret: process.env.SESSION_SECRET,
    saveUninitialized: true,
    cookie: { maxAge: 86400000 },
    resave: false 
}))
app.use('/dashboard', express.static('public'))
app.use(passport.initialize())
app.use(passport.session())
app.use(express.json())



// OAuth
passport.serializeUser(function(user, done) {
    done(null, user)
})
passport.deserializeUser(function(user, done) {
    done(null, user)
})
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost/redirect"
    }, function(issuer, profile, cb) {
        userProfile=profile
        return cb(null, userProfile)
    }
))



//GET Paths
app.get('/', passport.authenticate('google', { scope : ['email', 'profile', 'https://www.googleapis.com/auth/user.organization.read'] }))
app.get('/redirect',
    passport.authenticate('google', { failureRedirect: '/error' }),
    function(req, res) {
        // console.log(req)
        res.redirect('/dashboard')
    }
)
app.get('/me', (req, res) => {
	res.setHeader("Content-Type", "application/json")
    console.log(req.user)
	res.send(req.user);
})



//Server listen
app.listen(process.env.PORT, () => console.log('\x1b[32m[Express] Server listening on port ' + process.env.PORT + "\x1b[0m"))