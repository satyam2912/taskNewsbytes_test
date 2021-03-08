const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, './.env') });
const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser')
const mongoose = require('mongoose');
const { Schema } = mongoose;
const TinyURL = require('tinyurl');
const db = mongoose.createConnection(process.env.DB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// Basic Configuration
const port = process.env.PORT || 3000;

const urlSchema = new Schema({
  longUrl: String, // String is shorthand for {type: String}
  shortUrl: String,

});
const AllUrl = db.model('AllUrl', urlSchema);
app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.post('/api/shorturl/new', function (req, res) {
  var url = req.body.url;
  function validateUrl(url) {
    return /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:[/?#]\S*)?$/i.test(url);
  }
  var val = validateUrl(url);
  if (val == true) {
    TinyURL.shorten(url, function (shorten, err) {
      if (err) {
        console.log(err)
      } else {
        var short_url = shorten;
        var myData = new AllUrl({
          longUrl: url, // String is shorthand for {type: String}
          shortUrl: short_url,
        });
        myData.save(function (err, result) {
          if (err) {
            res.json({ status: 404, message: " Error" })
          } else {
            let str = short_url.slice(20, 28);
            res.json({ original_url: url, short_url: str });
          }
        })
      }
    });
  } else {
    res.json({ error: 'invalid url' })
  }
});


app.get('/api/hello', function (req, res) {
  res.json({ greeting: 'hello API' });
});
// Your first API endpoint
app.get('/api/shorturl/:short', function (req, res) {
  var tiny_url = 'https://tinyurl.com/';
  tiny_url += req.params.short
  AllUrl.findOne({ shortUrl: tiny_url })
    .then(function (data) {
      var redirect_url = data.longUrl;
      return res.redirect(redirect_url);
    })
    .catch(function (err) {
      return res.json({ error: 'invalid url' });
    });
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
