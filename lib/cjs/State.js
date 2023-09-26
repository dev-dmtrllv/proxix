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
    const DISPATCHERS = Symbol("DISPATCHERS");
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
            get(target, p, _proxy) {
                switch (p) {
                    case INTERNAL:
                        return internal;
                    default:
                        return target[p];
                }
            },
            set(target, p, val, _proxy) {
                if ((0, utils_1.match)(target[p], val))
                    return true;
                if (isObject(val)) {
                    target[p] = createProxy(internal, val);
                }
                else {
                    target[p] = val;
                }
                dispatch(internal);
                return true;
            }
        });
        return proxy;
    };
    const createInternal = (state) => {
        const internal = {
            state: null,
            [DISPATCHERS]: []
        };
        internal.state = createProxy(internal, state);
        return Object.freeze(internal);
    };
    const createClassInternal = (state) => {
        const internal = {
            state,
            [DISPATCHERS]: []
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
                    if (!(0, utils_1.isPrimitive)(val))
                        val = createProxy(this[INTERNAL], val);
                    Object.defineProperty(this, key, {
                        get: () => { return val; },
                        set: (value) => {
                            if ((0, utils_1.match)(val, value))
                                return;
                            if (!(0, utils_1.isPrimitive)(value))
                                val = createProxy(this[INTERNAL], value);
                            else
                                val = value;
                            dispatch(this[INTERNAL]);
                        },
                        enumerable: true,
                        configurable: true
                    });
                }
            }
        };
    };
    const addDispatcher = (state, dispatcher) => {
        const dispatchers = state[INTERNAL][DISPATCHERS];
        if (!dispatchers.includes(dispatcher))
            dispatchers.push(dispatcher);
        return () => {
            if (dispatchers.includes(dispatcher))
                dispatchers.splice(dispatchers.indexOf(dispatcher), 1);
        };
    };
    const dispatch = (internal) => {
        const newState = { state: internal.state };
        internal[DISPATCHERS].forEach(dispatch => dispatch(newState));
    };
    const isClassState = (o) => isObject(o) && (o[CLASS_TAG] === true);
    function wrapState(state, ...args) {
        if (isClassState(state)) {
            return new state(...args);
        }
        else {
            const s = typeof state === "function" ? state() : state;
            if (!isState(s))
                return State.create(s);
            return state;
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
})(State || (exports.State = State = {}));
;
//# sourceMappingURL=State.js.map