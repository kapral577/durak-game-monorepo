import React from 'react';
import { Container, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const MainMenu: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Container
      fluid
      className="d-flex flex-column justify-content-center align-items-center"
      style={{
        minHeight: '100vh',
        padding: '2rem',
        background: 'linear-gradient(135deg, #1c1c1c 0%, #343a40 100%)',
        color: 'white',
      }}
    >
      <h1
        className="mb-5 text-center"
        style={{
          fontSize: '3rem',
          fontWeight: 'bold',
          textShadow: '2px 2px 8px rgba(0,0,0,0.7)',
        }}
      >
        Durak Online
      </h1>

      <div
        className="d-flex flex-column gap-4"
        style={{ width: '100%', maxWidth: '300px', marginTop: '3rem' }}
      >
        <Button variant="light" size="lg" className="w-100" onClick={() => navigate('/setup')}>
          Играть
        </Button>
        <Button variant="light" size="lg" className="w-100" onClick={() => navigate('/friends')}>
          Друзья
        </Button>
        <Button variant="light" size="lg" className="w-100">
          Контакты
        </Button>
      </div>
    </Container>
  );
};

export default MainMenu;
