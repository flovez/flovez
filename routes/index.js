var express = require('express');
var router = express.Router();

var COLORS = {
  "red": "#fd5c63",
  "yellow": "#ffd900",
  "blue" : "#61b3de"
};

var TEAMS = {
  redTeam : {
    name: "Red Team",
    color: COLORS.red
  },
  yellowTeam : {
    name: "Yellow Team",
    color: COLORS.yellow
  },
  blueTeam : {
    name: "Blue Team",
    color: COLORS.blue
  }
};

var player = {
  "name" : "Player 1",
  "team" : TEAMS.redTeam
};

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { squareSize: 8, player: player });
});

module.exports = router;
