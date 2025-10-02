import React from 'react';
import './MovieNightButton.css';

const MovieNightButton = ({ onClick }) => {
  return (
    <button
      className="movie-night-button"
      onClick={onClick}
      aria-label="Киновечер в Steppe Coffee"
    >
      <span className="movie-night-icon">⚡</span>
      <span className="movie-night-text">Киновечер в Steppe Coffee</span>
    </button>
  );
};

export default MovieNightButton;
