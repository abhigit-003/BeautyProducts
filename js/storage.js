export function persist(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
        console.warn("Could not persist to localStorage:", e);
    }
}

export function hydrate(key) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    } catch (e) {
        console.warn("Could not hydrate from localStorage:", e);
        return null;
    }
}
