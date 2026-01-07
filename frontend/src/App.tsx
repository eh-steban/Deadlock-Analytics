import React from "react";
import "./App.css";
import Login from "./components/login/Login";
import ProfilePage from "./components/profile/ProfilePage";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MatchAnalysis from "./pages/MatchAnalysis";
import Images from "./pages/Images";

const App: React.FC = () => {
  return (
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
        <Route
          path='/images'
          element={<Images />}
        />
      </Routes>
    </Router>
  );
};

export default App;
