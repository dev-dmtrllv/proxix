export declare namespace State {
    type AsyncState<T> = (T extends {
        data: infer D;
    } ? AsyncState<D> : ({
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
    type AsyncResolver<T> = () => Promise<T>;
    type ObserveCallback<T extends {}> = (key: any, val: any, oldState: T, newState: T) => void;
    type InterceptorCallback<T extends {}> = (key: any, val: any, oldState: T, newState: T) => void | boolean;
    type Observer = {
        remove: () => void;
    };
    type Interceptor = {
        remove: () => void;
    };
    export const create: <T extends {}>(state: T, asyncHandlers?: Readonly<{
        reset(prefetch?: boolean | undefined): Promise<void>;
        update(resolver: () => Promise<T extends AsyncState<infer R> ? R : T>, prefetch?: boolean | undefined): Promise<void>;
        cancel(): void;
    }> | undefined) => T;
    export const createAsync: <T>(resolver: AsyncResolver<T>) => AsyncState<T>;
    export const createAsyncPersistent: <T>(name: string, resolver: AsyncResolver<T>) => AsyncState<T>;
    export const observe: <T extends {}>(state: T, observer: ObserveCallback<T>) => Observer;
    export const intercept: <T extends {}>(state: T, interceptor: InterceptorCallback<T>) => Interceptor;
    export const reset: <T extends {}>(state: T) => void;
    export const use: <T extends {}>(state: T) => T;
    export const createPersistent: <T extends {}>(name: string, state: T) => T;
    export const clearPersistent: () => void;
    export const useObserve: <T extends {}>(state: T, observer: ObserveCallback<T>) => void;
    export {};
}
