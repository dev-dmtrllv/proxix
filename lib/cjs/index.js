"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.State = void 0;
const react_1 = __importDefault(require("react"));
var State;
(function (State) {
    const clone = (obj) => {
        const type = typeof obj;
        if (obj && (type === "object")) {
            if (Array.isArray(obj)) {
                const newArray = new Array(obj.length);
                for (let i = 0; i != obj.length; i++)
                    newArray[i] = clone(obj[i]);
                return newArray;
            }
            else {
                const newObj = {};
                for (const k in obj)
                    newObj[k] = clone(obj[k]);
                return newObj;
            }
        }
        return obj;
    };
    const INTERNAL = Symbol("INTERNAL");
    const ORIGINAL = Symbol("ORIGINAL");
    const OBSERVERS = Symbol("OBSERVERS");
    const DISPATCHERS = Symbol("DISPATCHERS");
    const INTERCEPTORS = Symbol("INTERCEPTORS");
    const ASYNC_TAG = Symbol("ASYNC_TAG");
    const isState = (obj) => obj && (typeof obj === "object") && ((obj)[INTERNAL] !== undefined);
    const isAsync = (obj) => obj && (typeof obj === "object") && ((obj)[ASYNC_TAG] !== undefined);
    const getInternal = (state) => {
        if (!isState(state))
            throw new Error("Could not get internals!");
        return state[INTERNAL];
    };
    const getObservers = (state) => getInternal(state)[OBSERVERS];
    const getInterceptors = (state) => getInternal(state)[INTERCEPTORS];
    const isKeyOf = (obj, key) => {
        return (Array.isArray(obj) && (key == Number(key))) || (obj && (typeof obj === "object") && (obj[key] !== undefined));
    };
    const wrapChildProxies = (internal, value, path) => {
        const copy = clone(value);
        for (const k in value) {
            const val = value[k];
            if (typeof val === "function")
                copy[k] = val;
            else if (val && (typeof val === "object") && !isState(val))
                copy[k] = createProxy(internal, val, [...path, k]);
        }
        return copy;
    };
    const match = (a, b) => {
        if (typeof a !== typeof b)
            return false;
        if (Array.isArray(a)) {
            if (!Array.isArray(b))
                return false;
            if (a.length !== b.length)
                return false;
            for (let i = 0; i !== a.length; i++)
                if (a[i] !== b[i])
                    return false;
            return true;
        }
        if (typeof a === "object" && a && b) {
            if (!match(Object.keys(a), Object.keys(b)))
                return false;
            for (const k in a)
                if (a[k] !== b[k])
                    return false;
            return true;
        }
        return a === b;
    };
    const createProxy = (internal, original, path, asyncHandlers = undefined) => {
        const wrapped = wrapChildProxies(internal, original, path);
        return new Proxy(wrapped, {
            get(target, p) {
                const k = p;
                switch (k) {
                    case INTERNAL:
                        return internal;
                    case ORIGINAL:
                        return original;
                    case ASYNC_TAG:
                        return asyncHandlers === undefined ? undefined : true;
                    default:
                        if (asyncHandlers && isKeyOf(asyncHandlers, k))
                            return asyncHandlers[k];
                        return target[k];
                }
            },
            set(target, p, newValue) {
                const k = p;
                if (match(target[k], newValue))
                    return true;
                const oldState = clone(internal.cleanState);
                let newStateTarget = internal.cleanState;
                path.forEach(p => newStateTarget = newStateTarget[p]);
                const isNewValueState = isState(newValue);
                newStateTarget[p] = isNewValueState ? newValue[ORIGINAL] : newValue;
                const propertyPaths = [...path, p.toString()];
                const propertyPath = propertyPaths.join(".");
                let canceled = false;
                internal[INTERCEPTORS].forEach(callbackfn => {
                    if (callbackfn(propertyPath, newValue, oldState, internal.cleanState) === false)
                        canceled = true;
                });
                if (canceled)
                    return true;
                internal[OBSERVERS].forEach(callbackfn => callbackfn(propertyPath, newValue, oldState, internal.cleanState));
                if (isNewValueState) {
                    original[k] = newValue[ORIGINAL];
                    target[k] = newValue;
                }
                else {
                    original[k] = newValue;
                    if (typeof newValue === "function")
                        target[k] = newValue;
                    else if (newValue && typeof newValue === "object")
                        target[k] = createProxy(internal, newValue, propertyPaths);
                    else
                        target[k] = newValue;
                }
                const newDispatchState = { internal };
                internal[DISPATCHERS].forEach(update => update(newDispatchState));
                return true;
            }
        });
    };
    State.create = (state, asyncHandlers = undefined) => {
        const internal = {
            initialState: clone(state),
            cleanState: state,
            [INTERCEPTORS]: [],
            [OBSERVERS]: [],
            [DISPATCHERS]: []
        };
        if (asyncHandlers !== undefined) {
            const internalAsync = internal;
            internalAsync[ASYNC_TAG] = true;
        }
        internal.state = createProxy(internal, state, [], asyncHandlers);
        return internal.state;
    };
    const resolveAsyncState = (state, resolver, token) => {
        token.isResolving = true;
        const update = (data, error) => {
            token.isResolving = false;
            if (token.canceled) {
                token.canceled = false;
                Object.assign(state, {
                    data: undefined,
                    error: undefined,
                    isLoading: false,
                    isCanceled: true
                });
                return;
            }
            const keys = Object.getOwnPropertyNames(data || {});
            if (keys.includes("data") && keys.includes("error")) {
                Object.assign(state, {
                    data: data.data,
                    error: data.error,
                    isLoading: false,
                    isCanceled: false
                });
            }
            else
                Object.assign(state, {
                    data,
                    error,
                    isLoading: false,
                    isCanceled: false
                });
        };
        return resolver().then(data => update(data)).catch(error => update(undefined, error));
    };
    const createAsyncInternal = (resolver, resolve) => {
        let currentResolver = { resolver };
        const cancelToken = { isResolving: false, canceled: false };
        const reset = async (prefetch) => {
            if (!prefetch)
                Object.assign(state, {
                    isLoading: true,
                    data: undefined,
                    error: undefined,
                    isCanceled: false
                });
            await resolveAsyncState(state, currentResolver.resolver, cancelToken);
        };
        const state = State.create({
            isLoading: true,
            data: undefined,
            error: undefined,
        }, {
            cancel: () => {
                if (cancelToken.isResolving)
                    cancelToken.canceled = true;
            },
            reset,
            update: async (resolver, prefetch) => {
                if (cancelToken.isResolving)
                    return;
                currentResolver.resolver = resolver;
                await reset(prefetch);
            }
        });
        if (resolve)
            resolveAsyncState(state, currentResolver.resolver, cancelToken);
        return state;
    };
    State.createAsync = (resolver) => createAsyncInternal(resolver, true);
    State.createAsyncPersistent = (name, resolver) => {
        if (persistentMap.has(name))
            return persistentMap.get(name);
        const foundState = JSON.parse(localStorage.getItem(name) || "null");
        const s = createAsyncInternal(resolver, foundState == null || foundState.isCanceled || foundState.isLoading);
        if (foundState)
            Object.assign(s, foundState);
        persistentMap.set(name, s);
        State.observe(s, (_key, _val, _oldState, newState) => localStorage.setItem(name, JSON.stringify(newState)));
        return s;
    };
    State.observe = (state, observer) => {
        const observers = getObservers(state);
        if (!observers.includes(observer))
            observers.push(observer);
        return {
            remove: () => observers.splice(observers.indexOf(observer), 1)
        };
    };
    State.intercept = (state, interceptor) => {
        const interceptors = getInterceptors(state);
        if (!interceptors.includes(interceptor))
            interceptors.push(interceptor);
        return {
            remove: () => interceptors.splice(interceptors.indexOf(interceptor), 1)
        };
    };
    State.reset = (state) => {
        if (isAsync(state)) {
            state.reset();
        }
        else {
            Object.assign(state, clone(getInternal(state).initialState));
        }
    };
    State.use = (state) => {
        const [_state, _setState] = react_1.default.useState({ internal: (isState(state) ? state[INTERNAL] : State.create(state)[INTERNAL]) });
        react_1.default.useEffect(() => {
            _state.internal[DISPATCHERS].push(_setState);
            return () => { _state.internal[DISPATCHERS].splice(_state.internal[DISPATCHERS].indexOf(_setState), 1); };
        }, [_state, _setState]);
        return _state.internal.state;
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
        State.observe(s, (_key, _val, _oldState, newState) => localStorage.setItem(name, JSON.stringify(newState)));
        return s;
    };
    State.clearPersistent = () => {
        for (const [name, state] of persistentMap) {
            State.reset(state);
            localStorage.removeItem(name);
        }
    };
    State.useObserve = (state, observer) => {
        return react_1.default.useEffect(() => State.observe(state, observer).remove, []);
    };
})(State || (exports.State = State = {}));
//# sourceMappingURL=index.js.map