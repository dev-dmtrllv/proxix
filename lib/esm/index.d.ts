import React from "react";
export declare namespace State {
    type ObserveCallback<T extends {}> = (...args: {
        [K in keyof T]: [Readonly<K>, Readonly<T[K]>, Readonly<T>, Readonly<T>];
    }[keyof T]) => any;
    type InterceptCallback<T extends {}> = (...args: {
        [K in keyof T]: [Readonly<K>, Readonly<T[K]>, Readonly<T>, Readonly<T>];
    }[keyof T]) => void | boolean;
    type Observer = {
        readonly remove: () => void;
    };
    type Interceptor = {
        readonly remove: () => void;
    };
    type Dispatcher<T extends {}> = React.Dispatch<React.SetStateAction<{
        state: T;
    }>>;
    type Type<T extends {}> = T & {
        [DISPATCHERS]: Dispatcher<T>[];
        [OBSERVERS]: ObserveCallback<T>[];
        [INTERCEPTORS]: InterceptCallback<T>[];
        [BATCH_UPDATES]: boolean;
        [RESETTER]: () => void;
    };
    type Initializer<T extends {}> = () => T;
    type AsyncInitializer<T extends {}> = () => Promise<T>;
    const DISPATCHERS: unique symbol;
    const OBSERVERS: unique symbol;
    const INTERCEPTORS: unique symbol;
    const BATCH_UPDATES: unique symbol;
    const RESETTER: unique symbol;
    export const isState: <T extends {}>(obj: T) => obj is Type<T>;
    export const create: <T extends {}>(initState: T | (() => T)) => T;
    export const createAsync: <T extends {}>(initializer: AsyncInitializer<T>) => Promise<T>;
    export const use: <T extends {}>(state: T) => T;
    export const observe: <T extends {}>(state: T, callback: ObserveCallback<T>) => Observer;
    export const intercept: <T extends {}>(state: T, callback: InterceptCallback<T>) => Interceptor;
    export const update: <T extends {}>(state: T, updater: (state: T) => any) => void;
    export const reset: <T extends {}>(state: T) => void;
    export const createPersistent: <T extends {}>(name: string, initState: T | Initializer<T>) => T;
    export const createPersistentAsync: <T extends {}>(name: string, initState: AsyncInitializer<T>) => Promise<T>;
    export {};
}
