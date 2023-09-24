import React from "react";

export namespace State
{
	// TODO: Implent a deep copy algorithm

	const clone = <T>(obj: T): T =>
	{
		const type = typeof obj;
		
		if(obj && (type === "object"))
		{
			if(Array.isArray(obj))
			{
				const newArray = new Array(obj.length);
				for(let i = 0; i != obj.length; i++)
					newArray[i] = clone(obj[i]);
				return newArray as T;
			}
			else
			{
				const newObj = {} as any;
				for(const k in obj)
					newObj[k] = clone(obj[k]);
				return newObj;
			}
		}

		return obj;
	};

	type AsyncState<T> = (T extends { data: infer D } ? AsyncState<D> : ({
		data: NonNullable<T>;
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
	})) & AsyncHandlers<T>;

	type AsyncHandlers<T> = Readonly<{
		reset(prefetch?: boolean | undefined): Promise<void>;
		update(resolver: () => Promise<T>, prefetch?: boolean | undefined): Promise<void>;
		cancel(): void;
	}>;

	type AsyncCancelToken = {
		canceled: boolean;
		isResolving: boolean;
	};

	type AsyncResolver<T> = () => Promise<T>;

	type Wrapped<T extends {}> = {
		[K in keyof T]: T[K] extends {} ? Wrapped<T[K]> : T[K];
	} & {
		[INTERNAL]: Internal<any>;
		[ORIGINAL]: Internal<any>;
	};

	type Dispatcher<T extends {} = any> = React.Dispatch<React.SetStateAction<{ internal: Internal<T> }>>;

	type ObserveCallback<T extends {}> = (key: any, val: any, oldState: T, newState: T) => void;
	type InterceptorCallback<T extends {}> = (key: any, val: any, oldState: T, newState: T) => void | boolean;

	type Observer = {
		remove: () => void;
	};

	type Interceptor = {
		remove: () => void;
	};

	type Internal<T extends {}> = {
		state: Wrapped<T>;
		cleanState: T;
		initialState: T;
		[INTERCEPTORS]: InterceptorCallback<any>[];
		[OBSERVERS]: ObserveCallback<any>[];
		[DISPATCHERS]: Dispatcher[];
	};

	type AsyncInternal<T extends {}> = Internal<T> & {
		[ASYNC_TAG]: true;
	};

	const INTERNAL = Symbol("INTERNAL");
	const ORIGINAL = Symbol("ORIGINAL");
	const OBSERVERS = Symbol("OBSERVERS");
	const DISPATCHERS = Symbol("DISPATCHERS");
	const INTERCEPTORS = Symbol("INTERCEPTORS");
	const ASYNC_TAG = Symbol("ASYNC_TAG");

	const isState = (obj: any): obj is Wrapped<any> => obj && (typeof obj === "object") && ((obj)[INTERNAL] !== undefined);
	const isAsync = (obj: any): obj is AsyncState<any> => obj && (typeof obj === "object") && ((obj)[ASYNC_TAG] !== undefined)

	const getInternal = <T extends {}>(state: T): Internal<any> =>
	{
		if (!isState(state))
			throw new Error("Could not get internals!");
		return state[INTERNAL];
	};

	const getObservers = <T extends {}>(state: T): ObserveCallback<any>[] => getInternal(state)[OBSERVERS];

	const getInterceptors = <T extends {}>(state: T): InterceptorCallback<any>[] => getInternal(state)[INTERCEPTORS];

	const isKeyOf = <T extends {}>(obj: T, key: string | number | symbol): key is keyof typeof obj =>
	{
		return (Array.isArray(obj) && (key == Number(key))) || (obj && (typeof obj === "object") && ((obj as any)[key] !== undefined));
	};

	const wrapChildProxies = <T extends {}>(internal: Internal<any>, value: T, path: string[]): Wrapped<T> =>
	{
		const copy = clone(value) as T;

		for (const k in value)
		{
			const val = value[k];
			if (typeof val === "function")
				copy[k] = val;
			else if (val && (typeof val === "object") && !isState(val))
				copy[k] = createProxy(internal, val, [...path, k]) as any;
		}

		return copy as Wrapped<T>;
	};

	const match = (a: any, b: any) =>
	{
		if (typeof a !== typeof b)
			return false;

		if (Array.isArray(a))
		{
			if (!Array.isArray(b))
				return false;

			if (a.length !== b.length)
				return false;

			for (let i = 0; i !== a.length; i++)
				if (a[i] !== b[i])
					return false;

			return true;
		}

		if (typeof a === "object" && a && b)
		{
			if (!match(Object.keys(a), Object.keys(b)))
				return false;

			for (const k in a)
				if (a[k] !== b[k])
					return false;

			return true;
		}

		return a === b;
	};

	const createProxy = <T extends {}>(internal: Internal<any>, original: T, path: string[], asyncHandlers: AsyncHandlers<T> | undefined = undefined): Wrapped<T> =>
	{
		const wrapped = wrapChildProxies(internal, original, path);

		return new Proxy(wrapped, {
			get(target, p)
			{
				const k = p as keyof typeof target;
				switch (k)
				{
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
			set(target, p, newValue)
			{
				const k = p as keyof typeof target;

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

				internal[INTERCEPTORS].forEach(callbackfn => 
				{
					if (callbackfn(propertyPath, newValue, oldState, internal.cleanState) === false)
						canceled = true;
				});

				if (canceled)
					return true;

				internal[OBSERVERS].forEach(callbackfn => callbackfn(propertyPath, newValue, oldState, internal.cleanState));

				if (isNewValueState)
				{
					original[k as keyof typeof original] = newValue[ORIGINAL] as any;
					target[k] = newValue as any;
				}
				else
				{
					original[k as keyof typeof original] = newValue;

					if (newValue && typeof newValue === "object")
						target[k] = createProxy(internal, newValue, propertyPaths) as any;
					else
						target[k] = newValue;
				}

				const newDispatchState = { internal };

				internal[DISPATCHERS].forEach(update => update(newDispatchState));

				return true;
			}
		}) as Wrapped<T>;
	};

	export const create = <T extends {}>(state: T, asyncHandlers: AsyncHandlers<T extends AsyncState<infer R> ? R : T> | undefined = undefined): T =>
	{
		const internal: Partial<Internal<T>> = {
			initialState: clone(state),
			cleanState: state,
			[INTERCEPTORS]: [],
			[OBSERVERS]: [],
			[DISPATCHERS]: []
		};

		if (asyncHandlers !== undefined)
		{
			const internalAsync = internal as AsyncInternal<T>;
			internalAsync[ASYNC_TAG] = true;
		}

		internal.state = createProxy(internal as Required<Internal<T>>, state, [], asyncHandlers as any);

		return internal.state! as T;
	};

	const resolveAsyncState = <T>(state: AsyncState<T>, resolver: AsyncResolver<T>, token: AsyncCancelToken) =>
	{
		token.isResolving = true;

		const update = (data: T | undefined, error?: Error) =>
		{
			token.isResolving = false;

			if (token.canceled)
			{
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

			if (keys.includes("data") && keys.includes("error"))
			{
				state.data = (data as any).data;
				state.error = (data as any).error;
				state.isLoading = false;
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

	const createAsyncInternal = <T>(resolver: AsyncResolver<T>, resolve: boolean): AsyncState<T> =>
	{
		let currentResolver: { resolver: AsyncResolver<T> } = { resolver };

		const cancelToken: AsyncCancelToken = { isResolving: false, canceled: false };

		const reset = async (prefetch?: boolean) => 
		{
			if (!prefetch)
				Object.assign(state, {
					isLoading: true,
					data: undefined,
					error: undefined,
					isCanceled: false
				});

			await resolveAsyncState(state, currentResolver.resolver, cancelToken);
		};

		const state = create<AsyncState<T>>({
			isLoading: true,
			data: undefined,
			error: undefined,
		} as any, {
			cancel: () =>
			{
				if (cancelToken.isResolving)
					cancelToken.canceled = true;
			},
			reset,
			update: async (resolver, prefetch) => 
			{
				if (cancelToken.isResolving)
					return;

				currentResolver.resolver = resolver as any;
				await reset(prefetch);
			}
		});

		if (resolve)
			resolveAsyncState(state, currentResolver.resolver, cancelToken);

		return state;
	};

	export const createAsync = <T>(resolver: AsyncResolver<T>): AsyncState<T> => createAsyncInternal(resolver, true);

	export const createAsyncPersistent = <T>(name: string, resolver: AsyncResolver<T>): AsyncState<T> =>
	{
		if (persistentMap.has(name))
			return persistentMap.get(name);

		const foundState = JSON.parse(localStorage.getItem(name) || "null") as AsyncState<T>;

		const s = createAsyncInternal(resolver, foundState == null || foundState.isCanceled || foundState.isLoading);

		if (foundState)
			Object.assign(s, foundState);

		persistentMap.set(name, s);

		observe(s, (_key, _val, _oldState, newState) => localStorage.setItem(name, JSON.stringify(newState)));

		return s as any;
	};

	export const observe = <T extends {}>(state: T, observer: ObserveCallback<T>): Observer =>
	{
		const observers = getObservers(state);
		if (!observers.includes(observer))
			observers.push(observer);

		return {
			remove: () => observers.splice(observers.indexOf(observer), 1)
		};
	};

	export const intercept = <T extends {}>(state: T, interceptor: InterceptorCallback<T>): Interceptor =>
	{
		const interceptors = getInterceptors(state);
		if (!interceptors.includes(interceptor))
			interceptors.push(interceptor);

		return {
			remove: () => interceptors.splice(interceptors.indexOf(interceptor), 1)
		};
	};

	export const reset = <T extends {}>(state: T) => 
	{
		if (isAsync(state))
		{
			state.reset();
		}
		else
		{
			Object.assign(state, clone(getInternal(state).initialState));
		}
	};

	export const use = <T extends {}>(state: T): T =>
	{
		const [_state, _setState] = React.useState<{ internal: Internal<T> }>({ internal: (isState(state) ? state[INTERNAL] : (create(state) as any)[INTERNAL]) as any });

		React.useEffect(() => 
		{
			_state.internal[DISPATCHERS].push(_setState);
			return () => { _state.internal[DISPATCHERS].splice(_state.internal[DISPATCHERS].indexOf(_setState), 1); };
		}, [_state, _setState]);

		return _state.internal.state as T;
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

		observe(s, (_key, _val, _oldState, newState) => localStorage.setItem(name, JSON.stringify(newState)));

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
		return React.useEffect(() => observe(state, observer).remove, []);
	};
}
