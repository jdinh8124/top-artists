require('dotenv/config');
const express = require('express');
const db = require('./database');
const ClientError = require('./client-error');
const staticMiddleware = require('./static-middleware');
const sessionMiddleware = require('./session-middleware');
const SpotifyWebApi = require('spotify-web-api-node');
const axios = require('axios');
const request = require('request'); // "Request" library
const cors = require('cors');
const querystring = require('querystring');
const cookieParser = require('cookie-parser');
const app = express();

const client_id = '730e84b51dc84b85a589f682a1ef6e7e'; // Your client id
const client_secret = '51359e0c9ecd486c830f9865bbd62d0d'; // Your secret
const redirect_uri = 'http://localhost:8888/callback'; // Your redirect uri

/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */

var generateRandomString = function (length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

var stateKey = 'spotify_auth_state';
// app.use(express.static(__dirname + '/public'))
app.use(cors())
  .use(cookieParser());
app.use(staticMiddleware);
app.use(sessionMiddleware);
app.use(express.json());

var spotifyApi = new SpotifyWebApi({
  clientId: 'fcecfc72172e4cd267473117a17cbd4d',
  clientSecret: 'a6338157c9bb5ac9c71924cb2940e1a7'
});
// spotifyApi.setAccessToken('BQANOhASlKgkj_5Ot7SQp73x3uxQh-vxnOy9M4RX0toTAy1Za2-ui35Mw_YUFPMK-eejxVp3gHk0bIzel6uG9r9yTs0A07fgVwIFzDMfZzauc9hbWLsiKjgQWTP5sJOmx4Ij576oOri3ZCcsc_eG0yenRQEKps-fBRw7NuFuGzMoNmz1DlD7AC40BHlcTBBAqspRm-PFtjYK5BTsv72dMwF1AL02-1j2yBwmQvRVSG4ei1YErpcvciAe3uT2zBNkhvwxOrz-nZ9aVic');

// 730e84b51dc84b85a589f682a1ef6e7e
// 51359e0c9ecd486c830f9865bbd62d0d
// http://localhost:8888/callback

app.get('/login', function (req, res) {
  var state = generateRandomString(16);
  res.cookie(stateKey, state);

  // your application requests authorization
  var scope = 'user-read-private user-read-email user-read-playback-state user-top-read';
  res.redirect('https://accounts.spotify.com/authorize?' +
  querystring.stringify({
    response_type: 'code',
    client_id: client_id,
    scope: scope,
    redirect_uri: redirect_uri,
    state: state
  }));
});

app.get('/callback', function (req, res) {

  // your application requests refresh and access tokens
  // after checking the state parameter

  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect('/#' +
      querystring.stringify({
        error: 'state_mismatch'
      }));
  } else {
    res.clearCookie(stateKey);
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      },
      headers: {
        Authorization: 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    };

    request.post(authOptions, function (error, response, body) {
      if (!error && response.statusCode === 200) {

        var access_token = body.access_token;
        var refresh_token = body.refresh_token;

        var options = {
          url: 'https://api.spotify.com/v1/me',
          headers: { Authorization: 'Bearer ' + access_token },
          json: true
        };

        // use the access token to access the Spotify Web API
        request.get(options, function (error, response, body) {
          console.log(body);
        });

        // we can also pass the token to the browser to make requests from there
        res.redirect('http://localhost:3000/#' +
          querystring.stringify({
            access_token: access_token,
            refresh_token: refresh_token
          }));
      } else {
        res.redirect('/#' +
          querystring.stringify({
            error: 'invalid_token'
          }));
      }
    });
  }
});

app.get('/refresh_token', function (req, res) {

  // requesting access token from refresh token
  var refresh_token = req.query.refresh_token;
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { Authorization: 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };

  request.post(authOptions, function (error, response, body) {
    if (!error && response.statusCode === 200) {
      var access_token = body.access_token;
      res.send({
        access_token: access_token
      });
    }
  });
});

app.get('/api/health-check', (req, res, next) => {
  db.query('select \'successfully connected\' as "message"')
    .then(result => res.json(result.rows[0]))
    .catch(err => next(err));
});

app.get('/api/getTop', (req, res, next) => {

  axios({
    method: 'get',
    url: 'https://api.spotify.com/v1/me/top/artists?time_range=medium_term&limit=10&offset=5',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer BQANOhASlKgkj_5Ot7SQp73x3uxQh-vxnOy9M4RX0toTAy1Za2-ui35Mw_YUFPMK-eejxVp3gHk0bIzel6uG9r9yTs0A07fgVwIFzDMfZzauc9hbWLsiKjgQWTP5sJOmx4Ij576oOri3ZCcsc_eG0yenRQEKps-fBRw7NuFuGzMoNmz1DlD7AC40BHlcTBBAqspRm-PFtjYK5BTsv72dMwF1AL02-1j2yBwmQvRVSG4ei1YErpcvciAe3uT2zBNkhvwxOrz-nZ9aVic'
    }
  })
    .then(result => res.json(result.data.items))
    .catch(err => next(err));
});

app.get('/api/artists', (req, res, next) => {
// 45eNHdiiabvmbp4erw26rg
  console.log('hello');
  spotifyApi.getArtist('45eNHdiiabvmbp4erw26rg')
    .then(result => res.json(result.body))
    .catch(err => next(err));

});

app.use('/api', (req, res, next) => {
  next(new ClientError(`cannot ${req.method} ${req.originalUrl}`, 404));
});

app.use((err, req, res, next) => {
  if (err instanceof ClientError) {
    res.status(err.status).json({ error: err.message });
  } else {
    console.error(err);
    res.status(500).json({
      error: 'an unexpected error occurred'
    });
  }
});

app.listen(process.env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log('Listening on port', process.env.PORT);
});
