'use strict'

var express = require('express')
var ejs = require('ejs')
var mongo = require('mongodb')
var bodyParser = require('body-parser')
var session = require('express-session')
var multer = require('multer')
var upload = multer({dest: 'static/uploads'})

require('dotenv').config()

var db = null
var url = 'mongodb://' + process.env.DB_HOST + ':' + process.env.DB_PORT

mongo.MongoClient.connect(url, function(err, client) {
  if (err) {
    res.status(404).render('error.ejs', {
      id: 404,
      title: 'Not found',
      detail: 'Oops, er gaat wat mis...'
    })
  }
  db = client.db(process.env.DB_NAME)
})

express()
  .use(express.static('static'))
  .use(bodyParser.urlencoded({
    extended: true
  }))
  // Wouter Lem heeft me geholpen de session op te zetten
  .use(session({
    secret: "asdf", // secret versleuteld de cookies
    resave: false, // resave slaat gegevens op. true = data overschrijven, false = op data doorwerken
    saveUninitialized: false // saveUninitialized zorgt ervoor dat onnodige sessions niet plaatsvinden, false = session wanneer gebruiker inlogt, true = overbodige sessions
  }))
  .set('view engine', 'ejs')
  .set('views', 'views')
  .get('/', index)
  .post('/', login)

  .get('/logout', logout)

  .get('/register', form)
  .post('/register', add)

  .get('/zoeken', match)
  .post('/zoeken', updatePreferences)
  .get('/voorkeuren', matchPreferences)
  .get('/aanpassen', edit)
  .post('/aanpassen', edition)
  .get('/user', user)
  .get('/user/:id', user)
  .delete('/:id', remove)
  .get('/profile/:id', profile)
  .listen(3333)


function index(req, res) {
  res.render('login.ejs')
}

function form(req, res) {
  res.render('register.ejs')
}

function matchPreferences(req, res) {
  res.render('zoeken.ejs', {
    session: req.session,
    page: 2
  })
}

// functie om gebruiker aan te maken en gegevens naar database te sturen
// Wouter Lem heeft me geholpen om de session te starten wanneer je je account aanmaakt
function add(req, res) {
  var body = req.body

  db.collection('users').insert({
    email: req.body.email,
    password: req.body.password,
    firstname: req.body.firstname,
    lastname: req.body.lastname,
    age: req.body.age,
    place: req.body.place,
    bio: req.body.bio,
    gender: req.body.gender,
    preference: req.body.preference,
    sex: req.body.sex,
    relationship: req.body.relationship
  }, done)

  function done(err, data) {
    if (err) {
      res.status(404).render('error.ejs', {
        id: 404,
        title: 'Not found',
        detail: 'Oops, er gaat wat mis...'
      })
    } else {
      var user = data.ops[0]
      req.session.loggedIn = true
      req.session.user = user
      res.redirect('/profile/' + user._id)
    }
  }
}

// functie om in te loggen
// Wouter Lem heeft me geholpen om de session te starten wanneer je inlogt
function login(req, res) {
  var body = Object.assign({}, req.body)

  db.collection('users').findOne({
    username: body.username
  }, done)

  function done(err, user) {
    if(err) {
      res.status(404).render('error.ejs', {
        id: 404,
        title: 'Not found',
        detail: 'Oops, er gaat wat mis...'
      })
    } else if (user && user.password === body.password){
      req.session.loggedIn = true
      req.session.user = user
      res.redirect('/profile/' + user._id)
    }
  }
}

// functie om uit te logged
// Wouter Lem heeft me geholpen met session maken en destroyen
function logout(req, res) {
  var data = {
    session: req.session.user,
    data: []
  }

  req.session.destroy(done)

  function done(err) {
    if (err) {
      res.status(404).render('error.ejs', {
        id: 404,
        title: 'Not found',
        detail: 'Oops, er gaat wat mis...'
      })
    } else {
      data.session = null
      res.render('login.ejs')
    }
  }
}

// functie om profiel met goede id te laden
// Titus Worm heeft me geholpen mijn ObjectID error-loos door te geven
function profile(req, res, next) {
  var mongoID

  try {
    mongoID = new mongo.ObjectID(req.params.id)

  } catch (err) {
    return next()
  }

  db.collection('users').findOne({
    _id: mongoID
  }, done)

  function done(err, user) {
    if (err) {

    }

    res.render('profile.ejs', {
      user: user,
      session: req.session
    })
  }
}

// functie om gebruiker te verwijderen uit de database
function remove(req, res) {
  var id = req.params.id

  db.collection('users').deleteOne({
    _id: new mongo.ObjectID(id)
  }, done)

  function done(err, data) {
    if (err) {
      res.status(404).render('error.ejs', {
        id: 404,
        title: 'Not found',
        detail: 'Oops, er gaat wat mis...'
      })
    } else {
      res.redirect('/')
    }
  }
}

// functie om gebruiker uit de database te laden
function user(req, res) {
  var id = req.params.id
  db.collection('users').findOne({
    _id: new mongo.ObjectID(id)
  }, done)

  function done(err, data) {
    if (err) {
      res.status(404).render('error.ejs', {
        id: 404,
        title: 'Not found',
        detail: 'Oops, er gaat wat mis...'
      })
    } else {
      res.render('user.ejs', {
        user: data,
        session: req.session,
      })
    }
  }
}

// functie om resultaten (gebruikers) te laden
function match(req, res) {
  db.collection('users').find().toArray(done)

  function done(err, data) {
    if (err) {
      res.status(404).render('error.ejs', {
        id: 404,
        title: 'Not found',
        detail: 'Oops, er gaat wat mis...'
      })
    } else {
      res.render('zoeken.ejs', {
        users: data,
        session: req.session,
        page: 0
      })
    }
  }
}

// functie om voorkeuren door te geven en te filteren
function updatePreferences(req, res) {
  db.collection('users').find({
    gender: req.body.gender
  }).toArray(done)

  function done(err, data) {
    if (err) {
      res.status(404).render('error.ejs', {
        id: 404,
        title: 'Not found',
        detail: 'Oops, er gaat wat mis...'
      })
    } else {
      res.render('zoeken.ejs', {
        users: data,
        session: req.session,
        page: 0
      })
    }
  }
}

// functie om aanpasformulier te laden en ingestelde gegevens in te laden
function edit(req, res) {
  var id = req.session.user._id
  db.collection('users').findOne({
    _id: new mongo.ObjectID(id)
  }, done)

  function done(err, user) {
    if (err) {
      res.status(404).render('error.ejs', {
        id: 404,
        title: 'Not found',
        detail: 'Oops, er gaat wat mis...'
      })
    }
    res.render('zoeken.ejs', {
      user: user,
      session: req.session,
      page: 3
    })
  }
}

// functie om profiel aan te passen en gegevens doorgeven aan database
function edition(req, res) {
  var id = req.session.user._id

  db.collection('users').updateOne({
    _id: new mongo.ObjectID(id)
  }, {
    $set: {
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      place: req.body.place,
      bio: req.body.bio
    }
  }, done)

  function done(err, data) {
    if (err) {
      res.status(404).render('error.ejs', {
        id: 404,
        title: 'Not found',
        detail: 'Oops, er gaat wat mis...'
      })
    } else {
      res.redirect('/profile/' + id)
    }
  }
}
