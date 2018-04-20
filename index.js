var express = require('express');
var app = express();
var port = process.env.PORT || 4000;

app.use(express.static('public'))
// set the view engine to ejs
app.set('view engine', 'ejs')

app.get('/', function (req, res) {
  res.render('home');
});


app.listen(port, function () {
  console.log('Gamechanger listening on port ' + port);
});
