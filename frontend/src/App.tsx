import React from "react";
import "./App.css";
import Login from "./components/login/Login";
import ProfilePage from "./components/profile/ProfilePage";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MatchAnalysis from "./components/matchAnalysis/MatchAnalysis";

const App: React.FC = () => {
  return (
    <div className='App flex min-h-screen'>
      <Router>
        <Routes>
          <Route
            path='/'
            element={<Login />}
          />
          <Route
            path='/profile/:steam_id'
            element={<ProfilePage />}
          />
          <Route
            path='/match/analysis/:match_id'
            element={<MatchAnalysis />}
          />
        </Routes>
      </Router>
    </div>
  );
};

export default App;
