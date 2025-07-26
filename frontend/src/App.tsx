import React from "react";
import "./App.css";
import Minimap from "./components/minimap/Minimap";
import Login from "./components/login/Login";
import ProfilePage from "./components/profile/ProfilePage";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

const App: React.FC = () => {
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/auth/login" element={<Login />} />
          <Route path="/profile/:steam_id" element={<ProfilePage />} />
          <Route path="/match/analysis/:match_id" element={<Minimap />} />
        </Routes>
      </Router>
    </div>
  );
};

export default App;
