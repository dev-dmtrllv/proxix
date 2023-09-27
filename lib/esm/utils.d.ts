export declare const isClass: (x: any) => x is new (...args: any[]) => any;
export declare const match: (a: any, b: any) => boolean;
type Primitive = number | bigint | string | boolean | symbol | null | undefined;
export declare const isPrimitive: (obj: any) => obj is Primitive;
export declare const clone: <T>(obj: T) => T;
export {};
