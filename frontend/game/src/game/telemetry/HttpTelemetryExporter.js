import { TelemetryExporter } from './TelemetryExporter'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export class HttpTelemetryExporter extends TelemetryExporter {

    export(events) {
        if (events.length === 0) {
            return
        }

        return fetch(`${API_URL}/telemetry`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sessionId: events[0].sessionId,
                events
            })
        })
    }

}
