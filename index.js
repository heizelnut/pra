require('dotenv').config()

const express = require('express')
const { readCSVFile } = require('./csv.js')
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
app.get('/', passport.authenticate('google', { scope : ['email', 'profile', 'https://www.googleapis.com/auth/user.organization.read', 'https://www.googleapis.com/auth/gmail.send'] }))
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
	res.send(req.user)
})
app.get('/teachers.csv', (req, res) => {
	res.sendFile(__dirname + "/teachers.csv")
})
app.get('/logout', (req, res, next) => {
	req.logout(function(err) {
		if (err)
			return next(err)
		res.redirect('/')
	})
})


// POST Paths
app.post('/send', (req, res) => {
	// Validation
	const json = req.body
	const csv = readCSVFile("./teachers.csv")
	let errorMsg = ""


	// rules:
	//   the meeting should be booked at least 5 days prior
	//   cannot have same hour if same day is selected
	//   cannot have same day if second day is selected
	//   at least 3 topics of discussion, at most 6
	//   at least 1 teac	her selected, at most 3

	const DEADLINE_PERIOD_IN_DAYS = 5
	const MIN_TOPICS = 3
	const MAX_TOPICS = 6
	const MIN_TEACHERS = 1
	const MAX_TEACHERS = 3

	let differentDays = (json.secondDay != '')
	let deadline = new Date()
	deadline.setDate(deadline.getDate() + DEADLINE_PERIOD_IN_DAYS)

	if (json.firstDay < deadline)
		errorMsg += "Il primo giorno non rispetta la deadline di " + DEADLINE_PERIOD_IN_DAYS + " giorni.<br>"
	if (differentDays && json.secondDay < deadline)
		errorMsg += "Il secondo giorno non rispetta la deadline" + DEADLINE_PERIOD_IN_DAYS + " giorni.<br>"

	if (!differentDays && (json.firstHour === json.secondHour))
		errorMsg += "La prima ora non può essere uguale alla seconda.<br>"
	if (differentDays && (json.firstDay === json.secondDay))
		errorMsg += "Il primo giorno non può essere uguale al secondo.<br>"

	let topics = json.topics.filter(text => text != '')
	if (topics.length < MIN_TOPICS)
		errorMsg += "Gli ordini del giorno devono essere minimo " + MIN_TOPICS + ".<br>"
	if (topics.length > MAX_TOPICS)
		errorMsg += "Gli ordini del giorno devono essere massimo " + MAX_TOPICS + ".<br>"

	let teachers = [...new Set(json.teachers)]
	if (teachers.length < MIN_TEACHERS)
		errorMsg += "Il numero minimo di professori deve essere " + MIN_TEACHERS + ".<br>"
	if (teachers.length > MAX_TEACHERS)
		errorMsg += "Il numero massimo di professori deve essere " + MAX_TEACHERS + ".<br>"

	if (errorMsg != '') {
		console.log(errorMsg)
		return res.status(400).send(JSON.stringify({ok: false, error: "bad request", description: errorMsg}))
	}

	for (let t of json.teachers) {
		console.log(t)
		console.log(json.teachers)
		if (t < 1 || t > csv.length) {
			console.log("not found in " + csv.length)
			errorMsg = "Professore non trovato.<br>"
			return res.status(404).json({ok: false, error: "not found", description: errorMsg})
		}
	}

	return res.json({ok: true})
})


// Server listen
app.listen(process.env.PORT, _ => console.log('\x1b[32m[Express] Server in ascolto sulla porta ' + process.env.PORT + "\x1b[0m"))
