var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {

  if(isBlank(req.query.username)){
    res.writeHead(301,
        {Location: '/'}
    );
    res.end();
  }

  res.render('index', {"username": req.query.username});
});

function isBlank(str) {
  return (!str || /^\s*$/.test(str));
}

module.exports = router;
