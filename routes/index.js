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

  res.render('index', {"username": req.body.username, "game": game});
});

function isBlank(str) {
  return (!str || /^\s*$/.test(str));
}

module.exports = router;
