import { useState, useEffect, useRef, useCallback } from 'react';
import WebSocketManager from '../api/websocket';

export function useWebSocket(url) {
  const [data, setData] = useState([]);
  const [status, setStatus] = useState('DISCONNECTED');
  const [isPaused, setIsPaused] = useState(false);
  const managerRef = useRef(null);

  useEffect(() => {
    managerRef.current = new WebSocketManager(url);
    
    managerRef.current.onStatusChange((newStatus) => {
      setStatus(newStatus);
    });

    managerRef.current.onMessage((message) => {
      if (!isPaused) {
        setData((prevData) => {
          const newData = [message, ...prevData];
          if (newData.length > 500) {
            return newData.slice(0, 500);
          }
          return newData;
        });
      }
    });

    managerRef.current.connect();

    return () => {
      if (managerRef.current) {
        managerRef.current.disconnect();
      }
    };
  }, [url, isPaused]);

  const pause = useCallback(() => setIsPaused(true), []);
  const resume = useCallback(() => setIsPaused(false), []);
  const clear = useCallback(() => setData([]), []);

  return { data, status, isPaused, pause, resume, clear };
}
