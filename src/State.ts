import React from "react";
import { isPrimitive, match } from "./utils";

export namespace State
{
	type Internal<T extends {}> = {
		state: ProxyState<T>;
		dispatchers: Dispatcher<T>[];
		observers: ObserveCallback<T>[];
		interceptors: InterceptCallback<T>[];
	};

	type ProxyState<T extends {}> = T & {
		[INTERNAL]: Internal<T>;
	};

	type Change<T extends {}> = { [K in keyof T]: [K, T[K]] }[keyof T];

	type ObserveCallback<T extends {}> = (change: Change<T>) => void;
	type InterceptCallback<T extends {}> = (change: Change<T>) => (void | boolean);

	type Revoker = {
		readonly revoke: () => void;
	};

	type Dispatcher<T extends {}> = React.Dispatch<React.SetStateAction<{ state: Internal<T>["state"] }>>;

	const INTERNAL = Symbol("INTERNAL");
	const CLASS_TAG = Symbol("CLASS_TAG");

	const isState = <T extends {}>(o: T): o is ProxyState<T> => isObject(o) && ((o as any)[INTERNAL] !== undefined);

	const isObject = (o: any): o is object => typeof o === "object" && o !== null;

	const wrapChildProxies = <P extends object, T extends {}>(internal: Internal<P>, state: T) =>
	{
		for (const k in state)
		{
			const val = state[k];

			if (isObject(val))
				state[k] = createProxy(internal, val);
		};
	};

	const createProxy = <P extends object, T extends {}>(internal: Internal<P>, state: T): ProxyState<T> =>
	{
		wrapChildProxies(internal, state);

		const proxy: ProxyState<T> = new Proxy<T, ProxyState<T>>(state, {
			get: (target, p, _proxy) =>
			{
				switch (p)
				{
					case INTERNAL:
						return internal;
					default:
						return target[p];
				}
			},
			set: (target, p, val, _proxy) =>
			{
				if (match(target[p], val))
					return true;

				if (!dispatch(internal, p as string, val))
					return true;

				if (isObject(val))
					target[p] = createProxy(internal, val) as any;
				else
					target[p] = val;

				return true;
			}
		});

		return proxy;
	};

	const createInternal = <T extends {}>(state: T): Readonly<Internal<any>> =>
	{
		const internal: Internal<T> = {
			state: null as any,
			dispatchers: [],
			interceptors: [],
			observers: []
		};

		internal.state = createProxy(internal, state);

		return Object.freeze(internal);
	};

	const createClassInternal = (state: any): Readonly<Internal<any>> =>
	{
		const internal: Internal<any> = {
			state,
			dispatchers: [],
			interceptors: [],
			observers: []
		};

		return Object.freeze(internal);
	};

	export const create = <T extends {}>(state: T): T =>
	{
		const internal = createInternal(state);

		return internal.state as T;
	};

	export const wrap = <T extends new (...args: any[]) => any>(Class: T): T =>
	{
		return class extends Class 
		{
			public static readonly [CLASS_TAG] = true;

			public readonly [INTERNAL]: Readonly<Internal<this>>;

			constructor(...args: any[])
			{
				super(...args);

				this[INTERNAL] = createClassInternal(this);

				for (const key in this)
				{
					let val: any = this[key];

					if (!isPrimitive(val))
						val = createProxy(this[INTERNAL], val);

					Object.defineProperty(this, key, {
						get: () => { return val; },
						set: (value: any) =>
						{
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

	const addDispatcher = <T extends {}>(state: ProxyState<T>, dispatcher: Dispatcher<T>): (() => void) =>
	{
		const dispatchers = state[INTERNAL].dispatchers;

		if (!dispatchers.includes(dispatcher))
			dispatchers.push(dispatcher);

		return () => 
		{
			if (dispatchers.includes(dispatcher))
				dispatchers.splice(dispatchers.indexOf(dispatcher), 1);
		};
	};

	const dispatch = <T extends {}>(internal: Internal<T>, key: string, value: any): boolean =>
	{
		const change: Change<T> = [key as any, value];

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

	const isClassState = (o: any): o is (new (...args: any[]) => any) => isObject(o) && ((o as any)[CLASS_TAG] === true);

	function wrapState<T extends {}, Args extends any[]>(StateClass: new (...args: Args) => T, ...args: Args): ProxyState<T>;
	function wrapState<T>(state: T, ...args: any[])
	{
		if (isClassState(state))
			return new state(...args);

		const s = typeof state === "function" ? state() : state;

		if (!isState(s))
			return create(s);

		return state;
	};

	export function use<T, Args extends any[]>(StateClass: new (...args: Args) => T, ...args: Args): T;
	export function use<T extends {}>(state: T): T;
	export function use(state: any, ...args: any[])
	{
		const [_state, _setState] = React.useState({ state: wrapState(state, ...args) });

		React.useEffect(() => 
		{
			const removeDispatcher = addDispatcher(_state.state, _setState);
			return removeDispatcher;
		}, [_setState]);

		return _state.state;
	};

	export const observe = <T extends {}>(state: T, observer: ObserveCallback<T>): Revoker =>
	{
		if (!isState(state))
		{
			console.warn("Provided object is not a state object!");
			return { revoke: () => console.warn("No state object provided!") };
		}

		const { observers } = state[INTERNAL];

		observers.push(observer);

		const revoker = {
			revoke: () => 
			{
				revoker.revoke = () => console.warn("Observer is already revoked!");

				if (observers.includes(observer))
					observers.splice(observers.indexOf(observer), 1);
				else
					console.warn("Observer not found!");
			}
		};

		return revoker;
	};

	export const intercept = <T extends {}>(state: T, interceptor: InterceptCallback<T>): Revoker =>
	{

		if (!isState(state))
		{
			console.warn("Provided object is not a state object!");
			return { revoke: () => console.warn("No state object provided!") };
		}

		const { interceptors } = state[INTERNAL];

		interceptors.push(interceptor);

		const revoker = {
			revoke: () => 
			{
				revoker.revoke = () => console.warn("Observer is already revoked!");

				if (interceptors.includes(interceptor))
					interceptors.splice(interceptors.indexOf(interceptor), 1);
				else
					console.warn("Observer not found!");
			}
		};

		return revoker;
	};
};
