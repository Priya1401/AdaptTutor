import { useEffect, useRef, useCallback } from 'react';

export function useTelemetry(sessionId) {
    const wsRef = useRef(null);
    const lastKeystrokeTimeRef = useRef(Date.now());
    const pauseIntervalRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);
    const isUnmountedRef = useRef(false);

    const sendTelemetry = (eventType, eventData) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                event_type: eventType,
                event_data: eventData
            }));
        }
    };

    const connect = useCallback(() => {
        if (isUnmountedRef.current || !sessionId) return;

        const ws = new WebSocket(`ws://localhost:8000/ws/telemetry/${sessionId}`);
        wsRef.current = ws;

        ws.onopen = () => {
            console.log('Telemetry connected');
        };

        ws.onclose = () => {
            if (!isUnmountedRef.current) {
                console.log('Telemetry disconnected, reconnecting in 3s...');
                reconnectTimeoutRef.current = setTimeout(connect, 3000);
            }
        };

        ws.onerror = () => {
            ws.close();
        };
    }, [sessionId]);

    useEffect(() => {
        if (!sessionId) return;
        isUnmountedRef.current = false;

        connect();

        // Check for keystroke pauses > 30s
        pauseIntervalRef.current = setInterval(() => {
            const now = Date.now();
            const elapsed = now - lastKeystrokeTimeRef.current;
            if (elapsed > 30000 && elapsed < 32000) { // fire once per 30s idle block
                sendTelemetry('keystroke_pause', { duration_ms: elapsed });
            }
        }, 2000);

        return () => {
            isUnmountedRef.current = true;
            if (wsRef.current) wsRef.current.close();
            if (pauseIntervalRef.current) clearInterval(pauseIntervalRef.current);
            if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        };
    }, [sessionId, connect]);

    const trackKeystroke = (codeDiffInfo) => {
        lastKeystrokeTimeRef.current = Date.now();
        if (codeDiffInfo && codeDiffInfo.isMassiveDeletion) {
            sendTelemetry('delete', { length: codeDiffInfo.charsDeleted });
        }
    };

    const trackAction = (action, details = {}) => {
        lastKeystrokeTimeRef.current = Date.now();
        sendTelemetry(action, details);
    };

    return { trackKeystroke, trackAction };
}
