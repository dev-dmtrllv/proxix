import React from "react";
import { clone, isClass, isPrimitive, match } from "./utils";
const INTERNAL = Symbol("INTERNAL");
const CLASS_TAG = Symbol("CLASS_TAG");
const OBSERVABLES = Symbol("OBSERVABLES");
const isWrappedClass = (o) => (o[CLASS_TAG] === true);
const isState = (o) => isObject(o) && (o[INTERNAL] !== undefined);
const isObject = (o) => typeof o === "object" && o !== null;
const wrapChildProxies = (internal, state, path) => {
    for (const k in state) {
        const val = state[k];
        if (isObject(val))
            state[k] = createProxy(internal, val, [...path, k]);
    }
    ;
};
const createProxy = (internal, state, path) => {
    wrapChildProxies(internal, state, path);
    const proxy = new Proxy(state, {
        get: (target, p, _proxy) => {
            switch (p) {
                case INTERNAL:
                    return internal;
                default:
                    return target[p];
            }
        },
        set: (target, p, val, _proxy) => {
            if (match(target[p], val))
                return true;
            if (!dispatch(internal, [...path, p].join("."), val))
                return true;
            if (isObject(val))
                target[p] = createProxy(internal, val, [...path, p.toString()]);
            else
                target[p] = val;
            return true;
        }
    });
    return proxy;
};
const createInternal = (state, path, resolver = undefined) => {
    const internal = {
        initState: clone(state),
        state: null,
        dispatchers: [],
        interceptors: [],
        observers: [],
        resolver: resolver
    };
    internal.state = createProxy(internal, state, path);
    return internal;
};
const createClassInternal = (state) => {
    const internal = {
        initState: clone(state),
        state,
        dispatchers: [],
        interceptors: [],
        observers: [],
        resolver: undefined
    };
    return internal;
};
export const create = (state) => {
    return createInternal(state, []).state;
};
const createAsyncState = (data, error, isLoading, isCanceled) => {
    return {
        data,
        error,
        isLoading,
        isCanceled,
    };
};
const resolve = (internal) => {
    if (internal.resolver) {
        Object.assign(internal.state, {
            data: undefined,
            error: undefined,
            isLoading: true,
            isCanceled: false
        });
        internal.resolver().then((data) => {
            if (internal.state.isCanceled)
                return;
            Object.assign(internal.state, {
                data,
                error: undefined,
                isLoading: false,
                isCanceled: false
            });
        }).catch((error) => {
            if (internal.state.isCanceled)
                return;
            Object.assign(internal.state, {
                data: undefined,
                error,
                isLoading: false,
                isCanceled: false
            });
        });
    }
};
const createAsyncInternal = (resolver, shouldResolve = true) => {
    const internal = createInternal(createAsyncState(undefined, undefined, true, false), [], resolver);
    Object.assign(internal.state, {
        cancel: () => {
            Object.assign(internal.state, {
                isCanceled: true,
                isLoading: false,
                error: undefined,
                data: undefined
            });
        },
        reset: async (resolver = internal.resolver) => {
            internal.resolver = resolver;
            Object.assign(internal.state, {
                isCanceled: false,
                isLoading: true,
                error: undefined,
                data: undefined
            });
            await resolve(internal);
        }
    });
    if (shouldResolve)
        resolve(internal);
    return internal;
};
export const createAsync = (resolver) => createAsyncInternal(resolver).state;
const globalClassStates = new Map();
export const global = (Class) => {
    const WrappedClass = wrap(Class);
    globalClassStates.set(WrappedClass, null);
    return WrappedClass;
};
export const observable = (Class, key) => {
    if (!Class.constructor[OBSERVABLES])
        Class.constructor[OBSERVABLES] = [];
    Class.constructor[OBSERVABLES].push(key);
};
const wrap = (Class) => {
    var _a;
    const observables = Class[OBSERVABLES] || [];
    return class extends Class {
        static { _a = CLASS_TAG; }
        static { this[_a] = true; }
        constructor(...args) {
            super(...args);
            this[INTERNAL] = createClassInternal(this);
            for (const key of observables) {
                let val = this[key];
                if (!isPrimitive(val))
                    val = createProxy(this[INTERNAL], val, [key]);
                Object.defineProperty(this, key, {
                    get: () => { return val; },
                    set: (value) => {
                        if (match(val, value))
                            return;
                        if (!dispatch(this[INTERNAL], key, value))
                            return;
                        if (!isPrimitive(value))
                            val = createProxy(this[INTERNAL], value, [key]);
                        else
                            val = value;
                    },
                    enumerable: true,
                    configurable: true
                });
            }
        }
    };
};
const addDispatcher = (state, dispatcher) => {
    const dispatchers = state[INTERNAL].dispatchers;
    if (!dispatchers.includes(dispatcher))
        dispatchers.push(dispatcher);
    return () => {
        if (dispatchers.includes(dispatcher))
            dispatchers.splice(dispatchers.indexOf(dispatcher), 1);
    };
};
const dispatch = (internal, key, value) => {
    for (const cb of internal.interceptors)
        if (cb(key, value) === false)
            return false;
    for (const cb of internal.observers)
        cb(key, value);
    const newState = { state: internal.state };
    for (const cb of internal.dispatchers)
        cb(newState);
    return true;
};
function wrapState(state, ...args) {
    if (isClass(state)) {
        if (isWrappedClass(state)) {
            if (globalClassStates.has(state)) {
                if (globalClassStates.get(state) === null)
                    globalClassStates.set(state, new state(...args));
                return globalClassStates.get(state);
            }
            return new state(...args);
        }
        else {
            return new (wrap(state))(...args);
        }
    }
    else {
        const s = typeof state === "function" ? state() : state;
        if (!isState(s)) {
            return create(s);
        }
        return s;
    }
}
;
export function use(state, ...args) {
    const [_state, _setState] = React.useState({ state: wrapState(state, ...args) });
    React.useEffect(() => {
        const removeDispatcher = addDispatcher(_state.state, _setState);
        return removeDispatcher;
    }, [_setState]);
    return _state.state;
}
;
export function observe(state, observer) {
    if (isWrappedClass(state)) {
        if (globalClassStates.has(state)) {
            if (globalClassStates.get(state) === null)
                globalClassStates.set(state, new state());
        }
        else {
            globalClassStates.set(state, new state());
        }
        state = globalClassStates.get(state);
    }
    if (!isState(state)) {
        console.warn("Provided object is not a state object!");
        return { revoke: () => console.warn("No state object provided!") };
    }
    const { observers } = state[INTERNAL];
    observers.push(observer);
    const revoker = {
        revoke: () => {
            revoker.revoke = () => console.warn("Observer is already revoked!");
            if (observers.includes(observer))
                observers.splice(observers.indexOf(observer), 1);
            else
                console.warn("Observer not found!");
        }
    };
    return revoker;
}
;
export function intercept(state, interceptor) {
    if (isWrappedClass(state)) {
        if (globalClassStates.has(state)) {
            if (globalClassStates.get(state) === null)
                globalClassStates.set(state, new state());
        }
        else {
            globalClassStates.set(state, new state());
        }
        state = globalClassStates.get(state);
    }
    if (!isState(state)) {
        console.warn("Provided object is not a state object!");
        return { revoke: () => console.warn("No state object provided!") };
    }
    const { interceptors } = state[INTERNAL];
    interceptors.push(interceptor);
    const revoker = {
        revoke: () => {
            revoker.revoke = () => console.warn("Observer is already revoked!");
            if (interceptors.includes(interceptor))
                interceptors.splice(interceptors.indexOf(interceptor), 1);
            else
                console.warn("Observer not found!");
        }
    };
    return revoker;
}
;
const persistentMap = new Map();
export const createPersistent = (name, state) => {
    if (persistentMap.has(name))
        return persistentMap.get(name);
    const s = create(state);
    const foundState = localStorage.getItem(name);
    if (foundState)
        Object.assign(s, JSON.parse(foundState));
    persistentMap.set(name, s);
    observe(s, (key, value) => {
        localStorage.setItem(name, JSON.stringify({ ...state, [key]: value }));
    });
    return s;
};
export const clearPersistent = () => {
    for (const [name, state] of persistentMap) {
        reset(state);
        localStorage.removeItem(name);
    }
};
export const useObserve = (state, observer) => {
    return React.useEffect(() => observe(state, observer).revoke, []);
};
export const reset = (state) => {
    if (!isState(state))
        return console.warn("Given object is not a state object!");
    if (state[INTERNAL].resolver) {
        resolve(state[INTERNAL]);
    }
    else {
        Object.assign(state, clone(state[INTERNAL].initState));
    }
};
export const createAsyncPersistent = (name, resolver) => {
    if (persistentMap.has(name))
        return persistentMap.get(name);
    const foundState = JSON.parse(localStorage.getItem(name) || "undefined");
    const shouldResolve = !(foundState !== undefined && (foundState.error || foundState.data));
    const internal = createAsyncInternal(resolver, shouldResolve);
    if (foundState)
        Object.assign(internal.state, foundState);
    persistentMap.set(name, internal.state);
    observe(internal.state, (key, val) => {
        localStorage.setItem(name, JSON.stringify({ ...internal.state, [key]: val }));
    });
    return internal.state;
};
export const getGlobal = (state) => {
    if (isWrappedClass(state)) {
        if (globalClassStates.has(state)) {
            if (globalClassStates.get(state) === null)
                globalClassStates.set(state, new state());
        }
        else {
            globalClassStates.set(state, new state());
        }
        return globalClassStates.get(state);
    }
    throw new Error("Cannot get global state!");
};
//# sourceMappingURL=State.js.map