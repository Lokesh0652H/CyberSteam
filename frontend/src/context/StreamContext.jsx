import { createContext, useContext, useEffect, useRef, useState } from "react";
import { WS_URL } from "../lib/api";

const StreamCtx = createContext(null);
export const useStream = () => useContext(StreamCtx);

const MAX = 300;

export function StreamProvider({ children }) {
  const [events, setEvents] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [connected, setConnected] = useState(false);
  const [ratePoints, setRatePoints] = useState([]);
  const wsRef = useRef(null);

  useEffect(() => {
    let alive = true;
    let retry;
    const connect = () => {
      const token = localStorage.getItem("cs_token");
      if (!token) return;
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;
      ws.onopen = () => alive && setConnected(true);
      ws.onclose = () => {
        if (!alive) return;
        setConnected(false);
        retry = setTimeout(connect, 2500);
      };
      ws.onerror = () => ws.close();
      ws.onmessage = (msg) => {
        const { type, data } = JSON.parse(msg.data);
        if (type === "event") {
          setEvents((p) => [data, ...p].slice(0, MAX));
        } else if (type === "alert") {
          setAlerts((p) => [data, ...p].slice(0, 100));
        } else if (type === "metrics") {
          setMetrics(data);
          setRatePoints((p) => [...p, {
            t: new Date().toLocaleTimeString("en-GB", { hour12: false }),
            eps: data.events_per_sec, alerts: data.alerts_generated,
          }].slice(-30));
        }
      };
    };
    connect();
    return () => { alive = false; clearTimeout(retry); wsRef.current?.close(); };
  }, []);

  return (
    <StreamCtx.Provider value={{ events, alerts, metrics, connected, ratePoints }}>
      {children}
    </StreamCtx.Provider>
  );
}
