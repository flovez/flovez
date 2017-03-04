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

var server = http.createServer(app);
var io = require('socket.io').listen(server);
var playerCount = 0;
var board = [];
var players = {};
var playerName;
var fruitExists = false;
var diffs = [];
var tokens = [];

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

    socket.on('start', function (username, token) {
        playerName = username.slice(0, 15);
        console.log('Total ' + playerCount + ' connected!');
        var player = {
            "id": playerCount,
            "name": playerName,
            "color": getRandomColor(),
            "score":0,
            "last_activity": new Date()
        };

        players["p_"+playerCount] = player;
        tokens["t_"+playerCount] = token;
        playerCount++;

        //remove inactive players
        for (var key in players) {
            var tempPlayer = players[key];
            if (addMinutes(tempPlayer.last_activity, 1) < new Date()) {
                delete players["p_"+tempPlayer.id];
                delete tokens["t_"+tempPlayer.id];
            }
        }

        io.emit('init', player, boardConfig, board, players);
    });

    socket.on('cell_click', function (cell, player, token) {

        if(token === null){
            console.log("token is null");
            return false;
        }

        if(!isObject(player)){
            console.log("player is not an object");
            return false;
        }

        if(!isInt(player.id)){
            console.log("player id is not an integer");
            return false;
        }

        if(players["p_"+player.id] === null){
            console.log("player not found");
            return false;
        }

        if(token !== tokens["t_"+player.id]){
            console.log("invalid token");
            return false;
        }

        if(!isObject(cell)){
            console.log("cell is not an object");
            return false;
        }

        if(!isInt(cell.row) || !isInt(cell.col)){
            console.log("invalid cell");
            return false;
        }

        player = players["p_"+player.id];

        diffs = [];

        if(board[cell.row][cell.col].fruit === true){
            temp = players["p_"+player.id];
            if(temp !== undefined){
                if(board[cell.row][cell.col].color === player.color){
                    temp.score = temp.score + 3;
                }else {
                    temp.score++;
                    diffs.push(
                        {row: cell.row, col: cell.col, action: "change_color", color: player.color}
                    );
                }
                players["p_"+player.id] = temp;
            }

            diffs.push(
                {row: cell.row, col: cell.col, action: "remove_item"}
            );

            board[cell.row][cell.col].fruit = false;
            board = createIteamOnBoard(board);
            board[cell.row][cell.col].color = player.color;
        }else if(board[cell.row][cell.col].pumpkin === true){
            temp = players["p_"+player.id];
            if(temp !== undefined){
                temp.score = 0;
                players["p_"+player.id] = temp;
            }
            board[cell.row][cell.col].pumpkin = false;

            diffs.push(
                {row: cell.row, col: cell.col, action: "remove_item"}
            );

            board = createIteamOnBoard(board);
        }

        if(fruitExists === false){
            board = createFirstFruit(board);
            fruitExists = true;
        }

        player = players["p_"+player.id];
        io.emit('after_cell_click', player, players, board, diffs);
    });

});

function createIteamOnBoard(board){
    var col = randomIntFromInterval(0, boardConfig.boardSize -1);
    var row = randomIntFromInterval(0, boardConfig.boardSize -1);
    if(randomIntFromInterval(1, boardConfig.pumpkinIntensity) == 1 && board[row][col].fruit === false){
        board[row][col].pumpkin = true;
        fruitExists = false;
        diffs.push({row: row, col: col, action: "create_pumpkin"});
    }else if(board[row][col].fruit === false){
        board[row][col].pumpkin = false;
        board[row][col].fruit = true;
        board[row][col].fruitNumber = randomIntFromInterval(1, 10);
        diffs.push({row: row, col: col, action: "create_fruit", fruitNumber: board[row][col].fruitNumber});
    }

    return board;
}

function createFirstFruit(board){
    var col = randomIntFromInterval(0, boardConfig.boardSize -1);
    var row = randomIntFromInterval(0, boardConfig.boardSize -1);
    board[row][col].fruit = true;
    board[row][col].fruitNumber = randomIntFromInterval(1, 10);
    diffs.push({row: row, col: col, action: "create_fruit", fruitNumber: board[row][col].fruitNumber});
    return board;
}

function makeid()
{
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < 20; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

function isInt(value) {
    var x;
    if (isNaN(value)) {
        return false;
    }
    x = parseFloat(value);
    return (x | 0) === x;
}

function isObject(a) {
    return (!!a) && (a.constructor === Object);
}

function addMinutes(date, minutes) {
    return new Date(date.getTime() + minutes*60000);
}

module.exports = {
    "app": app,
    "server": server
};