var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var index = require('./routes/index');
var users = require('./routes/users');
var app = express();
var http = require('http');
var boardConfig = require("./config/board.js");

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

var COLORS = {
    "red": "#fd5c63",
    "yellow": "#ffd900",
    "blue": "#61b3de",
    "black": "black"
};

var TEAMS = [
    {
        name: "Red Team",
        color: COLORS.red
    },
    {
        name: "Yellow Team",
        color: COLORS.yellow
    },
    {
        name: "Blue Team",
        color: COLORS.blue
    }
];

function randomIntFromInterval(min,max)
{
    return Math.floor(Math.random()*(max-min+1)+min);
}

/**
 * Create HTTP server.
 */
var server = http.createServer(app);
var io = require('socket.io').listen(server);
var playerCount = 0;
var board = [];
var players = [];

for(var row = 0; row < boardConfig.boardSize; row ++){
    board[row] = [];
    for(var col = 0; col < boardConfig.boardSize; col ++){
        board[row][col]  = COLORS.black
    }
}

io.sockets.on('connection', function (socket) {
    playerCount++;
    console.log('Total ' + playerCount + ' connected!');
    var player = {
        "id": playerCount,
        "name": "Player" + playerCount,
        "team": TEAMS[randomIntFromInterval(0, 2)],
        "score":0
    };

    players[player.id] = player;

    socket.on('cell_click', function (cell, player) {
        board[cell.row][cell.col] = player.team.color;
        temp = players[player.id];
        if(temp !== undefined){
            temp.score++;
            players[player.id] = temp;
        }
        io.emit('cell_click', cell, player, players);
    });
    io.emit('init', player, boardConfig, board, players);
});

module.exports = {
    "app": app,
    "server": server
};