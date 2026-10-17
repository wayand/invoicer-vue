// Newer Node versions (25) ship their own incomplete localStorage, which hides
// the one jsdom provides. Tests get a plain in-memory one, so they behave the
// same on every Node version.
const memoryStorage = () => {
    const data = new Map()
    return {
        getItem: key => (data.has(String(key)) ? data.get(String(key)) : null),
        setItem: (key, value) => void data.set(String(key), String(value)),
        removeItem: key => void data.delete(String(key)),
        clear: () => data.clear(),
        key: index => [...data.keys()][index] ?? null,
        get length() {
            return data.size
        }
    }
}

const storage = memoryStorage()
for (const target of new Set([globalThis, globalThis.window])) {
    if (target) Object.defineProperty(target, 'localStorage', { value: storage, configurable: true, writable: true })
}
