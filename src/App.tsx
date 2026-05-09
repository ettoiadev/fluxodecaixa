import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import LayoutContainer from '@/components/LayoutContainer';
import Index from './routes/index';
import Movimentacoes from './routes/movimentacoes';
import Historico from './routes/historico';
import './styles.css';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <LayoutContainer>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/movimentacoes" element={<Movimentacoes />} />
            <Route path="/historico" element={<Historico />} />
          </Routes>
        </LayoutContainer>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
