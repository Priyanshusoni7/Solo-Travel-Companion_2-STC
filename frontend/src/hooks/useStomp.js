import { useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { API_BASE_URL } from '../api/client';

/**
 * Connects to the backend's STOMP endpoint (<API_BASE_URL>/ws, SockJS) using the logged-in session cookie,
 * exactly like the old chat.js/main.js did, and reconnects automatically (5s).
 *
 * @param {(client: Client) => void} onConnect  subscribe/send here; called on every (re)connect
 * @returns {{ connected: boolean, error: boolean, publish: (destination, body) => boolean }}
 */
export default function useStomp(onConnect, enabled = true) {
  const clientRef = useRef(null);
  const onConnectRef = useRef(onConnect);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(false);

  onConnectRef.current = onConnect;

  useEffect(() => {
    if (!enabled) return undefined;

    const client = new Client({
      // SockJS sends the session cookie to the API origin (allowed by the backend's CORS/origin config)
      webSocketFactory: () => new SockJS(`${API_BASE_URL}/ws`),
      reconnectDelay: 5000,
      debug: () => {},
      onConnect: () => {
        setConnected(true);
        setError(false);
        onConnectRef.current?.(client);
      },
      onStompError: () => setError(true),
      onWebSocketError: () => setError(true),
      onWebSocketClose: () => setConnected(false),
    });

    client.activate();
    clientRef.current = client;

    return () => {
      clientRef.current = null;
      client.deactivate();
    };
  }, [enabled]);

  const publish = (destination, body) => {
    const client = clientRef.current;
    if (!client || !client.connected) return false;
    client.publish({ destination, body: JSON.stringify(body) });
    return true;
  };

  return { connected, error, publish };
}
