export class GameEvent {

    constructor(eventType, sessionId, payload = {}) {
        this.eventType = eventType
        this.timestamp = new Date().toISOString()
        this.sessionId = sessionId
        this.payload = payload
    }

    toJSON() {
        return {
            eventType: this.eventType,
            timestamp: this.timestamp,
            sessionId: this.sessionId,
            payload: this.payload
        }
    }

}
