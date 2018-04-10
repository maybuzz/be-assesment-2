'use strict'

var express = require('express')
var ejs = require('ejs')
var mongo = require('mongodb')
var bodyParser = require('body-parser')
var session = require('express-session')
var multer = require('multer')
var upload = multer({
  dest: 'static/uploads'
})

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
  // Wouter Lem helped me to use and create sessions
  .use(session({
    secret: "asdf",
    resave: false,
    saveUninitialized: false
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

/* to set up my mongodb database I used the mongodb server example created by Titus Worm: https://github.com/cmda-be/course-17-18/tree/master/examples/mongodb-server */
/* I also used a lot of Titus his slides from week 4 and 5: https://docs.google.com/presentation/d/1QVPTtENQ8d6td9ioNZHnbSoiilUZdsZ8n_F5naxw_Rw/edit#slide=id.g2922825c54_2_58
https://docs.google.com/presentation/d/1PfEaV-jQdqKWByca9txp38yD8LWIDEWZzldNYBMwUNI/edit */
function index(req, res) {
  res.render('login.ejs')
}

function form(req, res) {
  res.render('register.ejs')
}

function matchPreferences(req, res) {
  res.render('find.ejs', {
    session: req.session,
    page: 2
  })
}

// function to add users, send data to database and start session at login
// Wouter Lem helped me to create and work with sessions
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

// function to login
// Wouter Lem helped me to start a session when a user is logged in
function login(req, res) {
  var body = Object.assign({}, req.body)

  db.collection('users').findOne({
    username: body.username
  }, done)

  function done(err, user) {
    if (err) {
      res.status(404).render('error.ejs', {
        id: 404,
        title: 'Not found',
        detail: 'Oops, er gaat wat mis...'
      })
    } else if (user && user.password === body.password) {
      req.session.loggedIn = true
      req.session.user = user
      res.redirect('/profile/' + user._id)
    }
  }
}

// function to log out
// Wouter Lem helped me to destoy the session I started
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

// function to match profile with the id given by Mongodb
// Titus Worm en Folkert-Jan van der Pol hebben me geholpen mijn ObjectID error-loos door te geven
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

  res.render('profile.ejs', {
    user: user,
    session: req.session
  })
}

// function to delete your account
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

// function to load user-profile from database
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

// function to load results (users) from database
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
      res.render('find.ejs', {
        users: data,
        session: req.session,
        page: 0
      })
    }
  }
}

// function to set preferences to find matches using a filter
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
      res.render('find.ejs', {
        users: data,
        session: req.session,
        page: 0
      })
    }
  }
}

// function to load edit-form and load in set values
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
    res.render('find.ejs', {
      user: user,
      session: req.session,
      page: 3
    })
  }
}

// function to edit profile and send data (changes) to database
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

// Ik heb over het hele project veel samengewerkt met Nina van Bergen, Jessie Mason en Linda de Haan met hulp van Wouter Lem en Folkert van der Pol
