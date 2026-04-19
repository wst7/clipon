import { MainApp } from "./app/MainApp";
import { SettingsApp } from "./app/SettingsApp";

function getUrlParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    isSettings: params.get("settings") === "true",
  };
}

function App() {
  const { isSettings } = getUrlParams();

  if (isSettings) {
    return <SettingsApp />;
  }

  return <MainApp />;
}

export default App;