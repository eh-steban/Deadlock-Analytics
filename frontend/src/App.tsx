import React from "react";
import "./App.css";
import Minimap from "./components/minimap/Minimap";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

const App: React.FC = () => {
  return (
    <Router>
      <div className="App">
        <h1>Deadlock Minimap</h1>
        <Minimap />
      </div>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/callback" element={<SteamCallback />} />
        <Route path="/summary" element={<PlayerSummaryPage />} />
        <Route path="/minimap" element={<MinimapPage />} />
      </Routes>
    </Router>
  );
};

export default App;
