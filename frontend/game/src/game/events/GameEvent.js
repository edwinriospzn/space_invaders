export class GameEvent {

    constructor(eventType, sessionId, payload = {}) {

        if (!eventType) {
            throw new Error('GameEvent requires a non-empty eventType')
        }

        if (!sessionId) {
            throw new Error('GameEvent requires a non-empty sessionId')
        }

        if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
            throw new Error('GameEvent requires payload to be an object')
        }

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
