import React from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import MemeVote from "./MemeVote";
import MemeContent from "./MemeContent";
import MemeHeader from "./MemeHeader";
import MemeFooter from "./MemeFooter";
import "./App.css";

const App: React.FC = () => {
  const tokenInfo = {
    name: "GARD",
    logo: "r0THy0vN0VqEhdg8sZNBVPfu30wBwgUefdGOTsQ0SaY"
  };

  const logoURL = `https://arweave.net/${tokenInfo.logo}`;

  return (
    <HashRouter>
      <div className="App">
        <MemeHeader />
        <div className="main-content">
          <div className="logo-container">
            <img src={logoURL} alt="AO-Guard Logo" className="logo" />
          </div>
          <main className="App-main">
            <Routes>
              <Route path="/" element={<MemeContent />} />
              <Route path="/vote" element={<MemeVote />} />
            </Routes>
          </main>
        </div>
        <MemeFooter />
      </div>
    </HashRouter>
  );
};

export default App;
