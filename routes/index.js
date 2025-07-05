var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

/* GET test API endpoint */
router.get('/test', function(req, res) {
  res.json({ status: 'success', message: 'This is a test API endpoint' });
});

module.exports = router;
