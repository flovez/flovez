var express = require('express');
var router = express.Router();

/* GET home page. */
router.post('/', function(req, res, next) {

  if(isBlank(req.body.username)){
    res.writeHead(301,
        {Location: '/'}
    );
    res.end();
  }

  res.render('index', {"username": req.body.username});
});

function isBlank(str) {
  return (!str || /^\s*$/.test(str));
}

module.exports = router;
