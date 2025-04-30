import React from 'react';
import { Navbar, Nav, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

function BottomNavbar() {
  const navigate = useNavigate();

  return (
    <Navbar
      bg="dark"
      variant="dark"
      fixed="bottom"
      style={{
        height: '60px',
        padding: '0 1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
      }}
    >
      <Nav className="align-items-center">
        <Button variant="outline-light" onClick={() => navigate('/')}>
          Главное меню
        </Button>
      </Nav>

      <Nav className="align-items-center">
        <Button variant="outline-light" onClick={() => navigate('/tables')}>
          Столы
        </Button>
      </Nav>

      <Nav className="align-items-center">
        <Button variant="outline-light" onClick={() => navigate('/friends')}>
          Друзья
        </Button>
      </Nav>
    </Navbar>
  );
}

export default BottomNavbar;
