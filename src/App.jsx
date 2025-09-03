import React, { useState } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { GameProvider, useGame } from "./contexts/GameContext";
import { Toaster } from "./components/ui/toaster";
import Game from "./components/Game";
import PlayerSetup from "./components/PlayerSetup";

const AppContent = () => {
  const { player } = useGame();
  const [showSetup, setShowSetup] = useState(!player);

  const handlePlayerCreated = (createdPlayer) => {
    console.log("Player created:", createdPlayer);
    setShowSetup(false);
  };

  if (showSetup || !player) {
    return <PlayerSetup onPlayerCreated={handlePlayerCreated} />;
  }

  return <Game />;
};

function App() {
  return (
    <div className="App">
      <GameProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<AppContent />} />
          </Routes>
        </BrowserRouter>
        <Toaster />
      </GameProvider>
    </div>
  );
}

export default App;


