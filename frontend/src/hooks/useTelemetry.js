import { useEffect, useRef } from 'react';

export function useTelemetry(sessionId) {
    const wsRef = useRef(null);
    const lastKeystrokeTimeRef = useRef(Date.now());
    const pauseIntervalRef = useRef(null);

    useEffect(() => {
        // Connect to WebSocket
        wsRef.current = new WebSocket(`ws://localhost:8000/ws/telemetry/${sessionId}`);

        wsRef.current.onopen = () => {
            console.log('Telemetry connected');
        };

        // Check for pauses > 30s
        pauseIntervalRef.current = setInterval(() => {
            const now = Date.now();
            const timeSinceLastKeystroke = now - lastKeystrokeTimeRef.current;
            if (timeSinceLastKeystroke > 30000 && timeSinceLastKeystroke < 32000) { // Send only once per 30s idle block
                sendTelemetry('keystroke_pause', { duration_ms: timeSinceLastKeystroke });
            }
        }, 2000);

        return () => {
            if (wsRef.current) wsRef.current.close();
            if (pauseIntervalRef.current) clearInterval(pauseIntervalRef.current);
        };
    }, [sessionId]);

    const sendTelemetry = (eventType, eventData) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                event_type: eventType,
                event_data: eventData
            }));
        }
    };

    const trackKeystroke = (codeDiffInfo) => {
        lastKeystrokeTimeRef.current = Date.now();
        // In a real app we might track diff chunks, but for now we track just that they're active
        // If a massive deletion happened, track it:
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
