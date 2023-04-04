require('dotenv').config()

const express = require('express')
const app = express()
const mysql = require('mysql2')
const nodemailer = require('nodemailer')
const session = require('express-session')
const passport = require('passport')
const GoogleStrategy = require('passport-google-oidc')
const path = require('path')


// Middlewares
app.use(session({
    secret: process.env.SESSION_SECRET,
    saveUninitialized: true,
    cookie: { maxAge: 86400000 },
    resave: false 
}))
app.use(passport.initialize())
app.use(passport.session())
app.use(express.json())
app.use(function(req, res, next) {
    if (!req.isAuthenticated() && req.path.indexOf('/dashboard') === 0)
		res.redirect('/')
    next()
})
app.use('/dashboard', express.static('public'))


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
        return cb(null, profile)
    }
))


// GET Paths
app.get('/', passport.authenticate('google', { scope : ['email', 'profile', 'https://www.googleapis.com/auth/user.organization.read'] }))
app.get('/redirect',
    passport.authenticate('google', { failureRedirect: '/error' }),
    function(req, res) {
		if (req.user)
			res.redirect('/dashboard')
		else
			res.redirect('/')
    }
)
app.get('/me', (req, res) => {
    console.log("Utente autenticato: " + req.user.displayName)
	res.send(req.user);
})
app.get('/logout', (req, res, next) => {
	req.logout(function(err) {
		if (err)
			return next(err)
		res.redirect('/')
	})
})


// Server listen
app.listen(process.env.PORT, () => console.log('\x1b[32m[Express] Server listening on port ' + process.env.PORT + "\x1b[0m"))
