// src/pages/GamePlayPage.tsx - ФРОНТЕНД - ИСПРАВЛЕНО
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Alert, Badge, Modal, ButtonGroup } from 'react-bootstrap';
import { useGame } from '../context/GameProvider';
import { Card as CardType, GameAction, Player } from '../../shared/types';

// Компонент для отображения одной карты
const GameCard: React.FC<{
  card: CardType;
  isSelected?: boolean;
  isPlayable?: boolean;
  onClick?: () => void;
  size?: 'small' | 'medium' | 'large';
}> = ({ card, isSelected, isPlayable, onClick, size = 'medium' }) => {
  const getSuitColor = (suit: string) => {
    return suit === '♥' || suit === '♦' ? 'text-danger' : 'text-dark';
  };

  const cardSizes = {
    small: { width: '35px', height: '50px', fontSize: '0.7rem' },
    medium: { width: '60px', height: '85px', fontSize: '0.9rem' },
    large: { width: '80px', height: '110px', fontSize: '1.1rem' }
  };

  return (
    <div
      className={`border rounded position-relative user-select-none ${
        isSelected ? 'border-primary border-3 bg-light' : 'border-secondary'
      } ${isPlayable ? 'border-success' : ''} ${onClick ? 'cursor-pointer' : ''}`}
      style={{
        ...cardSizes[size],
        backgroundColor: isSelected ? '#e3f2fd' : '#ffffff',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        transform: isSelected ? 'translateY(-5px)' : 'none'
      }}
      onClick={onClick}
    >
      <div className="d-flex flex-column justify-content-between h-100 p-1">
        <div className={`fw-bold text-center ${getSuitColor(card.suit)}`} style={{ fontSize: cardSizes[size].fontSize }}>
          {card.rank}
        </div>
        <div className={`text-center ${getSuitColor(card.suit)}`} style={{ fontSize: '1.2em' }}>
          {card.suit}
        </div>
        <div 
          className={`fw-bold text-center ${getSuitColor(card.suit)}`} 
          style={{ fontSize: cardSizes[size].fontSize, transform: 'rotate(180deg)' }}
        >
          {card.rank}
        </div>
      </div>
    </div>
  );
};

// Компонент для отображения руки игрока
const PlayerHand: React.FC<{
  cards: CardType[];
  selectedCards: CardType[];
  onCardSelect?: (card: CardType) => void;
  playableCards?: CardType[];
  size?: 'small' | 'medium' | 'large';
  isCurrentPlayer?: boolean;
}> = ({ cards, selectedCards, onCardSelect, playableCards = [], size = 'medium', isCurrentPlayer = false }) => {
  return (
    <div className="d-flex flex-wrap gap-1 justify-content-center">
      {cards.map((card, index) => {
        const isSelected = selectedCards.some(c => c.suit === card.suit && c.rank === card.rank);
        const isPlayable = playableCards.some(c => c.suit === card.suit && c.rank === card.rank);
        
        return (
          <GameCard
            key={`${card.suit}-${card.rank}-${index}`}
            card={card}
            isSelected={isSelected}
            isPlayable={isCurrentPlayer && isPlayable}
            onClick={isCurrentPlayer && onCardSelect ? () => onCardSelect(card) : undefined}
            size={size}
          />
        );
      })}
    </div>
  );
};

const GamePlayPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const {
    gameState,
    currentPlayer,
    currentRoom,
    makeGameAction,
    isConnected,
    error,
    clearError
  } = useGame();

  const [selectedCards, setSelectedCards] = useState<CardType[]>([]);
  const [showExitModal, setShowExitModal] = useState(false);

  // Проверяем наличие игрового состояния
  useEffect(() => {
    if (!isConnected) return;
    
    if (!gameState || !currentRoom || currentRoom.id !== roomId) {
      console.warn('Game state not found, redirecting...');
      setTimeout(() => {
        navigate('/rooms');
      }, 2000);
    }
  }, [gameState, currentRoom, roomId, isConnected, navigate]);

  // Если нет игрового состояния
  if (!gameState || !currentPlayer || !currentRoom) {
    return (
      <Container className="py-4">
        <Row className="justify-content-center">
          <Col xs={12} md={8} lg={6}>
            <Alert variant="warning">
              <Alert.Heading>Игра не найдена</Alert.Heading>
              <p>Не удалось загрузить состояние игры.</p>
              <hr />
              <Button variant="outline-warning" onClick={() => navigate('/rooms')}>
                Вернуться к комнатам
              </Button>
            </Alert>
          </Col>
        </Row>
      </Container>
    );
  }

  // Логика игры
  const currentPlayerIndex = gameState.players.findIndex(p => p.id === currentPlayer.id);
  const isCurrentPlayerTurn = gameState.currentAttackerIndex === currentPlayerIndex || 
                              gameState.currentDefenderIndex === currentPlayerIndex;
  const isAttacker = gameState.currentAttackerIndex === currentPlayerIndex;
  const isDefender = gameState.currentDefenderIndex === currentPlayerIndex;
  
  const currentPlayerHand = gameState.players[currentPlayerIndex]?.hand || [];
  const canAttack = isAttacker && gameState.table.length === 0;
  const canDefend = isDefender && gameState.table.some(t => !t.defense);
  const canThrow = !isDefender && gameState.table.length > 0 && gameState.table.every(t => t.defense);

  // Определяем какие карты можно играть
  const getPlayableCards = (): CardType[] => {
    if (canAttack) {
      // При атаке можно ходить любой картой если стол пуст
      if (gameState.table.length === 0) {
        return currentPlayerHand;
      }
      // При подкидывании можно подкидывать карты того же ранга
      const tableRanks = gameState.table.flatMap(t => [t.attack.rank, t.defense?.rank]).filter(Boolean);
      return currentPlayerHand.filter(card => tableRanks.includes(card.rank));
    }
    
    if (canDefend) {
      // При защите можно крыть картами той же масти или козырями
      const undefendedAttacks = gameState.table.filter(t => !t.defense);
      if (undefendedAttacks.length === 0) return [];
      
      const attackCard = undefendedAttacks[0].attack;
      return currentPlayerHand.filter(card => {
        // Козырь бьет некозырь
        if (card.suit === gameState.trumpSuit && attackCard.suit !== gameState.trumpSuit) {
          return true;
        }
        // Карта той же масти большего достоинства
        if (card.suit === attackCard.suit) {
          return getCardValue(card.rank) > getCardValue(attackCard.rank);
        }
        return false;
      });
    }
    
    return [];
  };

  const getCardValue = (rank: CardType['rank']): number => {
    const values = { '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14 };
    return values[rank];
  };

  const playableCards = getPlayableCards();

  // Обработчики действий
  const handleCardSelect = (card: CardType) => {
    setSelectedCards(prev => {
      const isSelected = prev.some(c => c.suit === card.suit && c.rank === card.rank);
      if (isSelected) {
        return prev.filter(c => !(c.suit === card.suit && c.rank === card.rank));
      } else {
        // В большинстве случаев можно выбрать только одну карту
        if (canDefend) {
          return [card]; // При защите только одна карта
        }
        return [...prev, card];
      }
    });
  };

  const handleAttack = () => {
    if (selectedCards.length === 0) return;
    
    const action: GameAction = {
      type: 'attack',
      card: selectedCards[0],
      playerId: currentPlayer.id
    };
    
    makeGameAction(action);
    setSelectedCards([]);
  };

  const handleDefend = () => {
    if (selectedCards.length === 0) return;
    
    const undefendedAttack = gameState.table.find(t => !t.defense);
    if (!undefendedAttack) return;
    
    const action: GameAction = {
      type: 'defend',
      card: selectedCards[0],
      attackCard: undefendedAttack.attack,
      playerId: currentPlayer.id
    };
    
    makeGameAction(action);
    setSelectedCards([]);
  };

  const handleTake = () => {
    const action: GameAction = {
      type: 'take',
      playerId: currentPlayer.id
    };
    
    makeGameAction(action);
    setSelectedCards([]);
  };

  const handlePass = () => {
    const action: GameAction = {
      type: 'pass',
      playerId: currentPlayer.id
    };
    
    makeGameAction(action);
    setSelectedCards([]);
  };

  const handleExitGame = () => {
    setShowExitModal(false);
    navigate('/rooms');
  };

  // Порядок игроков для отображения (текущий игрок внизу)
  const orderedPlayers = useMemo(() => {
    if (currentPlayerIndex === -1) return gameState.players;
    
    const beforeCurrent = gameState.players.slice(0, currentPlayerIndex);
    const afterCurrent = gameState.players.slice(currentPlayerIndex + 1);
    const currentPlayerArray = [gameState.players[currentPlayerIndex]];
    
    return [...afterCurrent, ...beforeCurrent, ...currentPlayerArray];
  }, [gameState.players, currentPlayerIndex]);

  const getCurrentTurnInfo = () => {
    const attacker = gameState.players[gameState.currentAttackerIndex];
    const defender = gameState.players[gameState.currentDefenderIndex];
    
    if (gameState.table.length === 0) {
      return `${attacker.name} атакует`;
    } else if (gameState.table.some(t => !t.defense)) {
      return `${defender.name} защищается`;
    } else {
      return `Ход ${attacker.name}`;
    }
  };

  return (
    <Container fluid className="py-2" style={{ minHeight: '100vh' }}>
      {/* Ошибки */}
      {error && (
        <Alert variant="danger" dismissible onClose={clearError} className="mb-2">
          {error}
        </Alert>
      )}

      {/* Заголовок игры */}
      <Row className="mb-2">
        <Col>
          <Card className="bg-primary text-white">
            <Card.Body className="py-2">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="mb-0">{currentRoom.name}</h6>
                  <small className="opacity-75">{getCurrentTurnInfo()}</small>
                </div>
                <div className="d-flex align-items-center gap-2">
                  {gameState.trumpCard && (
                    <div className="text-center">
                      <small className="d-block opacity-75">Козырь</small>
                      <GameCard card={gameState.trumpCard} size="small" />
                    </div>
                  )}
                  <div className="text-center">
                    <small className="d-block opacity-75">Колода</small>
                    <Badge bg="light" text="dark">{gameState.deck.length}</Badge>
                  </div>
                  <Button variant="outline-light" size="sm" onClick={() => setShowExitModal(true)}>
                    ✕
                  </Button>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Другие игроки */}
      <Row className="mb-2">
        <Col>
          <div className="d-flex justify-content-around flex-wrap gap-2">
            {orderedPlayers.slice(0, -1).map((player, index) => {
              const isCurrentTurn = gameState.currentAttackerIndex === gameState.players.indexOf(player) ||
                                   gameState.currentDefenderIndex === gameState.players.indexOf(player);
              
              return (
                <Card 
                  key={player.id} 
                  className={`text-center ${isCurrentTurn ? 'border-warning' : ''}`}
                  style={{ minWidth: '120px' }}
                >
                  <Card.Body className="py-2">
                    <div className="d-flex align-items-center justify-content-center mb-1">
                      <div 
                        className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center me-2"
                        style={{ width: '25px', height: '25px', fontSize: '0.8rem' }}
                      >
                        {player.name.charAt(0)}
                      </div>
                      <small className="fw-bold text-truncate">{player.name}</small>
                    </div>
                    
                    {/* Показываем только количество карт */}
                    <div className="d-flex justify-content-center gap-1">
                      {Array.from({ length: Math.min(player.hand.length, 10) }).map((_, cardIndex) => (
                        <div
                          key={cardIndex}
                          className="bg-primary rounded"
                          style={{ width: '15px', height: '20px' }}
                          title={`${player.hand.length} карт`}
                        />
                      ))}
                      {player.hand.length > 10 && (
                        <small className="text-muted">+{player.hand.length - 10}</small>
                      )}
                    </div>
                    
                    <Badge 
                      bg={isCurrentTurn ? 'warning' : 'light'} 
                      text={isCurrentTurn ? 'dark' : 'muted'}
                      className="mt-1"
                    >
                      {player.hand.length}
                    </Badge>
                  </Card.Body>
                </Card>
              );
            })}
          </div>
        </Col>
      </Row>

      {/* Игровой стол */}
      <Row className="mb-3">
        <Col>
          <Card className="bg-success bg-opacity-10" style={{ minHeight: '120px' }}>
            <Card.Body className="d-flex align-items-center justify-content-center">
              {gameState.table.length === 0 ? (
                <div className="text-center text-muted">
                  <div style={{ fontSize: '2rem' }}>🃏</div>
                  <small>Стол пуст</small>
                </div>
              ) : (
                <div className="d-flex flex-wrap gap-3 justify-content-center">
                  {gameState.table.map((tableCard, index) => (
                    <div key={index} className="d-flex align-items-center gap-2">
                      <GameCard card={tableCard.attack} size="medium" />
                      {tableCard.defense ? (
                        <>
                          <span className="text-muted">→</span>
                          <GameCard card={tableCard.defense} size="medium" />
                        </>
                      ) : (
                        <div 
                          className="border border-dashed rounded d-flex align-items-center justify-content-center text-muted"
                          style={{ width: '60px', height: '85px' }}
                        >
                          ?
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Рука текущего игрока */}
      <Row className="mb-2">
        <Col>
          <Card>
            <Card.Header className="py-2">
              <div className="d-flex justify-content-between align-items-center">
                <small className="fw-bold">Ваши карты ({currentPlayerHand.length})</small>
                {isCurrentPlayerTurn && (
                  <Badge bg="warning" text="dark">Ваш ход</Badge>
                )}
              </div>
            </Card.Header>
            <Card.Body className="py-2">
              <PlayerHand
                cards={currentPlayerHand}
                selectedCards={selectedCards}
                onCardSelect={handleCardSelect}
                playableCards={playableCards}
                isCurrentPlayer={true}
              />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Кнопки действий */}
      <Row>
        <Col>
          <Card>
            <Card.Body className="py-2">
              <ButtonGroup className="w-100">
                {canAttack && (
                  <Button 
                    variant="danger"
                    disabled={selectedCards.length === 0 || !playableCards.some(c => 
                      selectedCards.some(s => s.suit === c.suit && s.rank === c.rank)
                    )}
                    onClick={handleAttack}
                  >
                    ⚔️ Атака
                  </Button>
                )}
                
                {canDefend && (
                  <>
                    <Button 
                      variant="success"
                      disabled={selectedCards.length === 0 || !playableCards.some(c => 
                        selectedCards.some(s => s.suit === c.suit && s.rank === c.rank)
                      )}
                      onClick={handleDefend}
                    >
                      🛡️ Крыть
                    </Button>
                    <Button variant="warning" onClick={handleTake}>
                      📥 Беру
                    </Button>
                  </>
                )}
                
                {canThrow && (
                  <Button 
                    variant="info"
                    disabled={selectedCards.length === 0}
                    onClick={handleAttack}
                  >
                    ➕ Подкинуть
                  </Button>
                )}
                
                {!canAttack && !canDefend && !canThrow && (
                  <Button variant="secondary" onClick={handlePass}>
                    ⏭️ Пас
                  </Button>
                )}
              </ButtonGroup>
              
              {selectedCards.length > 0 && (
                <div className="mt-2 text-center">
                  <small className="text-muted">
                    Выбрано карт: {selectedCards.length}
                  </small>
                  <Button 
                    variant="link" 
                    size="sm" 
                    onClick={() => setSelectedCards([])}
                    className="ms-2"
                  >
                    Очистить
                  </Button>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Модальное окно выхода */}
      <Modal show={showExitModal} onHide={() => setShowExitModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Покинуть игру?</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Вы действительно хотите покинуть игру? Ваш прогресс будет потерян.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowExitModal(false)}>
            Остаться
          </Button>
          <Button variant="danger" onClick={handleExitGame}>
            Покинуть игру
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default GamePlayPage;
