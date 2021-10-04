declare module "events" {
    export = EventEmitter;
    function EventEmitter(): void;
    class EventEmitter {
        /** @internal */
        _events: any;
        /** @internal */
        _eventsCount: number;
        /** @internal */
        _maxListeners: number;
        setMaxListeners(n: any): EventEmitter;
        getMaxListeners(): any;
        emit(type: any, ...args: any[]): boolean;
        addListener(type: any, listener: any): any;
        on: any;
        prependListener(type: any, listener: any): any;
        once(type: any, listener: any): EventEmitter;
        prependOnceListener(type: any, listener: any): EventEmitter;
        removeListener(type: any, listener: any): EventEmitter;
        off: any;
        removeAllListeners(type: any, ...args: any[]): EventEmitter;
        listeners(type: any): any[];
        rawListeners(type: any): any[];
        listenerCount: typeof listenerCount;
        eventNames(): any;
    }
    namespace EventEmitter {
        export { EventEmitter, defaultMaxListeners, init, listenerCount, once };
    }
    function listenerCount(type: any): any;
    var defaultMaxListeners: number;
    function init(): void;
    function listenerCount(emitter: any, type: any): any;
    function once(emitter: any, name: any): Promise<any>;
}
