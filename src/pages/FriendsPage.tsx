import React from 'react';
import { Container } from 'react-bootstrap';
import BottomNavbar from '../components/BottomNavbar';

const FriendsPage: React.FC = () => {
  return (
    <>
      <Container
        fluid
        className="d-flex flex-column justify-content-center align-items-center"
        style={{
          minHeight: '100vh',
          padding: '2rem',
          paddingBottom: '6rem',
          background: 'linear-gradient(135deg, #1c1c1c 0%, #343a40 100%)',
          color: 'white',
        }}
      >
        <h1
          style={{
            fontSize: '2.5rem',
            fontWeight: 'bold',
            textShadow: '2px 2px 8px rgba(0,0,0,0.7)',
          }}
        >
          Друзья
        </h1>
        <p style={{ marginTop: '1rem', fontSize: '1.2rem' }}>
          Здесь будет список ваших друзей.
        </p>
      </Container>

      <BottomNavbar />
    </>
  );
};

export default FriendsPage;
