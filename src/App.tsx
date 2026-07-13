import { useState } from "react";
import { BrowserRouter } from "react-router-dom";
import { ConfigProvider, App as AntApp } from "antd";
import { AnimatePresence } from "framer-motion";
import { appTheme } from "./theme";
import { AppShell } from "./components/AppShell";
import { SplashScreen } from "./components/SplashScreen";

export default function App() {
  const [ready, setReady] = useState(false);
  return (
    <ConfigProvider theme={appTheme}>
      <AntApp>
        <AnimatePresence>
          {!ready && <SplashScreen key="splash" onDone={() => setReady(true)} />}
        </AnimatePresence>
        <BrowserRouter>
          <AppShell />
        </BrowserRouter>
      </AntApp>
    </ConfigProvider>
  );
}
