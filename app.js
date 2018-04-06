'use strict'

var express = require('express')
var app = express()
var bodyParser = require('body-parser')
var mysql = require('mysql')
var multer = require('multer')
var argon2 = require('argon2')

require('dotenv').config()

var connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
})

connection.connect(function(err) {
  if(err) {
    console.log('Error connecting to Db')
    return
  }
  console.log('Connection established')
})

var upload = multer({dest: 'static/upload/'})

express()
  .use(express.static('static'))
  .use(express.static(__dirname + '/public'))
  .use(bodyParser.urlencoded({extended: true}))
  .set('view engine', 'ejs')
  .set('views', 'view')
  .get('/', home)
  .get('/login/', login)
  .get('/register', registerForm)
  .post('/register', register)
  .use('/error/', notFound)
  .listen(8000, console.log('Ya servah runs 🔥'))

function home(req, res) {
  res.render('index')
}

function login(req, res) {
  res.render('user/login')
}

function registerForm(req, res) {
  res.render('user/register')
}

function register(req, res, next) {
  var FirstName = req.body.FirstName
  var LastName = req.body.LastName
  var Username = req.body.Username
  var Password = req.body.Password
  var Details = req.body.Details

  connection.query('SELECT * FROM User WHERE Username = ?', Username, done)

  function done(err, data) {
    if (err) {
      next(err)
    } else if (data.length === 0) {
      argon2.hash(Password).then(onhash, next)
    } else {
      res.status(409).send('Username already in use')
    }
  }

  if (req.body.Password != req.body.Password2) {
    res.send('Your password does not match')
    return
  }

  function addUser(addUser) {
    connection.query('INSERT INTO User SET ?', {
      FirstName: FirstName,
      LastName: LastName,
      Username: Username,
      Password: Password,
      Details: Details
    }, errorCheck)

    function errorCheck(err) {
      if (err) {
        next(err)
      } else {
        // User is now registered
        res.redirect('/')
      }
    }
  }
}

function notFound(req, res) {
  res.send('errors/error', 404)
}
