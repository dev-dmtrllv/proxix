import React from "react";
import { isPrimitive, match } from "./utils";
export var State;
(function (State) {
    const INTERNAL = Symbol("INTERNAL");
    const CLASS_TAG = Symbol("CLASS_TAG");
    const isState = (o) => isObject(o) && (o[INTERNAL] !== undefined);
    const isObject = (o) => typeof o === "object" && o !== null;
    const wrapChildProxies = (internal, state) => {
        for (const k in state) {
            const val = state[k];
            if (isObject(val))
                state[k] = createProxy(internal, val);
        }
        ;
    };
    const createProxy = (internal, state) => {
        wrapChildProxies(internal, state);
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
                if (!dispatch(internal, p, val))
                    return true;
                if (isObject(val))
                    target[p] = createProxy(internal, val);
                else
                    target[p] = val;
                return true;
            }
        });
        return proxy;
    };
    const createInternal = (state) => {
        const internal = {
            state: null,
            dispatchers: [],
            interceptors: [],
            observers: []
        };
        internal.state = createProxy(internal, state);
        return Object.freeze(internal);
    };
    const createClassInternal = (state) => {
        const internal = {
            state,
            dispatchers: [],
            interceptors: [],
            observers: []
        };
        return Object.freeze(internal);
    };
    State.create = (state) => {
        const internal = createInternal(state);
        return internal.state;
    };
    State.wrap = (Class) => {
        var _a;
        return class extends Class {
            static { _a = CLASS_TAG; }
            static { this[_a] = true; }
            constructor(...args) {
                super(...args);
                this[INTERNAL] = createClassInternal(this);
                for (const key in this) {
                    let val = this[key];
                    if (!isPrimitive(val))
                        val = createProxy(this[INTERNAL], val);
                    Object.defineProperty(this, key, {
                        get: () => { return val; },
                        set: (value) => {
                            if (match(val, value))
                                return;
                            if (!dispatch(this[INTERNAL], key, value))
                                return;
                            if (!isPrimitive(value))
                                val = createProxy(this[INTERNAL], value);
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
        const change = [key, value];
        for (const cb of internal.interceptors)
            if (cb(change) === false)
                return false;
        for (const cb of internal.observers)
            cb(change);
        const newState = { state: internal.state };
        for (const cb of internal.dispatchers)
            cb(newState);
        return true;
    };
    const isClassState = (o) => isObject(o) && (o[CLASS_TAG] === true);
    function wrapState(state, ...args) {
        if (isClassState(state))
            return new state(...args);
        const s = typeof state === "function" ? state() : state;
        if (!isState(s))
            return State.create(s);
        return state;
    }
    ;
    function use(state, ...args) {
        const [_state, _setState] = React.useState({ state: wrapState(state, ...args) });
        React.useEffect(() => {
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
})(State || (State = {}));
;
//# sourceMappingURL=State.js.map