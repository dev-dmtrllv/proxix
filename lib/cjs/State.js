"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.State = void 0;
const react_1 = __importDefault(require("react"));
const utils_1 = require("./utils");
var State;
(function (State) {
    const INTERNAL = Symbol("INTERNAL");
    const CLASS_TAG = Symbol("CLASS_TAG");
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
    State.create = (state) => {
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
    State.createAsync = (resolver) => createAsyncInternal(resolver).state;
    const globalClassStates = new Map();
    State.global = (Class) => {
        const WrappedClass = wrap(Class);
        globalClassStates.set(WrappedClass, null);
        return WrappedClass;
    };
    const wrap = (Class) => {
        var _a;
        return class extends Class {
            static { _a = CLASS_TAG; }
            static { this[_a] = true; }
            constructor(...args) {
                super(...args);
                this[INTERNAL] = createClassInternal(this);
                for (const key in this) {
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
                return State.create(s);
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
    State.use = use;
    ;
    State.observe = (state, observer) => {
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
    };
    State.intercept = (state, interceptor) => {
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
    };
    const persistentMap = new Map();
    State.createPersistent = (name, state) => {
        if (persistentMap.has(name))
            return persistentMap.get(name);
        const s = State.create(state);
        const foundState = localStorage.getItem(name);
        if (foundState)
            Object.assign(s, JSON.parse(foundState));
        persistentMap.set(name, s);
        State.observe(s, (key, value) => {
            localStorage.setItem(name, JSON.stringify({ ...state, [key]: value }));
        });
        return s;
    };
    State.clearPersistent = () => {
        for (const [name, state] of persistentMap) {
            State.reset(state);
            localStorage.removeItem(name);
        }
    };
    State.useObserve = (state, observer) => {
        return react_1.default.useEffect(() => State.observe(state, observer).revoke, []);
    };
    State.reset = (state) => {
        if (!isState(state))
            return console.warn("Given object is not a state object!");
        if (state[INTERNAL].resolver) {
            resolve(state[INTERNAL]);
        }
        else {
            Object.assign(state, (0, utils_1.clone)(state[INTERNAL].initState));
        }
    };
    State.createAsyncPersistent = (name, resolver) => {
        if (persistentMap.has(name))
            return persistentMap.get(name);
        const foundState = JSON.parse(localStorage.getItem(name) || "undefined");
        const shouldResolve = !(foundState !== undefined && (foundState.error || foundState.data));
        const internal = createAsyncInternal(resolver, shouldResolve);
        if (foundState)
            Object.assign(internal.state, foundState);
        persistentMap.set(name, internal.state);
        State.observe(internal.state, (key, val) => {
            localStorage.setItem(name, JSON.stringify({ ...internal.state, [key]: val }));
        });
        return internal.state;
    };
})(State || (exports.State = State = {}));
;
//# sourceMappingURL=State.js.map