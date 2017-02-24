var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var index = require('./routes/index');
var join = require('./routes/join');
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

app.use('/play', index);
app.use('/', join);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    res.writeHead(301,
        {Location: '/'}
    );
    res.end();
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

function randomIntFromInterval(min,max)
{
    return Math.floor(Math.random()*(max-min+1)+min);
}

function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++ ) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

/**
 * Create HTTP server.
 */
var server = http.createServer(app);
var io = require('socket.io').listen(server);
var playerCount = 0;
var board = [];
var players = [];
var playerName;
var totalFruit = 0;
var totalPumpkin = 0;


for(var row = 0; row < boardConfig.boardSize; row ++){
    board[row] = [];
    for(var col = 0; col < boardConfig.boardSize; col ++){
        board[row][col]  = {
            color: "#000",
            fruit:false,
            fruitNumber:0,
            pumpkin:false
        };
    }
}

io.sockets.on('connection', function (socket) {

    socket.on('start', function (username) {
        playerName = username.slice(0, 15);
        playerCount++;
        console.log('Total ' + playerCount + ' connected!');
        var player = {
            "id": playerCount,
            "name": playerName,
            "color": getRandomColor(),
            "score":0
        };

        players[player.id] = player;
        io.emit('init', player, boardConfig, board, players);
    });

    socket.on('cell_click', function (cell, player) {
        if(board[cell.row][cell.col].fruit === true){
            temp = players[player.id];
            if(temp !== undefined){
                if(board[cell.row][cell.col].color === player.color){
                    temp.score = temp.score + 3;
                }else {
                    temp.score++;
                }
                players[player.id] = temp;
            }
            board[cell.row][cell.col].fruit = false;

            var col = randomIntFromInterval(0, boardConfig.boardSize -1);
            var row = randomIntFromInterval(0, boardConfig.boardSize -1);
            if(randomIntFromInterval(1, 10) == 5){
                board[row][col].pumpkin = true;
                board[row][col].fruit = false;
                totalFruit = 0;
            }else {
                board[row][col].pumpkin = false;
                board[row][col].fruit = true;
                board[row][col].fruitNumber = randomIntFromInterval(1, 10);
            }
            board[cell.row][cell.col].color = player.color;
        }else if(board[cell.row][cell.col].pumpkin === true){
            temp = players[player.id];
            if(temp !== undefined){
                temp.score = 0;
                players[player.id] = temp;
            }
            board[cell.row][cell.col].pumpkin = false;

            var col = randomIntFromInterval(0, boardConfig.boardSize -1);
            var row = randomIntFromInterval(0, boardConfig.boardSize -1);
            if(randomIntFromInterval(1, 10) == 5){
                board[row][col].pumpkin = true;
                board[row][col].fruit = false;
                totalFruit = 0;
            }else {
                board[row][col].pumpkin = false;
                board[row][col].fruit = true;
                board[row][col].fruitNumber = randomIntFromInterval(1, 10);
            }
        }

        if(totalFruit == 0){
            var col = randomIntFromInterval(0, boardConfig.boardSize -1);
            var row = randomIntFromInterval(0, boardConfig.boardSize -1);
            board[row][col].fruit = true;
            board[row][col].fruitNumber = randomIntFromInterval(1, 10);
            totalFruit++;
        }


        io.emit('cell_click', cell, player, players, board);
    });

});

module.exports = {
    "app": app,
    "server": server
};