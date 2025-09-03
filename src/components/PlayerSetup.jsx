import React, { useState } from "react";
import { useGame } from "../contexts/GameContext";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";

const PlayerSetup = ({ onPlayerCreated }) => {
  const [playerName, setPlayerName] = useState("");
  const { createPlayer } = useGame();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (playerName.trim()) {
      createPlayer(playerName.trim());
      onPlayerCreated({ name: playerName.trim() });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle className="text-center text-white">Bem-vindo, Samurai!</CardTitle>
          <CardDescription className="text-center text-gray-400">Insira seu nome para começar sua jornada.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="text"
              placeholder="Nome do Samurai"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full bg-gray-800 text-white border-gray-700 focus:border-blue-500"
            />
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white">
              Iniciar Aventura
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlayerSetup;


