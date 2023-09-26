declare global {
    interface ProxyConstructor {
        revocable<T extends object>(target: T, handler: ProxyHandler<T>): {
            proxy: T;
            revoke: () => void;
        };
        new <T extends object>(target: T, handler: BetterProxyHandler<T>): T;
    }
    interface BetterProxyHandler<T extends object> {
        apply?(target: T, thisArg: any, argArray: any[]): any;
        construct?(target: T, argArray: any[], newTarget: Function): object;
        defineProperty?(target: T, property: keyof T, attributes: PropertyDescriptor): boolean;
        deleteProperty?(target: T, p: keyof T): boolean;
        get?(target: T, p: keyof T, receiver: any): any;
        getOwnPropertyDescriptor?(target: T, p: keyof T): PropertyDescriptor | undefined;
        getPrototypeOf?(target: T): object | null;
        has?(target: T, p: keyof T): boolean;
        isExtensible?(target: T): boolean;
        ownKeys?(target: T): ArrayLike<string | symbol>;
        preventExtensions?(target: T): boolean;
        set?(target: T, p: keyof T, newValue: any, receiver: any): boolean;
        setPrototypeOf?(target: T, v: object | null): boolean;
    }
}
