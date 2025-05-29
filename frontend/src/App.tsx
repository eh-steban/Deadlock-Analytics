import React from "react";
import "./App.css";
import Minimap from "./components/Minimap";

const App: React.FC = () => {
  return (
    <div className="App">
      <h1>Deadlock Minimap</h1>
      <Minimap />
    </div>
  );
};

export default App;
