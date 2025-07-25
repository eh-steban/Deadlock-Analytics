import React from "react";
import "./App.css";
import Minimap from "./components/minimap/Minimap";
import Login from "./components/login/Login";
import ProfilePage from "./components/profile/ProfilePage";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

const App: React.FC = () => {
  return (
    <Router>
      {/* <div className="App">
        <h1>Deadlock Minimap</h1>
        <Minimap />
      </div> */}
      <Routes>
        <Route path="/auth/login" element={<Login />} />
        <Route path="/profile/:steam_id" element={<ProfilePage />} />
      </Routes>
    </Router>
  );
};

export default App;
