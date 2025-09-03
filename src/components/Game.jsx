import React from "react";
import { useGame } from "../contexts/GameContext";
import { Button } from "./ui/button";

const Game = () => {
  const { player, score, level, changeSword } = useGame();

  if (!player) {
    return <div className="text-white">Carregando jogador...</div>; // Ou redirecionar para PlayerSetup
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold mb-8">Samurai Elemental</h1>

      <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md mb-8">
        <h2 className="text-2xl font-semibold mb-4">Informações do Jogador</h2>
        <p className="text-lg">**Nome:** {player.name}</p>
        <p className="text-lg">**Vida:** {player.health}</p>
        <p className="text-lg">**Espada Atual:** {player.currentSword}</p>
        <p className="text-lg">**Pontuação:** {score}</p>
        <p className="text-lg">**Nível:** {level}</p>
      </div>

      <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-semibold mb-4">Controles e Ações</h2>
        <div className="grid grid-cols-2 gap-4">
          <Button onClick={() => changeSword("vento")} className="bg-blue-600 hover:bg-blue-700 text-white">Espada do Vento</Button>
          <Button onClick={() => changeSword("fogo")} className="bg-red-600 hover:bg-red-700 text-white">Espada do Fogo</Button>
          <Button onClick={() => changeSword("agua")} className="bg-cyan-600 hover:bg-cyan-700 text-white">Espada da Água</Button>
          <Button onClick={() => changeSword("relampago")} className="bg-yellow-600 hover:bg-yellow-700 text-white">Espada do Relâmpago</Button>
        </div>
        <p className="mt-4 text-sm text-gray-400">*Este é um protótipo básico. As ações de combate e exploração seriam implementadas aqui.*</p>
      </div>
    </div>
  );
};

export default Game;


