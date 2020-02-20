import React from 'react';
import Header from './header';
import AllArtists from './allartists';
import Spotify from 'spotify-web-api-js';

const spotifyWebApi = new Spotify();

export default class App extends React.Component {
  constructor(props) {
    super(props);
    const params = this.getHashParams();
    this.state = {
      artists: [],
      chosenArtist: [],
      loggedIn: !!params.access_token
    };
    this.getAllArtist = this.getAllArtist.bind(this);
    this.getOneArtist = this.getOneArtist.bind(this);
    if (params.access_token) {
      spotifyWebApi.setAccessToken(params.access_token);
    }
  }

  getHashParams() {
    var hashParams = {};
    var e; var r = /([^&;=]+)=?([^&;]*)/g;
    var q = window.location.hash.substring(1);
    while (e === r.exec(q)) {
      hashParams[e[1]] = decodeURIComponent(e[2]);
    }
    return hashParams;
  }

  componentDidMount() {

  }

  getAllArtist() {
    fetch('/api/getTop').then(response => {
      return response.json();
    })
      .then(myJson => {
        this.setState({ artists: myJson });
      });
  }

  cardsReady() {
    if (this.state.artists.length > 0) {
      return <AllArtists artists={this.state.artists} />;
    }
  }

  getOneArtist() {
    fetch('/api/artists').then(response => {
      return response.json();
    });
  }

  render() {
    return (
      <>
        <Header/>
        <a href="http://localhost:8888">
          <button>Login with Spotify</button>
        </a>
      </>
    );
  }
}
