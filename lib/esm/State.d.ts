type PathImpl<T, K extends keyof T> = K extends string ? T[K] extends Record<string, any> ? T[K] extends ArrayLike<any> ? K | `${K}.${PathImpl<T[K], Exclude<keyof T[K], keyof any[]>>}` : K | `${K}.${PathImpl<T[K], keyof T[K]>}` : K : never;
type Path<T> = PathImpl<T, keyof T> | keyof T;
type PathValue<T, P extends Path<T>> = P extends `${infer K}.${infer Rest}` ? K extends keyof T ? Rest extends Path<T[K]> ? PathValue<T[K], Rest> : never : never : P extends keyof T ? T[P] : never;
type Change<T extends {}, K extends Path<T>> = {
    [K in Path<T>]: [K, PathValue<T, K>];
}[K];
type ObserveCallback<T extends {}> = (...args: Change<T, Path<T>>) => void;
type InterceptCallback<T extends {}> = (...args: Change<T, Path<T>>) => (void | boolean);
type Revoker = {
    readonly revoke: () => void;
};
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
/**
 * @param state A state object which will automatically update all components that uses it.
 * @returns The state object.
 */
export declare const create: <T extends {}>(state: T) => T;
/**
 * @param resolver An async function that will be resolved.
 * @returns An `AsyncState` wrapped around the data or error returned by the async function.
 */
export declare const createAsync: <T>(resolver: AsyncResolver<T>, resolve?: boolean) => AsyncState<T>;
/**
 * A class decorator to create a singleton based state object.
 */
export declare const global: <T extends new (...args: any[]) => any>(Class: T) => T;
/**
 * A decorator which enables updating components on property change.
 */
export declare const observable: PropertyDecorator;
/**
 * @summary A react hook to update the component on a state change.
 * @param StateClass A state class.
 * @param args The arguments which will be passed to the state class constructor.
 */
export declare function use<T, Args extends any[]>(StateClass: new (...args: Args) => T, ...args: Args): T;
/**
 * @summary A react hook to update the component on a state change.
 * @param state A state object.
 */
export declare function use<T extends {}>(state: T): T;
/**
 * @summary A react hook to update the component on a state change.
 * @param state A state object.
 */
export declare const useAsync: <T extends {}>(state: T, resolveOnMount?: boolean) => T;
/**
 * @param StateClass A state class.
 * @param observer The observe callback which will be called when the state will change.
 */
export declare function observe<T extends {}, Args extends any[]>(StateClass: new (...args: Args) => T, observer: ObserveCallback<T>): Revoker;
/**
 * @param state A state object.
 * @param observer The observe callback which will be called when the state will change.
 */
export declare function observe<T extends {}>(state: T, observer: ObserveCallback<T>): Revoker;
/**
 * @summary When the interceptor returns false, then the state change will be canceled.
 * @param StateClass A state class.
 * @param interceptor The intercept callback which will be called when the state will change.
 */
export declare function intercept<T extends {}, Args extends any[]>(StateClass: new (...args: Args) => T, interceptor: InterceptCallback<T>): Revoker;
/**
 * @summary When the interceptor returns false, then the state change will be canceled.
 * @param state A state object.
 * @param interceptor The intercept callback which will be called when the state will change.
 */
export declare function intercept<T extends {}>(state: T, interceptor: InterceptCallback<T>): Revoker;
/**
 * @param name The name which will be used to store and retreive the state from the localStorage.
 * @param state The state object.
 * @returns The state object.
 */
export declare const createPersistent: <T extends {}>(name: string, state: T) => T;
/**
 * Clears all the persistent states.
 */
export declare const clearPersistent: () => void;
/**
 * @param state The state object to observe.
 * @param observer The observe callback.
 */
export declare const useObserve: <T extends {}>(state: T, observer: ObserveCallback<T>) => void;
/**
 * @param state The state object to reset.
 */
export declare const reset: <T extends {}>(state: T) => void;
/**
 * @param name The name which will be used to store and retreive the state from the localStorage.
 * @param resolver An async function that will be resolved.
 * @returns An `AsyncState` wrapped around the data or error returned by the async function.
 */
export declare const createAsyncPersistent: <T>(name: string, resolver: AsyncResolver<T>) => AsyncState<T>;
/**
 * @param state The global state class.
 * @returns The instance of the global state class.
 */
export declare const getGlobal: <T extends {}>(state: new (...args: any) => T) => T;
export declare const resolveAll: () => Promise<void>;
export {};
