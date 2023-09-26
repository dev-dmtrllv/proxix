export declare namespace State {
    const create: <T extends {}>(state: T) => T;
    const wrap: <T extends new (...args: any[]) => any>(Class: T) => T;
    function use<T, Args extends any[]>(StateClass: new (...args: Args) => T, ...args: Args): T;
    function use<T extends {}>(state: T): T;
}
