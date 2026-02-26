import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { Welcome } from './pages/Welcome';
import { CityMap } from './components/city/CityMap';
import { NetworkMonitor } from './components/monitor/NetworkMonitor';
import { SecurityLab } from './components/security/SecurityLab';
import { ChallengesPage } from './components/challenges/ChallengesPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppShell />}>
          <Route index element={<Welcome />} />
          <Route path="map" element={<CityMap />} />
          <Route path="monitor" element={<NetworkMonitor />} />
          <Route path="security" element={<SecurityLab />} />
          <Route path="challenges" element={<ChallengesPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
