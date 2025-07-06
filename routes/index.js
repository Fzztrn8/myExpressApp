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

/* GET API documentation page */
router.get('/api-docs', function(req, res) {
  res.render('api-docs');
});

module.exports = router;
