declare module 'game-inputs' {
    export interface IGameInputOptions {
        /** @default false */
        preventDefaults?: boolean;

        /** @default false */
        stopPropagation?: boolean;

        /** @default false */
        allowContextMenu?: boolean;

        /** @default false */
        disabled?: boolean;
    }

    export interface GameInputs {
        /**
         * @example inputs.down.on( 'move-right',  function( binding, event ) {})
         */
        down: EventEmitter;

        /**
         * @example inputs.up.on(   'move-right',  function( binding, event ) {})
         */
        up: EventEmitter;

        /** state object to be queried */
        state: {
            dx: number;
            dy: number;
            scrollx: number;
            scrolly: number;
            scrollz: number;

            fire: boolean;
        }
        
        _keybindmap: { [key: string]: any[] };
        _keyStates: { [key: string]: boolean };
        _bindPressCounts: { [key: string]: number };

        /**
         * needed to work around a bug in Mac Chrome 75
         * https://bugs.chromium.org/p/chromium/issues/detail?id=977093
         */
        _ignoreMousemoveOnce: boolean;

        /** register for dom events */
        initEvents();

        /**
         * Note that inputs._keybindmap maps vkey codes to binding names
         * @param binding 
         * 
         * @example inputs.bind('move-right', 'D', '<right>')
         * @example inputs.bind('move-left', 'A')
         */
        bind(binding: any): any;

        /**
         * search out and remove all keycodes bound to a given binding
         * 
         * @example inputs.unbind('move-left')
         */
        unbind(binding: any): any;

        /** tick function - clears out cumulative mouse movement state variables */
        tick(): void;

        getBoundKeys(): void;

        /**
         * @returns [ 'move-right', 'move-left', ... ]
         */
        getBindings(): string[];
    }

    /**
     * Simple inputs manager to abstract key/mouse inputs.
     *    Inspired by (and where applicable stealing code from) 
     *    game-shell: https://github.com/mikolalysenko/game-shell
     * 
     * inputs.state['move-right']  // true when corresponding keys are down
     * inputs.state.dx             // mouse x movement since tick() was last called
     * 
     * @param domElement defaults to document
     * @param options optional
     */
    export default function(domElement?: HTMLElement, options?: IGameInputOptions): GameInputs;
}
