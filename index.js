var express = require('express');
var app = express();
var flash = require('connect-flash');
var cookieParser = require('cookie-parser');
var session = require('express-session');
require('dotenv').load();
var qs = require('querystring');
var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
var port = process.env.PORT || 4000;

// Redirect all HTTP traffic to HTTPS
function ensureSecure(req, res, next){
  if(req.headers["x-forwarded-proto"] === "https"){
    // OK, continue
    return next();
  };
  res.redirect('https://'+req.hostname+req.url); // handle port numbers if you need non defaults
};

app.use(express.static('public'))

// set the view engine to ejs
app.set('view engine', 'ejs')

// Flash
app.use(cookieParser('keyboard cat'));
app.use(session({
  secret: 'keyboard cat',
  name: 'sid',
  resave: true,
  saveUninitialized: true,
  cookie: { maxAge: 60000 }}));
app.use(flash());

// Set Response Headers
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("X-Content-Type-Options", "nosniff");
  res.header("X-Frame-Options", "DENY");
  res.header("X-XSS-Protection", "mode=block");
  next();
});

if(process.env.NODE_ENV == 'production') {
  app.all('*', ensureSecure);
}

app.get('/', function (req, res) {
  res.render('home');
});

app.post('/', function (req, res){
  var body = '';
  req.on('data', function (data) {
    body += data;
    // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
    if (body.length > 1e6) {
      // FLOOD ATTACK OR FAULTY CLIENT, NUKE REQUEST
      req.connection.destroy();
    }

  });

  req.on('end', function () {
    var POST = qs.parse(body);

    var transporter = nodemailer.createTransport(smtpTransport({
      serice: 'gmail',
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
        auth: {
            user: process.env.EMAIL_ADDRESS,
            pass: process.env.EMAIL_PASSWORD
        }
    }));

    // Mail options
  var mailOpts = {
        from: process.env.EMAIL_ADDRESS,
        to: process.env.EMAIL_ADDRESS,
        subject: 'Gamechanger Contact Form',
        html: "Email from " + POST['contact[email]'] + '<br>' + POST['contact[message]']
    };

    transporter.sendMail(mailOpts, function (error, response) {
        if (error) {
          req.flash('error', 'Something went wrong, please try again.');
          res.locals.message = req.flash();
          res.render('home');
        }
        else {
          req.flash('success', 'Message sent, we will be in touch soon.');
          res.locals.message = req.flash();
          res.render('home');
        }
    });

  });


});


app.listen(port, function () {
  console.log('Gamechanger listening on port ' + port);
});
