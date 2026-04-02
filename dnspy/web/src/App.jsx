import { useState, useEffect } from "react";
import "./App.css";
import Analyze from "./components/Analyze";
import BenchmarkPanel from "./components/BenchmarkPanel";
import NavBar from "./components/NavBar";
import Footer from "./components/Footer";
import ErrorBoundary from "./components/ErrorBoundary";
import { FileProvider } from "./contexts/FileContext";
import { fetchServers } from "./services/api";

const App = () => {
  const [isGuiMode, setIsGuiMode] = useState(false);
  const [activeTab, setActiveTab] = useState("benchmark");

  useEffect(() => {
    // Detect GUI mode by checking if the API is available
    fetchServers()
      .then(() => {
        setIsGuiMode(true);
        setActiveTab("benchmark");
      })
      .catch(() => {
        setIsGuiMode(false);
        setActiveTab("analyze");
      });
  }, []);

  const handleSwitchToAnalyze = () => setActiveTab("analyze");

  return (
    <div id="app">
      <FileProvider>
        <NavBar
          isGuiMode={isGuiMode}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
        <ErrorBoundary>
          {activeTab === "benchmark" && isGuiMode ? (
            <BenchmarkPanel onSwitchToAnalyze={handleSwitchToAnalyze} />
          ) : (
            <Analyze />
          )}
        </ErrorBoundary>
        <Footer>
      </FileProvider>
    </div>
  );
};

export default App;
