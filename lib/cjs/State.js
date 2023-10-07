"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.onResolve = exports.useResolve = exports.getGlobal = exports.createAsyncPersistent = exports.reset = exports.useObserve = exports.clearPersistent = exports.createPersistent = exports.intercept = exports.observe = exports.use = exports.observable = exports.global = exports.createAsync = exports.create = void 0;
const react_1 = __importDefault(require("react"));
const utils_1 = require("./utils");
const _1 = __importDefault(require("."));
let resolvingCount = 0;
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
            if ((0, utils_1.match)(target[p], val))
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
        initState: (0, utils_1.clone)(state),
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
        initState: (0, utils_1.clone)(state),
        state,
        dispatchers: [],
        interceptors: [],
        observers: [],
        resolver: undefined
    };
    return internal;
};
/**
 * @param state A state object which will automatically update all components that uses it.
 * @returns The state object.
 */
const create = (state) => {
    return createInternal(state, []).state;
};
exports.create = create;
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
        if (++resolvingCount == 1)
            onResolveCallbacks.forEach(cb => cb(true));
        const onResolved = () => {
            if (--resolvingCount == 0)
                onResolveCallbacks.forEach(cb => cb(false));
        };
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
            onResolved();
        }).catch((error) => {
            if (internal.state.isCanceled)
                return;
            Object.assign(internal.state, {
                data: undefined,
                error,
                isLoading: false,
                isCanceled: false
            });
            onResolved();
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
/**
 * @param resolver An async function that will be resolved.
 * @returns An `AsyncState` wrapped around the data or error returned by the async function.
 */
const createAsync = (resolver) => createAsyncInternal(resolver).state;
exports.createAsync = createAsync;
const globalClassStates = new Map();
/**
 * A class decorator to create a singleton based state object.
 */
const global = (Class) => {
    const WrappedClass = wrap(Class);
    globalClassStates.set(WrappedClass, null);
    return WrappedClass;
};
exports.global = global;
/**
 * A decorator which enables updating components on property change.
 */
const observable = (Class, key) => {
    if (!Class.constructor[OBSERVABLES])
        Class.constructor[OBSERVABLES] = [];
    Class.constructor[OBSERVABLES].push(key);
};
exports.observable = observable;
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
                if (!(0, utils_1.isPrimitive)(val))
                    val = createProxy(this[INTERNAL], val, [key]);
                Object.defineProperty(this, key, {
                    get: () => { return val; },
                    set: (value) => {
                        if ((0, utils_1.match)(val, value))
                            return;
                        if (!dispatch(this[INTERNAL], key, value))
                            return;
                        if (!(0, utils_1.isPrimitive)(value))
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
    if ((0, utils_1.isClass)(state)) {
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
            return (0, exports.create)(s);
        }
        return s;
    }
}
;
function use(state, ...args) {
    const [_state, _setState] = react_1.default.useState({ state: wrapState(state, ...args) });
    react_1.default.useEffect(() => {
        const removeDispatcher = addDispatcher(_state.state, _setState);
        return removeDispatcher;
    }, [_setState]);
    return _state.state;
}
exports.use = use;
;
function observe(state, observer) {
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
exports.observe = observe;
;
function intercept(state, interceptor) {
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
exports.intercept = intercept;
;
const persistentMap = new Map();
/**
 * @param name The name which will be used to store and retreive the state from the localStorage.
 * @param state The state object.
 * @returns The state object.
 */
const createPersistent = (name, state) => {
    if (persistentMap.has(name))
        return persistentMap.get(name);
    const s = (0, exports.create)(state);
    const foundState = localStorage.getItem(name);
    if (foundState)
        Object.assign(s, JSON.parse(foundState));
    persistentMap.set(name, s);
    observe(s, (key, value) => {
        const newState = (0, utils_1.clone)(state);
        const keys = key.split(".");
        const last = keys.splice(-1, 1)[0];
        let target = newState;
        keys.forEach(k => target = target[k]);
        target[last] = value;
        localStorage.setItem(name, JSON.stringify(newState));
    });
    return s;
};
exports.createPersistent = createPersistent;
/**
 * Clears all the persistent states.
 */
const clearPersistent = () => {
    for (const [name, state] of persistentMap) {
        (0, exports.reset)(state);
        localStorage.removeItem(name);
    }
};
exports.clearPersistent = clearPersistent;
/**
 * @param state The state object to observe.
 * @param observer The observe callback.
 */
const useObserve = (state, observer) => {
    react_1.default.useEffect(() => observe(state, observer).revoke, []);
};
exports.useObserve = useObserve;
/**
 * @param state The state object to reset.
 */
const reset = (state) => {
    if (!isState(state))
        return console.warn("Given object is not a state object!");
    if (state[INTERNAL].resolver) {
        resolve(state[INTERNAL]);
    }
    else {
        Object.assign(state, (0, utils_1.clone)(state[INTERNAL].initState));
    }
};
exports.reset = reset;
/**
 * @param name The name which will be used to store and retreive the state from the localStorage.
 * @param resolver An async function that will be resolved.
 * @returns An `AsyncState` wrapped around the data or error returned by the async function.
 */
const createAsyncPersistent = (name, resolver) => {
    if (persistentMap.has(name))
        return persistentMap.get(name);
    const foundState = JSON.parse(localStorage.getItem(name) || "null");
    const shouldResolve = !(foundState !== null && (foundState.error || foundState.data));
    const internal = createAsyncInternal(resolver, shouldResolve);
    if (foundState)
        Object.assign(internal.state, foundState);
    persistentMap.set(name, internal.state);
    observe(internal.state, (key, value) => {
        const newState = (0, utils_1.clone)(internal.state);
        const keys = key.split(".");
        const last = keys.splice(-1, 1)[0];
        let target = newState;
        keys.forEach(k => target = target[k]);
        target[last] = value;
        localStorage.setItem(name, JSON.stringify(newState));
    });
    return internal.state;
};
exports.createAsyncPersistent = createAsyncPersistent;
/**
 * @param state The global state class.
 * @returns The instance of the global state class.
 */
const getGlobal = (state) => {
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
exports.getGlobal = getGlobal;
const resolveState = _1.default.create({
    isResolving: false
});
const onResolveCallbacks = [];
const useResolve = () => _1.default.use(resolveState);
exports.useResolve = useResolve;
const onResolve = (callback) => {
    if (!onResolveCallbacks.includes(callback))
        onResolveCallbacks.push(callback);
    return {
        revoke: () => onResolveCallbacks.splice(onResolveCallbacks.indexOf(callback), 1)
    };
};
exports.onResolve = onResolve;
//# sourceMappingURL=State.js.map