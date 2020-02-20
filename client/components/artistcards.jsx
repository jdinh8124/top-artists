import React from 'react';

export default function ArtistCards(props) {

  return (
    <div className="card w-75" >
      <img className="card-img-top" src={props.img} alt="Card image cap"/>
      <div className="card-body">
        <p className="card-text"></p>
      </div>
    </div>

  );
}
