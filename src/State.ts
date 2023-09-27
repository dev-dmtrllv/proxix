import React from "react";
import { clone, isClass, isPrimitive, match } from "./utils";

export namespace State
{
	type PathImpl<T, K extends keyof T> =
		K extends string
		? T[K] extends Record<string, any>
		? T[K] extends ArrayLike<any>
		? K | `${K}.${PathImpl<T[K], Exclude<keyof T[K], keyof any[]>>}`
		: K | `${K}.${PathImpl<T[K], keyof T[K]>}`
		: K
		: never;

	type Path<T> = PathImpl<T, keyof T> | keyof T;

	type PathValue<T, P extends Path<T>> =
		P extends `${infer K}.${infer Rest}`
		? K extends keyof T
		? Rest extends Path<T[K]>
		? PathValue<T[K], Rest>
		: never
		: never
		: P extends keyof T
		? T[P]
		: never;

	type Internal<T extends {}, R> = {
		initState: T;
		state: ProxyState<T>;
		dispatchers: Dispatcher<T>[];
		observers: ObserveCallback<T>[];
		interceptors: InterceptCallback<T>[];
		resolver: AsyncResolver<R> | undefined;
	};

	type ProxyState<T extends {}> = T & {
		[INTERNAL]: Internal<T, any>;
	};

	type Change<T extends {}, K extends Path<T>> = { [K in Path<T>]: [K, PathValue<T, K>] }[K];

	type ObserveCallback<T extends {}> = (...args: Change<T, Path<T>>) => void;
	type InterceptCallback<T extends {}> = (...args: Change<T, Path<T>>) => (void | boolean);

	type Revoker = {
		readonly revoke: () => void;
	};

	type Dispatcher<T extends {}> = React.Dispatch<React.SetStateAction<{ state: Internal<T, any>["state"] }>>;

	type AsyncResolver<T> = () => Promise<T>;

	type AsyncState<T> = ({
		data: T;
		error: undefined;
		isLoading: false;
		isCanceled: false;
	} | {
		data: undefined;
		error: Error;
		isLoading: false;
		isCanceled: false;
	} | {
		data: undefined;
		error: undefined;
		isLoading: true;
		isCanceled: false;
	} | {
		data: undefined;
		error: undefined;
		isLoading: false;
		isCanceled: true;
	}) & AsyncHandlers<T>;

	type AsyncHandlers<T> = {
		readonly reset: (resolver?: AsyncResolver<T>, prefetch?: boolean) => Promise<void>;
		readonly cancel: (prefetch?: boolean) => void;
	};

	const INTERNAL = Symbol("INTERNAL");
	const CLASS_TAG = Symbol("CLASS_TAG");

	const isWrappedClass = (o: any): boolean => (o[CLASS_TAG] === true);

	const isState = <T extends {}>(o: T): o is ProxyState<T> => isObject(o) && ((o as any)[INTERNAL] !== undefined);

	const isObject = (o: any): o is object => typeof o === "object" && o !== null;

	const wrapChildProxies = <P extends object, T extends {}>(internal: Internal<P, any>, state: T, path: string[]) =>
	{
		for (const k in state)
		{
			const val = state[k];

			if (isObject(val))
				state[k] = createProxy(internal, val, [...path, k]);
		};
	};

	const createProxy = <P extends object, T extends {}>(internal: Internal<P, any>, state: T, path: string[]): ProxyState<T> =>
	{
		wrapChildProxies(internal, state, path);

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

				if (!dispatch(internal, [...path, p].join("."), val))
					return true;

				if (isObject(val))
					target[p] = createProxy(internal, val, [...path, p.toString()]) as any;
				else
					target[p] = val;

				return true;
			}
		});

		return proxy;
	};

	const createInternal = <T extends {}, R>(state: T, path: string[], resolver: AsyncResolver<R> | undefined = undefined): Internal<T, R> =>
	{
		const internal: Internal<T, R> = {
			initState: clone(state),
			state: null as any,
			dispatchers: [],
			interceptors: [],
			observers: [],
			resolver: resolver
		};

		internal.state = createProxy(internal, state, path);

		return internal;
	};

	const createClassInternal = (state: any): Readonly<Internal<any, any>> =>
	{
		const internal: Internal<any, any> = {
			initState: clone(state),
			state,
			dispatchers: [],
			interceptors: [],
			observers: [],
			resolver: undefined
		};

		return internal;
	};

	export const create = <T extends {}>(state: T): T =>
	{
		return createInternal(state, []).state as T;
	};

	const createAsyncState = <T>(data: T | undefined, error: Error | undefined, isLoading: boolean, isCanceled: boolean): AsyncState<T> =>
	{
		return {
			data,
			error,
			isLoading,
			isCanceled,
		} as AsyncState<T>;
	};

	const resolve = <T, R>(internal: Internal<AsyncState<T>, R>) =>
	{
		if (internal.resolver)
		{
			Object.assign(internal.state, {
				data: undefined,
				error: undefined,
				isLoading: true,
				isCanceled: false
			});

			internal.resolver().then((data) => 
			{
				if (internal.state.isCanceled)
					return;

				Object.assign(internal.state, {
					data,
					error: undefined,
					isLoading: false,
					isCanceled: false
				});
			}).catch((error) => 
			{
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

	const createAsyncInternal = <T>(resolver: AsyncResolver<T>, shouldResolve: boolean = true) =>
	{
		const internal = createInternal<AsyncState<T>, T>(createAsyncState<T>(undefined, undefined, true, false), [], resolver);

		Object.assign(internal.state, {
			cancel: () => 
			{
				Object.assign(internal.state, {
					isCanceled: true,
					isLoading: false,
					error: undefined,
					data: undefined
				});
			},
			reset: async (resolver = internal.resolver) => 
			{
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
	}

	export const createAsync = <T>(resolver: AsyncResolver<T>): AsyncState<T> => createAsyncInternal<T>(resolver).state;

	const globalClassStates = new Map<new (...args: any[]) => any, any>();

	export const global = <T extends new (...args: any[]) => any>(Class: T): T =>
	{
		const WrappedClass = wrap(Class);

		globalClassStates.set(WrappedClass, null);

		return WrappedClass;
	};

	const wrap = <T extends new (...args: any[]) => any>(Class: T): T =>
	{
		return class extends Class 
		{
			public static readonly [CLASS_TAG] = true;

			public readonly [INTERNAL]: Readonly<Internal<this, any>>;

			constructor(...args: any[])
			{
				super(...args);

				this[INTERNAL] = createClassInternal(this);

				for (const key in this)
				{
					let val: any = this[key];

					if (!isPrimitive(val))
						val = createProxy(this[INTERNAL], val, [key]);

					Object.defineProperty(this, key, {
						get: () => { return val; },
						set: (value: any) =>
						{
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

	const dispatch = <T extends {}>(internal: Internal<T, any>, key: string, value: any): boolean =>
	{
		for (const cb of internal.interceptors)
			if (cb(key as any, value) === false)
				return false;

		for (const cb of internal.observers)
			cb(key as any, value as any);

		const newState = { state: internal.state };

		for (const cb of internal.dispatchers)
			cb(newState);

		return true;
	};

	function wrapState<T extends {}, Args extends any[]>(StateClass: new (...args: Args) => T, ...args: Args): ProxyState<T>;
	function wrapState<T>(state: T, ...args: any[])
	{
		if (isClass(state))
		{
			if (isWrappedClass(state))
			{
				if (globalClassStates.has(state))
				{
					if (globalClassStates.get(state) === null)
						globalClassStates.set(state, new state(...args));

					return globalClassStates.get(state);
				}

				return new state(...args);
			}
			else
			{
				return new (wrap(state) as any)(...args);
			}
		}
		else
		{
			const s = typeof state === "function" ? state() : state;

			if (!isState(s))
			{
				return create(s);
			}

			return s;
		}
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

	const persistentMap = new Map<string, any>();

	export const createPersistent = <T extends {}>(name: string, state: T): T =>
	{
		if (persistentMap.has(name))
			return persistentMap.get(name);

		const s = State.create(state);

		const foundState = localStorage.getItem(name);

		if (foundState)
			Object.assign(s, JSON.parse(foundState));

		persistentMap.set(name, s);

		observe(s, (key: any, value: any) => 
		{
			localStorage.setItem(name, JSON.stringify({ ...state, [key]: value } as any))
		});

		return s;
	};

	export const clearPersistent = () =>
	{
		for (const [name, state] of persistentMap)
		{
			State.reset(state);
			localStorage.removeItem(name);
		}
	};

	export const useObserve = <T extends {}>(state: T, observer: ObserveCallback<T>) =>
	{
		return React.useEffect(() => observe(state, observer).revoke, []);
	};

	export const reset = <T extends {}>(state: T) =>
	{
		if (!isState(state))
			return console.warn("Given object is not a state object!");

		if (state[INTERNAL].resolver)
		{
			resolve(state[INTERNAL] as any);
		}
		else
		{
			Object.assign(state, clone(state[INTERNAL].initState));
		}
	};

	export const createAsyncPersistent = <T>(name: string, resolver: AsyncResolver<T>): AsyncState<T> =>
	{
		if (persistentMap.has(name))
			return persistentMap.get(name);

		const foundState = JSON.parse(localStorage.getItem(name) || "undefined") as AsyncState<T>;

		const shouldResolve = !(foundState !== undefined && (foundState.error || foundState.data));

		const internal = createAsyncInternal(resolver, shouldResolve);

		if (foundState)
			Object.assign(internal.state, foundState);

		persistentMap.set(name, internal.state);

		observe(internal.state, (key: any, val: any) => 
		{
			localStorage.setItem(name, JSON.stringify({ ...internal.state, [key]: val }))
		});

		return internal.state;
	};
};