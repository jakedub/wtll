import React, { useState, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import Navigation from './components/Shared/Navigation';
import Dashboard from './components/Shared/Dashboard';
import PlayerDetails from './components/Players/PlayerDetails';
import EvaluationDashboard from './components/Evaluations/EvaluationDashboard';
import EvaluationChart from './components/Evaluations/EvaluationChart';
import TeamDashboard from './components/Teams/TeamDashboard';
// import EvaluationDetail from './components/Evaluations/EvaluationDetail';
import PlayersDashboard from './components/Players/PlayerDashboard';
import DraftDashboard from './components/Draft/DraftDashboard';
import AddressDashboard from './components/AddressValidation/AddressDashboard';
import Geocode from './components/AddressValidation/Geocode';
import './App.css';
import EvaluationForm from './components/Evaluations/EvaluationForm';
import DraftDetail from './components/Draft/DraftDetail';
import DraftForm from './components/Draft/DraftForm';
import TeamForm from './components/Teams/TeamForm';

function App() {
  // Dark mode state lifted to App level
  const [darkMode, setDarkMode] = useState(false);

  const theme = useMemo(
    () => createTheme({ palette: { mode: darkMode ? 'dark' : 'light' } }),
    [darkMode]
  );

  const toggleDarkMode = () => setDarkMode(!darkMode);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <div className="app-container">
          {/* Navigation bar with darkMode state and toggle */}
          <Navigation darkMode={darkMode} toggleDarkMode={toggleDarkMode} />

          {/* Main content */}
          <div className="main-content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/players" element={<PlayersDashboard />} />
              <Route path="/players/:id" element={<PlayerDetails />} />
              <Route path="/evaluations" element={<EvaluationDashboard />} />
              <Route path="/evaluations/add" element={<EvaluationForm />} />
              <Route path="/evaluations/:id/edit" element={<EvaluationForm />} />
              <Route path="/evaluations/chart" element={<EvaluationChart />} />
              <Route path="/teams" element={<TeamDashboard />} />
              <Route path="/teams/:teamId" element={<TeamForm />} />
              <Route path="/geocode" element={<Geocode />} />
              <Route path="/address-validation" element={<AddressDashboard />} />
              <Route path="/draft-dashboard" element={<DraftDashboard />} />   
              {/* <Route path="/draft/create" element={<DraftForm />} />       */}
              <Route path="/draft/:id" element={<DraftDetail />} />            

              {/* <Route path="/evaluations/:id" element={<EvaluationDetail />} />
              
              <Route path="/players/:id/evaluations" element={<PlayersEvaluations />} />
              <Route path="/address-validation" element={<Geocode />} /> */}
            </Routes>
          </div>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;