export function createSessionId() {
    const timestamp = Math.floor(Date.now() / 1000)
    const randomSuffix = Math.random().toString(16).slice(2, 8)
    return `session-${timestamp}-${randomSuffix}`
}
