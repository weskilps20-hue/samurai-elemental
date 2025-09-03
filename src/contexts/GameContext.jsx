import React, { createContext, useContext, useState } from 'react';

const GameContext = createContext();

export const GameProvider = ({ children }) => {
  const [player, setPlayer] = useState(null);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);

  const createPlayer = (name) => {
    setPlayer({ name, health: 100, currentSword: 'vento' }); // Exemplo inicial
  };

  const updateScore = (points) => {
    setScore((prevScore) => prevScore + points);
  };

  const nextLevel = () => {
    setLevel((prevLevel) => prevLevel + 1);
  };

  const changeSword = (swordType) => {
    if (player) {
      setPlayer((prevPlayer) => ({ ...prevPlayer, currentSword: swordType }));
    }
  };

  return (
    <GameContext.Provider
      value={{
        player,
        score,
        level,
        createPlayer,
        updateScore,
        nextLevel,
        changeSword,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  return useContext(GameContext);
};


