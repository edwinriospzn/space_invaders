import { TelemetryExporter } from './TelemetryExporter'

export class ConsoleTelemetryExporter extends TelemetryExporter {

    export(events) {
        console.log('==========================')
        console.log('Telemetry Export')
        console.log('==========================')
        console.log('')
        console.log('Session:')
        console.log(events[0] ? events[0].sessionId : 'unknown')
        console.log('')
        console.log('Events:')
        console.log(events.length)
        console.log('')
        console.log(events)
    }

}
