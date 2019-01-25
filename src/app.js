const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const nunjucks = require('nunjucks');
require('dotenv').config();

const db = require('./db');
const passport = require('./passport');
const views = require('./routes/views');
const api = require('./routes/api');

const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

// Set up body-parser to let us get the body of POST requests
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Set up nunjucks to be used for rendering
nunjucks.configure('src/views', {
  autoescape: true,
  express: app
});

// Set up sessions
app.use(session({
  secret: 'session-secret',
  resave: false,
  saveUninitialized: true
}));

// Set up actual passport usage
app.use(passport.initialize());
app.use(passport.session());

// Set up login route (when you go off to login)
app.get('/auth/google', passport.authenticate('google', { scope: ['profile'] }));

// Set up login callback route (when you return from login)
app.get('/auth/google/callback',
  passport.authenticate('google', { successReturnToOrRedirect: 'back', failureRedirect: 'back', session: true})
);

// Set up logout route
app.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
});

app.use('/', views);
app.use('/api', api);
app.use('/static', express.static('public'));

// Handles 404 errors
app.use(function(req, res, next) {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// Handles other route errors
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error.html', { status: err.status, message: err.message });
});

let rooms = {};

io.on('connection', function(socket) {
  socket.on('join room', (room, user, ship) => {
    if (user !== 'anon') {
      socket.username = user.name;
      socket.taps = user.taps;
      socket.ship = ship;
    } else {
      socket.username = 'anon';
    }
    socket.room = room;
    socket.join(room);

    if (rooms.hasOwnProperty(room)) {
      rooms[room].push(socket);
    } else {
      let roomClients = [];
      roomClients.push(socket);
      rooms[room] = roomClients;
    }

    let usersInRoom = rooms[room].filter(el => el.username !== 'anon').map((el) => {
      return {
        name: el.username,
        id: el.id,
        taps: el.taps,
        ship: el.ship
      }
    })

    io.to(room).emit('user join', usersInRoom);
  });

  socket.on('handle sound', (sound, spawn, hue) => {
    io.to(socket.room).emit('handle sound', sound, spawn, hue);
  });

  socket.on('user tap', (taps) => {
    io.to(socket.room).emit('user tap', socket.id, taps)
  })

  socket.on("disconnect", () => {
    let room = socket.room;
    let clientsInRoom = rooms[room];
    clientsInRoom.splice(clientsInRoom.indexOf(socket), 1);

    io.to(room).emit('user leave', socket.id);

    for (let key in rooms) {
      if (rooms[key].length === 0) {
        delete rooms[key];
      }
    }
  });
});

http.listen(process.env.PORT || 3000, () => console.log('App listening on port 3000!'));
