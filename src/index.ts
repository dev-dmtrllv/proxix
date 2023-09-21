import React from "react";
import ReactDOM from "react-dom";

export namespace State
{
	type ObserveCallback<T extends {}> = (...args: { [K in keyof T]: [K, T[K], T, T] }[keyof T]) => any;
	type InterceptCallback<T extends {}> = (...args: { [K in keyof T]: [K, T[K], T] }[keyof T]) => void | boolean;

	type Observer = {
		readonly remove: () => void;
	};

	type Interceptor = {
		readonly remove: () => void;
	};

	type Dispatcher<T extends {}> = React.Dispatch<React.SetStateAction<{ state: T }>>;

	type Type<T extends {}> = T & {
		[DISPATCHERS]: Dispatcher<T>[];
		[OBSERVERS]: ObserveCallback<T>[];
		[INTERCEPTORS]: InterceptCallback<T>[];
		[BATCH_UPDATES]: boolean;
		[RESETTER]: () => void;
	};

	type Initializer<T extends {}> = () => T;
	type AsyncInitializer<T extends {}> = () => Promise<T>;

	const DISPATCHERS = Symbol("DISPATCHERS");
	const OBSERVERS = Symbol("OBSERVERS");
	const INTERCEPTORS = Symbol("INTERCEPTORS");
	const BATCH_UPDATES = Symbol("BATCH_UPDATES");
	const RESETTER = Symbol("BATCH_UPDATES");

	export const isState = <T extends {}>(obj: T): obj is Type<T> => obj && (typeof obj === "object") && (Array.isArray((obj as any)[DISPATCHERS]));

	const registerStateDispatcher = <T extends {}>(state: T, dispatcher: Dispatcher<T>) =>
	{
		if (!isState(state))
			throw new Error(`Object is not a state object!`);

		if (!state[DISPATCHERS].includes(dispatcher))
			state[DISPATCHERS].push(dispatcher);
	};

	const removeStateDispatcher = <T extends {}>(state: T, dispatcher: Dispatcher<T>) =>
	{
		if (!isState(state))
			throw new Error(`Object is not a state object!`);

		if (state[DISPATCHERS].includes(dispatcher))
			state[DISPATCHERS].splice(state[DISPATCHERS].indexOf(dispatcher), 1);
	};

	const registerObserver = <T extends {}>(state: T, callback: ObserveCallback<T>) =>
	{
		if (!isState(state))
			throw new Error(`Object is not a state object!`);

		if (!state[OBSERVERS].includes(callback))
			state[OBSERVERS].push(callback);
	};

	const removeObserver = <T extends {}>(state: T, callback: ObserveCallback<T>) =>
	{
		if (!isState(state))
			throw new Error(`Object is not a state object!`);

		if (state[OBSERVERS].includes(callback))
			state[OBSERVERS].splice(state[OBSERVERS].indexOf(callback), 1);
	};

	const registerInterceptor = <T extends {}>(state: T, callback: InterceptCallback<T>) =>
	{
		if (!isState(state))
			throw new Error(`Object is not a state object!`);

		if (!state[INTERCEPTORS].includes(callback))
			state[INTERCEPTORS].push(callback);
	};

	const removeInterceptor = <T extends {}>(state: T, callback: InterceptCallback<T>) =>
	{
		if (!isState(state))
			throw new Error(`Object is not a state object!`);

		if (state[INTERCEPTORS].includes(callback))
			state[INTERCEPTORS].splice(state[INTERCEPTORS].indexOf(callback), 1);
	};

	const dispatchStateChange = <T extends {}, K extends keyof T>(state: T, key: K, value: T[K]): boolean =>
	{
		if (!isState(state))
			throw new Error(`Object is not a state object!`);

		let canceled = false;

		const interceptCallbacks = state[INTERCEPTORS];

		for (const callback of interceptCallbacks)
			if (callback(key, value, state) === false)
				canceled = true;

		if (canceled)
			return false;

		const observeCallbacks = state[OBSERVERS];
		
		for (const callback of observeCallbacks)
			callback(key, value, state, { ...state, [key]: value });

		return true;
	};

	const dispatchStateUpdate = <T extends {}>(state: T) =>
	{
		if (!isState(state))
			throw new Error(`Object is not a state object!`);

		const stateDispatchers = state[DISPATCHERS];

		ReactDOM.unstable_batchedUpdates(() =>
		{
			const newState = { state };
			stateDispatchers.forEach(dispatch => dispatch(newState));
		});
	};

	const isInitializer = <T extends {}>(obj: any): obj is Initializer<T> => typeof obj === "function";

	export const create = <T extends {}>(initState: T | (() => T)): T =>
	{
		const state = isInitializer(initState) ? initState() : initState;

		const stateDispatchers: Dispatcher<T>[] = [];
		const observeCallbacks: ObserveCallback<T>[] = [];
		const interceptCallbacks: InterceptCallback<T>[] = [];

		let batchUpdates = false;

		const initialState = structuredClone(state);

		const reset = () => update(proxy, () => Object.assign(proxy, structuredClone(initialState)));

		const wrapProxy = <T extends {}>(obj: T) => new Proxy(obj, {
			get(state, prop, _proxy)
			{
				const key = prop as keyof T;
				switch (key)
				{
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
			set(state, prop, newValue, proxy)
			{
				const key = prop as keyof T;

				if (state[key] === newValue)
					return true;

				if (dispatchStateChange(proxy, key, newValue))
					state[key] = newValue;

				if (!batchUpdates)
					dispatchStateUpdate(proxy);

				return true;
			}
		});

		const wrapProxiesRecursive = (state: any) =>
		{
			for (const k in state)
				if (typeof state[k] === "object" && state[k] && !isState(state[k]))
					state[k] = wrapProxiesRecursive(state[k]);

			return wrapProxy(state);
		};

		const proxy = wrapProxiesRecursive(state);

		return proxy;
	};

	export const createAsync = async <T extends {}>(initializer: AsyncInitializer<T>): Promise<T> => create(await initializer());

	export const use = <T extends {}>(state: T): T =>
	{
		const [_state, _setState] = React.useState<{ state: Type<T> }>(() => ({ state: isState(state) ? state : create(state) }) as { state: Type<T> });

		React.useEffect(() => 
		{
			registerStateDispatcher(_state.state, _setState);
			return () => removeStateDispatcher(_state.state, _setState);
		}, [_state, _setState]);

		return _state.state;
	};

	export const observe = <T extends {}>(state: T, callback: ObserveCallback<T>): Observer =>
	{
		if (!isState(state))
			throw new Error(`Object is not a state object!`);

		registerObserver(state, callback as any);

		return Object.freeze({
			remove: () => removeObserver(state, callback as any)
		});
	};

	export const intercept = <T extends {}>(state: T, callback: InterceptCallback<T>): Interceptor =>
	{
		if (!isState(state))
			throw new Error(`Object is not a state object!`);

		registerInterceptor(state, callback as any);

		return Object.freeze({
			remove: () => removeInterceptor(state, callback as any)
		});
	};

	export const update = <T extends {}>(state: T, updater: (state: T) => any) => 
	{
		if (!isState(state))
			throw new Error(`Object is not a state object!`);

		state[BATCH_UPDATES] = true;
		updater(state);
		state[BATCH_UPDATES] = false;
		dispatchStateUpdate(state);
	};

	export const reset = <T extends {}>(state: T) =>
	{
		if (!isState(state))
			throw new Error(`Object is not a state object!`);

		state[RESETTER]();
	};

	const usedPersistenNames: string[] = [];

	export const createPersistent = <T extends {}>(name: string, initState: T | Initializer<T>): T =>
	{
		if (usedPersistenNames.includes(name))
			throw new Error(`Name ${name} is already used!`);

		const state = isInitializer(initState) ? initState() : initState;

		const get = (): T | null => 
		{
			const dataString = localStorage.getItem(name);
			return dataString ? JSON.parse(dataString) : state;
		};

		const set = (state: T) => localStorage.setItem(name, JSON.stringify(state));

		if (!localStorage.getItem(name))
			set(state);

		const proxyState = create(state);

		update(proxyState, () => Object.assign(proxyState, get()!));

		observe(proxyState as T, (_a, _b, _c, newState) => set(newState));

		return proxyState;
	};

	export const createPersistentAsync = async <T extends {}>(name: string, initState: AsyncInitializer<T>): Promise<T> =>
	{
		return createPersistent(name, await initState());
	}
}
