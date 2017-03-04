var express = require('express');
var router = express.Router();
var game = require("../config/game");

/* GET home page. */
router.post('/', function(req, res, next) {

  if(isBlank(req.body.username)){
    res.writeHead(301,
        {Location: '/'}
    );
    res.end();
  }

  res.render('index', {"username": req.body.username, "game": game, "token": makeid()});
});

function isBlank(str) {
  return (!str || /^\s*$/.test(str));
}

function makeid()
{
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for( var i=0; i < 20; i++ )
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}

module.exports = router;
