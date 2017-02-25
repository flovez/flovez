var express = require('express');
var router = express.Router();
var game = require("../config/game");

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.render('join', {"game": game});
});

module.exports = router;
