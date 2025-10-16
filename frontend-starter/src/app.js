// src/App.js
import React from 'react';
import { ChakraProvider, Box } from '@chakra-ui/react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import theme from './theme';
import Layout from './components/Layout';
import Templates from './pages/Templates';

import Dashboard from './pages/Dashboard';
import AgentConfig from './pages/AgentConfig';
import ConversationView from './pages/ConversationView';
import Analysis from './pages/Analysis';
import { WebSocketProvider } from './context/WebSocketContext';
import { AppDataProvider } from './context/AppDataContext';

function App() {
  return (
    <ChakraProvider theme={theme}>
      <WebSocketProvider>
        <AppDataProvider>
          <Router>
            <Box minHeight="100vh">
              <Layout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/conversation/:id" element={<ConversationView />} />
                  <Route path="/agent-config" element={<AgentConfig />} />
                  <Route path="/templates" element={<Templates />} />
                  <Route path="/analysis" element={<Analysis />} />
                  
                  {/* Catch-all route - redirects any unknown paths to dashboard */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Layout>
            </Box>
          </Router>
        </AppDataProvider>
      </WebSocketProvider>
    </ChakraProvider>
  );
}

export default App;