export declare namespace State {
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
    export const create: <T extends {}>(state: T) => T;
    export const createAsync: <T>(resolver: AsyncResolver<T>) => AsyncState<T>;
    export const global: <T extends new (...args: any[]) => any>(Class: T) => T;
    export function use<T, Args extends any[]>(StateClass: new (...args: Args) => T, ...args: Args): T;
    export function use<T extends {}>(state: T): T;
    export const observe: <T extends {}>(state: T, observer: ObserveCallback<T>) => Revoker;
    export const intercept: <T extends {}>(state: T, interceptor: InterceptCallback<T>) => Revoker;
    export const createPersistent: <T extends {}>(name: string, state: T) => T;
    export const clearPersistent: () => void;
    export const useObserve: <T extends {}>(state: T, observer: ObserveCallback<T>) => void;
    export const reset: <T extends {}>(state: T) => void;
    export const createAsyncPersistent: <T>(name: string, resolver: AsyncResolver<T>) => AsyncState<T>;
    export {};
}
