import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Index from './routes/index';
import Movimentacoes from './routes/movimentacoes';
import Historico from './routes/historico';
import './styles.css';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/movimentacoes" element={<Movimentacoes />} />
          <Route path="/historico" element={<Historico />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
