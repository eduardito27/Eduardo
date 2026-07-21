const cacheStorage = {};

export const getCache = (key) => {
    return cacheStorage[key] || null;
};

export const setCache = (key, data) => {
    cacheStorage[key] = data;
};

export const clearCache = (key) => {
    if (key) {
        delete cacheStorage[key];
    } else {
        // Limpiar todo el objeto
        for (let prop in cacheStorage) delete cacheStorage[prop];
    }
};