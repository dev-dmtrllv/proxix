export declare namespace State {
    type Change<T extends {}> = {
        [K in keyof T]: [K, T[K]];
    }[keyof T];
    type ObserveCallback<T extends {}> = (change: Change<T>) => void;
    type InterceptCallback<T extends {}> = (change: Change<T>) => (void | boolean);
    type Revoker = {
        readonly revoke: () => void;
    };
    export const create: <T extends {}>(state: T) => T;
    export const wrap: <T extends new (...args: any[]) => any>(Class: T) => T;
    export function use<T, Args extends any[]>(StateClass: new (...args: Args) => T, ...args: Args): T;
    export function use<T extends {}>(state: T): T;
    export const observe: <T extends {}>(state: T, observer: ObserveCallback<T>) => Revoker;
    export const intercept: <T extends {}>(state: T, interceptor: InterceptCallback<T>) => Revoker;
    export {};
}
