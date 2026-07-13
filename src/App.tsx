import { useEffect, useState } from "react";
import { BrowserRouter } from "react-router-dom";
import { ConfigProvider, App as AntApp } from "antd";
import { AnimatePresence } from "framer-motion";
import { getTheme, type Mode } from "./theme";
import { useSetting } from "./hooks/useSettings";
import { AppShell } from "./components/AppShell";
import { SplashScreen } from "./components/SplashScreen";

export default function App() {
  const [ready, setReady] = useState(false);
  const mode = useSetting("themeMode") as Mode;
  const resolved: Mode = mode === "light" ? "light" : "dark";

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", resolved);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", resolved === "dark" ? "#08080a" : "#7c5cfc");
  }, [resolved]);

  return (
    <ConfigProvider theme={getTheme(resolved)}>
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
