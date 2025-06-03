// src/pages/GamePlayPage.tsx - РЕФАКТОРИРОВАННАЯ ВЕРСИЯ

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { useGame } from '../context/GameProvider';
import { Card as CardType, GameAction, Player } from '../shared/types';

// Подкомпоненты
import GameBoard from '../components/game/GameBoard';
import PlayerHand from '../components/game/PlayerHand';
import GameControls from '../components/game/GameControls';
import GameInfo from '../components/game/GameInfo';
import TrumpCard from '../components/game/TrumpCard';

// ===== КОНСТАНТЫ =====
const UI_TEXT = {
  LOADING_GAME: 'Загрузка игры...',
  GAME_NOT_FOUND: 'Игра не найдена',
  GAME_NOT_ACTIVE: 'Игра не активна или завершена',
  BACK_TO_ROOMS: 'Вернуться к комнатам',
  CONNECTION_ERROR: 'Ошибка соединения с сервером',
  INVALID_MOVE: 'Недопустимый ход',
  YOUR_TURN: 'Ваш ход',
  WAITING_TURN: 'Ожидание хода',
  GAME_FINISHED: 'Игра завершена',
} as const;

const GamePlayPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    gameState,
    currentPlayer,
    isConnected,
    error,
    makeGameAction,
  } = useGame();

  const [selectedCards, setSelectedCards] = useState<CardType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);

  // Проверка состояния игры
  useEffect(() => {
    if (!isConnected) return;
    
    if (!gameState) {
      const timer = setTimeout(() => setIsLoading(false), 2000);
      return () => clearTimeout(timer);
    } else {
      setIsLoading(false);
    }
  }, [isConnected, gameState]);

  // Мемоизированные вычисления
  const gameInfo = useMemo(() => {
    if (!gameState || !currentPlayer) return null;
    
    const currentPlayerInGame = gameState.players.find(p => p.id === currentPlayer.id);
    const isPlayerTurn = gameState.currentPlayerId === currentPlayer.id;
    const attackingCards = gameState.table.attackingCards || [];
    const defendingCards = gameState.table.defendingCards || [];
    
    return {
      currentPlayerInGame,
      isPlayerTurn,
      attackingCards,
      defendingCards,
      phase: gameState.phase,
      trump: gameState.trump,
    };
  }, [gameState, currentPlayer]);

  // Обработчики игровых действий
  const handleCardSelect = useCallback((card: CardType) => {
    setSelectedCards(prev => {
      const isSelected = prev.some(c => c.id === card.id);
      if (isSelected) {
        return prev.filter(c => c.id !== card.id);
      } else {
        return [...prev, card];
      }
    });
  }, []);

  const handleGameAction = useCallback(async (action: GameAction) => {
    if (!gameInfo?.isPlayerTurn) {
      setActionError(UI_TEXT.INVALID_MOVE);
      return;
    }

    try {
      setActionError(null);
      await makeGameAction(action);
      setSelectedCards([]);
    } catch (error) {
      setActionError('Ошибка выполнения хода');
    }
  }, [gameInfo?.isPlayerTurn, makeGameAction]);

  const handleAttack = useCallback(() => {
    if (selectedCards.length === 0) return;
    
    handleGameAction({
      type: 'attack',
      playerId: currentPlayer?.id || '',
      cards: selectedCards,
    });
  }, [selectedCards, currentPlayer?.id, handleGameAction]);

  const handleDefend = useCallback((attackingCard: CardType) => {
    if (selectedCards.length !== 1) return;
    
    handleGameAction({
      type: 'defend',
      playerId: currentPlayer?.id || '',
      card: selectedCards[0],
      targetCard: attackingCard,
    });
  }, [selectedCards, currentPlayer?.id, handleGameAction]);

  const handleTake = useCallback(() => {
    handleGameAction({
      type: 'take',
      playerId: currentPlayer?.id || '',
    });
  }, [currentPlayer?.id, handleGameAction]);

  const handlePass = useCallback(() => {
    handleGameAction({
      type: 'pass',
      playerId: currentPlayer?.id || '',
    });
  }, [currentPlayer?.id, handleGameAction]);

  // Loading состояние
  if (!isConnected || isLoading) {
    return (
      <Container className="py-4 text-center">
        <Spinner animation="border" className="me-2" />
        <div>
          <h4>{UI_TEXT.LOADING_GAME}</h4>
        </div>
      </Container>
    );
  }

  // Игра не найдена
  if (!gameState || !gameInfo) {
    return (
      <Container className="py-4">
        <Alert variant="danger">
          <Alert.Heading>{UI_TEXT.GAME_NOT_FOUND}</Alert.Heading>
          <p>{UI_TEXT.GAME_NOT_ACTIVE}</p>
          <button 
            className="btn btn-primary"
            onClick={() => navigate('/rooms')}
          >
            {UI_TEXT.BACK_TO_ROOMS}
          </button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container fluid className="game-container p-2">
      {/* Ошибки */}
      {(error || actionError) && (
        <Alert variant="danger" className="mb-2">
          {actionError || error}
        </Alert>
      )}

      {/* Информация об игре */}
      <Row className="mb-2">
        <Col>
          <GameInfo 
            gameState={gameState}
            currentPlayer={gameInfo.currentPlayerInGame}
            isPlayerTurn={gameInfo.isPlayerTurn}
          />
        </Col>
      </Row>

      {/* Козырная карта */}
      <Row className="mb-3">
        <Col xs="auto">
          <TrumpCard trump={gameInfo.trump} />
        </Col>
      </Row>

      {/* Игровое поле */}
      <Row className="mb-3">
        <Col>
          <GameBoard
            attackingCards={gameInfo.attackingCards}
            defendingCards={gameInfo.defendingCards}
            onDefend={handleDefend}
            canDefend={gameInfo.isPlayerTurn && gameInfo.phase === 'defend'}
            selectedCards={selectedCards}
          />
        </Col>
      </Row>

      {/* Рука игрока */}
      <Row className="mb-3">
        <Col>
          <PlayerHand
            cards={gameInfo.currentPlayerInGame?.hand || []}
            selectedCards={selectedCards}
            onCardSelect={handleCardSelect}
            trump={gameInfo.trump}
          />
        </Col>
      </Row>

      {/* Управление игрой */}
      <Row>
        <Col>
          <GameControls
            phase={gameInfo.phase}
            isPlayerTurn={gameInfo.isPlayerTurn}
            selectedCards={selectedCards}
            onAttack={handleAttack}
            onTake={handleTake}
            onPass={handlePass}
          />
        </Col>
      </Row>
    </Container>
  );
};

export default GamePlayPage;
