"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isPrimitive = exports.match = exports.isClass = void 0;
const isClass = (x) => {
    return (typeof x === "function") && (x.prototype) && !(Object.getOwnPropertyDescriptor(x, "prototype")?.writable);
};
exports.isClass = isClass;
const match = (a, b) => {
    if (typeof a === "object") {
        if (a === null)
            return b === null;
        if (Array.isArray(a)) {
            if (a.length !== b.length)
                return false;
            for (let i = 0; i < a.length; i++)
                if (!(0, exports.match)(a[i], b[i]))
                    return false;
            return true;
        }
        const keysA = Object.keys(a);
        const keysB = Object.keys(b);
        if (!(0, exports.match)(keysA, keysB))
            return false;
        for (const k in a)
            if (!(0, exports.match)(a[k], b[k]))
                return false;
        return true;
    }
    return a === b;
};
exports.match = match;
const isPrimitive = (obj) => typeof obj !== "object" || (obj === null);
exports.isPrimitive = isPrimitive;
//# sourceMappingURL=utils.js.map