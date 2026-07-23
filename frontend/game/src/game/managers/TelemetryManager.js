export class TelemetryManager {

    constructor(sessionId) {
        this.sessionId = sessionId
        this.events = []
    }

    track(event) {
        this.events.push(event)
    }

    getEvents() {
        return this.events.map(event => event.toJSON())
    }

    clear() {
        this.events = []
    }

    count() {
        return this.events.length
    }

}
