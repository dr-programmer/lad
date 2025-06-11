import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import RadialTree from './components/RadialTree';
import WorkDetails from './components/WorkDetails';

const AppContainer = styled.div`
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: #1a1a2e;
`;

const Header = styled.header`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  padding: 1rem;
  background: rgba(26, 26, 46, 0.9);
  backdrop-filter: blur(10px);
  z-index: 100;
  text-align: center;
  color: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
`;

const Title = styled.h1`
  margin: 0;
  font-size: 1.5rem;
  color: #4a90e2;
`;

// API URL configuration
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

function App() {
  const [data, setData] = useState(null);
  const [selectedWork, setSelectedWork] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/api/works`)
      .then(response => response.json())
      .then(data => setData(data))
      .catch(error => console.error('Error fetching data:', error));
  }, []);

  const handleNodeClick = (work) => {
    setSelectedWork(work);
  };

  return (
    <AppContainer>
      <Header>
        <Title>Животът и смъртта: Интерактивна карта на мотива</Title>
      </Header>
      {data && <RadialTree data={data} onNodeClick={handleNodeClick} />}
      <WorkDetails work={selectedWork} onClose={() => setSelectedWork(null)} />
    </AppContainer>
  );
}

export default App;
