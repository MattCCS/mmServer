
export const union = (a, b) => {
    return new Set([...a, ...b]);
}

export const intersection = (a, b) => {
    return new Set([...a].filter(x => b.has(x)));
}

export const difference = (a, b) => {
    return new Set([...a].filter(x => !b.has(x)));
}
