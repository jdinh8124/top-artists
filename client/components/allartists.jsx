import React from 'react';
import ArtistCards from './artistcards';

export default class AllArtists extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
    this.renderCards = this.renderCards.bind(this);
  }

  renderCards() {
    if (this.props.artists.length > 10) {

      const cards = [];
      for (let i = 0; i < 10; i++) {
        const card = <ArtistCards img={this.props.artists[i]} />;
        cards.push(card);
      }

      return cards;
    }
  }

  render() {
    const elements = this.renderCards();
    return (
      <main className="d-flex flex-wrap  justify-content-center mt-3">
        <div className="card-group">

          {elements}
        </div>
      </main>
    );
  }
}
