'use strict'

var express = require('express')
var ejs = require('ejs')
var mongo = require('mongodb')
var bodyParser = require('body-parser')
var slug = require('slug')
var session = require('express-session')
var multer = require('multer')
var upload = multer({dest: 'static/uploads'})
var ObjectID = require('mongodb').ObjectID

require('dotenv').config()

var db = null
var url = 'mongodb://' + process.env.DB_HOST + ':' + process.env.DB_PORT

mongo.MongoClient.connect(url, function (err, client) {
  if (err) throw err
  db = client.db(process.env.DB_NAME)
})

express()
.use(express.static('static'))
.use(bodyParser.urlencoded({extended: true}))
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
// .post('/upload', upload.single('profilepic'), add)
.get('/zoeken', match)
.post('/zoeken', updatePreferences)
.get('/voorkeuren', matchPreferences)

.get('/aanpassen', edit)
.post('/aanpassen', edition)

.get('/user', user)
.get('/user/:id', user)

.delete('/:id', remove)
.get('/:id', profile)
.use(errorFunc)
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
      page: 4
    })
}

function add(req, res, next) {
  // req.body.profilepic = req.file.filename
  db.collection('users').insert(req.body, done)

  function done(err, data) {
    if (err) {
      next(err)
    } else {
      var user = data.ops[0]
      req.session.loggedIn = true
      req.session.user = user
      res.redirect('/' + user._id)
    }
  }
}

function login(req, res) {
  var body = Object.assign({}, req.body)
  // object.assign = consturctor, eerste argument is het object waar we alles in plakken. Alle parameters samenvoegen en 1 object van maken. {} om leeg te beginnen. Kan ook een variabelen of iets in, blijft wel een eigen object.
  db.collection('users').findOne({username: body.username}, function(err, user){
    // deze functie is de callback van findOne, find zoekt alles, findOne zoekt naar 1. Zie nodejs mongodb .find etc.
    // dmv. username: body.username zoek ik binnen de database naar objecten met deze propertyname
    if (err) throw err

    if (user && user.password === body.password){ // dit is het inlog gedeelte
      req.session.loggedIn = true
      req.session.user = user
      // checkt welke gebruiker ingelogd is
      res.redirect('/' + user._id)
    } else {
      res.redirect('/')
  }
})
}

function logout(req, res) {
    var data = {
        session: req.session.user,
        data: []
    }

    req.session.destroy(function (err) {
        if (err) {
            console.log('Er is een probleem met uitloggen')
        } else {
            data.session = null
            res.render('login.ejs')
        }
    })
}

function profile(req, res) {

  var mongoID = new ObjectID(req.params.id)

  db.collection('users').findOne({_id: mongoID}, done)

  function done(err, user) {
    if (err) throw err

    res.render('profile.ejs', {
      user: user,
      session: req.session })
  }
}

function remove(req, res) {
  var id = req.params.id

  db.collection('users').deleteOne({_id: new mongo.ObjectID(id)}, done)

  function done(err, data) {
    if (err) {
      next(err)
    } else {
      res.redirect('/')
    }
  }
}

function user(req, res) {
  var id = req.params.id
  db.collection('users').findOne({_id: new mongo.ObjectID(id)}, done)

  function done(err, data) {
    if (err) {
      console.log(err)
    } else {
      res.render('user.ejs', {
        user: data,
        session: req.session,
      })
    }
  }
}

function match(req, res) {
  db.collection('users').find().toArray(done)

  function done(err, data) {
    if (err) {
      next(err)
    } else {
      res.render('zoeken.ejs', {
        users: data,
        session: req.session,
        page: 0
      })
    }
  }
}

function updatePreferences(req, res) {
  db.collection('users').find({
    gender: req.body.gender
  }).toArray(done)

  function done(err, data) {
    if (err) {
      next(err)
    } else {
      res.render('zoeken.ejs', {
        users: data,
        session: req.session,
        page: 0
      })
  }
}
}

function edit(req, res) {
  var id = req.session.user._id
  db.collection('users').findOne({_id: new mongo.ObjectID(id)}, done)

  function done(err, user) {
    if (err) {
      next(err)
    }
    res.render('zoeken.ejs', {
        user: user,
        session: req.session,
        page: 5
    })
  }
}

function edition(req, res) {
  var id = req.session.user._id

  db.collection('users').updateOne({_id: new mongo.ObjectID(id)},
    { $set:
      {
        firstname: req.body.firstname,
        lastname: req.body.lastname,
        place: req.body.place,
        bio: req.body.bio
      }
   },

  function done(err, data) {
    if (err) {
      next(err)
    }

    res.redirect('/' + id)
})
}

function errorFunc(err, req, res, next){
  console.log(err)
}
