export const isClass = (x) => {
    return (typeof x === "function") && (x.prototype) && !(Object.getOwnPropertyDescriptor(x, "prototype")?.writable);
};
export const match = (a, b) => {
    if (typeof a === "object") {
        if (a === null)
            return b === null;
        if (Array.isArray(a)) {
            if (a.length !== b.length)
                return false;
            for (let i = 0; i < a.length; i++)
                if (!match(a[i], b[i]))
                    return false;
            return true;
        }
        const keysA = Object.keys(a);
        const keysB = Object.keys(b);
        if (!match(keysA, keysB))
            return false;
        for (const k in a)
            if (!match(a[k], b[k]))
                return false;
        return true;
    }
    return a === b;
};
export const isPrimitive = (obj) => typeof obj !== "object" || (obj === null);
//# sourceMappingURL=utils.js.map