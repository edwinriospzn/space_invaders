import { GameEvent } from './GameEvent'
import { EVENT_TYPES } from './EventTypes'

export class GameEventFactory {

    static createGameStart(sessionId) {
        return new GameEvent(
            EVENT_TYPES.GAME_START,
            sessionId
        )
    }

    static createGameEnd(sessionId) {
        return new GameEvent(
            EVENT_TYPES.GAME_END,
            sessionId
        )
    }

    static createPlayerMove(sessionId, payload) {
        return new GameEvent(
            EVENT_TYPES.PLAYER_MOVE,
            sessionId,
            payload
        )
    }

    static createPlayerShot(sessionId, payload) {
        return new GameEvent(
            EVENT_TYPES.PLAYER_SHOT,
            sessionId,
            payload
        )
    }

    static createPlayerHit(sessionId, payload) {
        return new GameEvent(
            EVENT_TYPES.PLAYER_HIT,
            sessionId,
            payload
        )
    }

    static createEnemyDestroyed(sessionId, payload) {
        return new GameEvent(
            EVENT_TYPES.ENEMY_DESTROYED,
            sessionId,
            payload
        )
    }

    static createScoreUpdated(sessionId, payload) {
        return new GameEvent(
            EVENT_TYPES.SCORE_UPDATED,
            sessionId,
            payload
        )
    }

    static createTimerUpdated(sessionId, payload) {
        return new GameEvent(
            EVENT_TYPES.TIMER_UPDATED,
            sessionId,
            payload
        )
    }

}
