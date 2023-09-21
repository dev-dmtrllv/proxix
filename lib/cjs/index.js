"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.State = void 0;
const react_1 = __importDefault(require("react"));
const react_dom_1 = __importDefault(require("react-dom"));
var State;
(function (State) {
    const DISPATCHERS = Symbol("DISPATCHERS");
    const OBSERVERS = Symbol("OBSERVERS");
    const INTERCEPTORS = Symbol("INTERCEPTORS");
    const BATCH_UPDATES = Symbol("BATCH_UPDATES");
    const RESETTER = Symbol("BATCH_UPDATES");
    State.isState = (obj) => obj && (typeof obj === "object") && (Array.isArray(obj[DISPATCHERS]));
    const registerStateDispatcher = (state, dispatcher) => {
        if (!State.isState(state))
            throw new Error(`Object is not a state object!`);
        if (!state[DISPATCHERS].includes(dispatcher))
            state[DISPATCHERS].push(dispatcher);
    };
    const removeStateDispatcher = (state, dispatcher) => {
        if (!State.isState(state))
            throw new Error(`Object is not a state object!`);
        if (state[DISPATCHERS].includes(dispatcher))
            state[DISPATCHERS].splice(state[DISPATCHERS].indexOf(dispatcher), 1);
    };
    const registerObserver = (state, callback) => {
        if (!State.isState(state))
            throw new Error(`Object is not a state object!`);
        if (!state[OBSERVERS].includes(callback))
            state[OBSERVERS].push(callback);
    };
    const removeObserver = (state, callback) => {
        if (!State.isState(state))
            throw new Error(`Object is not a state object!`);
        if (state[OBSERVERS].includes(callback))
            state[OBSERVERS].splice(state[OBSERVERS].indexOf(callback), 1);
    };
    const registerInterceptor = (state, callback) => {
        if (!State.isState(state))
            throw new Error(`Object is not a state object!`);
        if (!state[INTERCEPTORS].includes(callback))
            state[INTERCEPTORS].push(callback);
    };
    const removeInterceptor = (state, callback) => {
        if (!State.isState(state))
            throw new Error(`Object is not a state object!`);
        if (state[INTERCEPTORS].includes(callback))
            state[INTERCEPTORS].splice(state[INTERCEPTORS].indexOf(callback), 1);
    };
    const dispatchStateChange = (state, key, value) => {
        if (!State.isState(state))
            throw new Error(`Object is not a state object!`);
        let canceled = false;
        const interceptCallbacks = state[INTERCEPTORS];
        for (const callback of interceptCallbacks)
            if (callback(key, value, state, { ...state, [key]: value }) === false)
                canceled = true;
        if (canceled)
            return false;
        const observeCallbacks = state[OBSERVERS];
        for (const callback of observeCallbacks)
            callback(key, value, state, { ...state, [key]: value });
        return true;
    };
    const dispatchStateUpdate = (state) => {
        if (!State.isState(state))
            throw new Error(`Object is not a state object!`);
        const stateDispatchers = state[DISPATCHERS];
        react_dom_1.default.unstable_batchedUpdates(() => {
            const newState = { state };
            stateDispatchers.forEach(dispatch => dispatch(newState));
        });
    };
    const isInitializer = (obj) => typeof obj === "function";
    State.create = (initState) => {
        const state = isInitializer(initState) ? initState() : initState;
        const stateDispatchers = [];
        const observeCallbacks = [];
        const interceptCallbacks = [];
        let batchUpdates = false;
        const initialState = structuredClone(state);
        const reset = () => State.update(proxy, () => Object.assign(proxy, structuredClone(initialState)));
        const wrapProxy = (obj) => new Proxy(obj, {
            get(state, prop, _proxy) {
                const key = prop;
                switch (key) {
                    case DISPATCHERS:
                        return stateDispatchers;
                    case OBSERVERS:
                        return observeCallbacks;
                    case INTERCEPTORS:
                        return interceptCallbacks;
                    case BATCH_UPDATES:
                        return batchUpdates;
                    case RESETTER:
                        return reset;
                    default:
                        return state[key];
                }
            },
            set(state, prop, newValue, proxy) {
                const key = prop;
                if (state[key] === newValue)
                    return true;
                if (dispatchStateChange(proxy, key, newValue))
                    state[key] = newValue;
                if (!batchUpdates)
                    dispatchStateUpdate(proxy);
                return true;
            }
        });
        const wrapProxiesRecursive = (state) => {
            for (const k in state)
                if (typeof state[k] === "object" && state[k] && !State.isState(state[k]))
                    state[k] = wrapProxiesRecursive(state[k]);
            return wrapProxy(state);
        };
        const proxy = wrapProxiesRecursive(state);
        return proxy;
    };
    State.createAsync = async (initializer) => State.create(await initializer());
    State.use = (state) => {
        const [_state, _setState] = react_1.default.useState(() => ({ state: State.isState(state) ? state : State.create(state) }));
        react_1.default.useEffect(() => {
            registerStateDispatcher(_state.state, _setState);
            return () => removeStateDispatcher(_state.state, _setState);
        }, [_state, _setState]);
        return _state.state;
    };
    State.observe = (state, callback) => {
        if (!State.isState(state))
            throw new Error(`Object is not a state object!`);
        registerObserver(state, callback);
        return Object.freeze({
            remove: () => removeObserver(state, callback)
        });
    };
    State.intercept = (state, callback) => {
        if (!State.isState(state))
            throw new Error(`Object is not a state object!`);
        registerInterceptor(state, callback);
        return Object.freeze({
            remove: () => removeInterceptor(state, callback)
        });
    };
    State.update = (state, updater) => {
        if (!State.isState(state))
            throw new Error(`Object is not a state object!`);
        state[BATCH_UPDATES] = true;
        updater(state);
        state[BATCH_UPDATES] = false;
        dispatchStateUpdate(state);
    };
    State.reset = (state) => {
        if (!State.isState(state))
            throw new Error(`Object is not a state object!`);
        state[RESETTER]();
    };
    const usedPersistenNames = [];
    State.createPersistent = (name, initState) => {
        if (usedPersistenNames.includes(name))
            throw new Error(`Name ${name} is already used!`);
        const state = isInitializer(initState) ? initState() : initState;
        const get = () => {
            const dataString = localStorage.getItem(name);
            return dataString ? JSON.parse(dataString) : state;
        };
        const set = (state) => localStorage.setItem(name, JSON.stringify(state));
        if (!localStorage.getItem(name))
            set(state);
        const proxyState = State.create(state);
        State.update(proxyState, () => Object.assign(proxyState, get()));
        State.observe(proxyState, (_a, _b, _c, newState) => set(newState));
        return proxyState;
    };
    State.createPersistentAsync = async (name, initState) => {
        return State.createPersistent(name, await initState());
    };
})(State || (exports.State = State = {}));
//# sourceMappingURL=index.js.map