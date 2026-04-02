import { useState, useEffect } from "react";
import "./App.css";
import Analyze from "./components/Analyze";
import BenchmarkPanel from "./components/BenchmarkPanel";
import NavBar from "./components/NavBar";
import { FileProvider } from "./contexts/FileContext";

const App = () => {
  const [isGuiMode, setIsGuiMode] = useState(false);
  const [activeTab, setActiveTab] = useState("benchmark");

  useEffect(() => {
    // Detect GUI mode by checking if the API is available
    fetch("/api/servers")
      .then((res) => {
        if (res.ok) {
          setIsGuiMode(true);
          setActiveTab("benchmark");
        }
      })
      .catch(() => {
        setIsGuiMode(false);
        setActiveTab("analyze");
      });
  }, []);

  return (
    <div id="app">
      <FileProvider>
        <NavBar
          isGuiMode={isGuiMode}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
        {activeTab === "benchmark" && isGuiMode ? (
          <BenchmarkPanel />
        ) : (
          <Analyze />
        )}
      </FileProvider>
    </div>
  );
};

export default App;
