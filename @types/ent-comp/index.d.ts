declare module 'ent-comp' {
    /**
     * Component Definition.
     * @template T Use the generic T parameter to describe the Component's custom state.
     */
    export interface Component<T extends StateWithID> {
        /**
         * Name of the component
         */
        name: string;
        /**
         * Order to execute the components in
         */
        order?: number;
        /**
         * Default state of the component
         */
        state?: Omit<T, '__id'>;
        /**
         * Called when the component is added to an entity.
         * @param id The entity's ID.
         * @param state The components's new state.
         */
        onAdd?: (id: number, state: T) => void;
        /**
         * Called when the component is removed from an entity.
         * @param id The entity's ID.
         * @param state The components's current state.
         */
        onRemove?: (id: number, state: T) => void;
        /**
         * Use this for any external events that need to be sent to the component.
         * (This is never called by ent-comp).
         * @param event The name of the event.
         * @param id The entity's ID.
         * @param state The component's current state.
         * @returns Any value you want back from the event handler.
         */
        onExternalEvent?: (event: string, id: number, state: T) => any;
        /**
         * Called every tick to process that component.
         * @param dt Length of one tick in ms.
         * @param states Array of all states of this component type.
         */
        system?: (dt: number, states: Array<T>) => void;
        /**
         * Called every tick to render that component.
         * @param dt Length of one render tick in ms.
         * @param states Array of all states of this component type.
         */
        renderSystem?: (dt: number, states: Array<T>) => void;
    }
    /**
     * Component state object with an __id referring to the entity that owns it.
     */
    export interface StateWithID {
        /**
         * The id of the entity this state refers to
         */
        __id: number;
    }
    /**
     * Component state object with an unknown shape.
     * (Use this for states that you don't know the shape of).
     */
    export interface UnknownStateWithID extends StateWithID {
        [key: string]: any;
    }
    /**
     * A `getState`-like accessor function bound to a given component name.
     * @param entID The id of the entity to get from.
     * @returns The state of that entity's component.
     */
    export declare type StateAccessor<T extends StateWithID> = ((entID: number) => T | undefined);
    /**
     * A `hasComponent`-like accessor function bound to a given component name.
     * @param entID the id of the entity to get from.
     * @returns True if that entity has that component.
     */
    export declare type ComponentAccessor = (entID: number) => boolean;
    export default class ECS {
        /**
         * Map of component definitions
         *
         * @example
         * ```js
         * var comp = { name: 'foo' }
         * ecs.createComponent(comp)
         * ecs.components['foo'] === comp // true
         * ```
         */
        components: {
            [name: string]: Component<any>;
        };
        /**
         * Alias for `components` property.
         * @deprecated
         */
        readonly comps: {
            [name: string]: Component<any>;
        };
        /**
         * Storage for the component states
         */
        private storage;
        /**
         * List of all systems, sorted by execution order
         */
        private systems;
        /**
         * List of all renderSystems, sorted by execution order
         */
        private renderSystems;
        /**
         * List of all entityIds waiting to be removed.
         */
        private deferredEntityRemovals;
        /**
         * List of all single-components waiting to be removed.
         */
        private deferredCompRemovals;
        /**
         * Whether or not a deferral is currently pending.
         */
        private deferralTimeoutPending;
        /**
         * Counter for entity IDs
         */
        private uid;
        /**
         * Default order to use if none specified
         */
        private _defaultOrder;
        /**
         * Constructor for a new entity-component-system manager.
         * @example
         * ```js
         * import EntComp from 'ent-comp';
         * const ecs = new EntComp();
         * // Can also use `new EntComp({ defaultOrder: 15});` to set the default component.order value.
         * ```
         */
        constructor(options?: {
            defaultOrder: number;
        });
        /**
         * The default `order` value of the components.
         */
        defaultOrder: number;
        /**
         * Sort the given list of component names using their component.order value (or the defaultOrder value).
         * NOTE: This mutates the original array, make a copy of it first if you want it immutable.
         * @param componentNames The list of component names to sort.
         */
        sortByOrder(componentNames: string[]): string[];
        /**
         * Create a new entity id (currently just an incrementing integer).
         * @param components (optional) Components to add to the entity (with default state data).
         * @returns The newly created entity's ID.
         *
         * @example
         * ```js
         * var id1 = ecs.createEntity()
         * var id2 = ecs.createEntity([ 'my-component' ])
         * ```
         */
        createEntity(components?: string[]): number;
        /**
         * Delete an entity, which in practice just means removing all its components.
         * By default the actual removal is deferred (since entities will tend to call this
         * on themselves during event handlers, etc).
         *
         * @param entityId The id of the entity to delete.
         * @param immediately Force immediate removal (instead of deferred).
         *
         * @example
         * ```js
         * ecs.deleteEntity(id)
         * ecs.deleteEntity(id2, true) // deletes immediately
         * ```
         */
        deleteEntity(entityId: number, immediately?: boolean): ECS;
        /**
         * Delete an entity; simply removing all of its components.
         * @param entityId The id of the entity to delete.
         */
        private deleteEntityNow;
        /**
         * Create a new component from a definition object.
         * The definition must have a `name` property; all others are optional.
         * @param componentDefinition The definition of the component to create.
         * @returns The newly created component's name.
         *
         * @example
         * ```js
         * var comp = {
         *   name: 'a-unique-string',
         *   state: {},
         *   onAdd:     function(id, state){ },
         *   onRemove:  function(id, state){ },
         *   system:       function(dt, states){ },
         *   renderSystem: function(dt, states){ },
         * }
         * var name = ecs.createComponent( comp )
         * // name == 'a-unique-string'
         * ```
         */
        createComponent<T extends StateWithID>(componentDefinition: Component<T>): string;
        /**
         * Delete the component definition with the given name.
         * First removes the component from all entities that have it.
         * @param componentName The name of the component to delete.
         *
         * @example
         * ```js
         * ecs.deleteComponent( comp.name )
         * ```
         */
        deleteComponent(componentName: string): ECS;
        /**
         * Adds a component to an entity, optionally initializing the state object.
         *
         * @param entityId The id of the entity to add a component to.
         * @param componentName The name of the component to add.
         * @param state The state to set when adding the component
         *
         * @example
         * ```js
         * ecs.createComponent({
         *  name: 'foo',
         *  state: { val: 0 }
         * })
         * ecs.addComponent(id, 'foo', {val:20})
         * ecs.getState(id, 'foo').val // 20
         * ```
         */
        addComponent(entityId: number, componentName: string, state?: any): ECS;
        /**
         * Checks if an entity has a component.
         *
         * @param entityId The id of the entity to check for.
         * @param componentName The name of the component to check for.
         *
         * @example
         * ```js
         * ecs.addComponent(id, 'comp-name')
         * ecs.hasComponent(id, 'comp-name') // true
         * ```
         */
        hasComponent(entityId: number, componentName: string): boolean;
        /**
         * Get all of the components attached to the given entity.
         * @param entityId The entity to get a list of components from.
         *
         * @example
         * ```js
         * ecs.addComponent(id, 'comp-name')
         * ecs.getAllComponents(id) // ['comp-name']
         * ```
         */
        getAllComponents(entityId: number): string[];
        /**
         * Removes a component from an entity, deleting any state data.
         * @param entityId The id of the entity to remove from.
         * @param componentName The name of the component to remove.
         * @param immediately Force immediate removal (instead of deferred).
         *
         * @example
         * ```js
         * ecs.removeComponent(id, 'foo')
         * ecs.hasComponent(id, 'foo') // false
         * ```
         */
        removeComponent(entityId: number, componentName: string, immediately?: boolean): ECS;
        /**
         * Actually remove a component from the given entity.
         * @param entityId The id of the entity to remove the component from.
         * @param componentName The name of the component to remove.
         */
        private removeComponentNow;
        /**
         * Get the component state for a given entity.
         * It will automatically be populated with an `__id` property denoting the entity id.
         * @param entID The id of the entity to get from.
         * @param compName The name of the component to get.
         * @returns The state of the entity's component.
         *
         * @example
         * ```js
         * ecs.createComponent({
         *   name: 'foo',
         *   state: { val: 0 }
         * })
         * ecs.addComponent(id, 'foo')
         * ecs.getState(id, 'foo').val // 0
         * ecs.getState(id, 'foo').__id // equals id
         * ```
         */
        getState(entityId: number, componentName: string): StateWithID | undefined;
        /**
         * Get an array of state objects for every entity with the given component.
         * Each one will have an `__id` property for the entity id it refers to.
         * Don't add or remove elements from the returned list!
         *
         * @param componentName The name of the component to get the states list from.
         *
         * @example
         * ```js
         * var arr = ecs.getStatesList('foo')
         * // returns something shaped like:
         * //   [ {__id:0, x:1},
         * //     {__id:7, x:2}  ]
         * ```
        */
        getStatesList(componentName: string): Array<StateWithID>;
        /**
         * Returns a `getState`-like accessor function bound to a given component name.
         * The accessor is much faster than `getState`, so you should create an accessor
         * for any component whose state you'll be accessing a lot.
         * @param componentName The name of the component to create an accessor for.
         * @returns The state accessor function bound to the component's name.
         *
         * @example
         * ```js
         * ecs.createComponent({
         *   name: 'size',
         *   state: { val: 0 }
         * })
         * ecs.addComponent(id, 'size')
         * var getSize = ecs.getStateAccessor('size')
         * getSize(id).val // 0
         * ```
         */
        getStateAccessor<T extends StateWithID>(componentName: string): StateAccessor<T>;
        /**
         * Returns a `hasComponent`-like accessor function bound to a given component name.
         * The accessor is much faster than `hasComponent`.
         * @param componentName The name of the component to create an accessor for.
         * @returns The component accessor function bound to the component's name.
         *
         * @example
         * ```js
         * ecs.createComponent({
         *  name: 'foo',
         * })
         * ecs.addComponent(id, 'foo')
         * var hasFoo = ecs.getComponentAccessor('foo')
         * hasFoo(id) // true
         * ```
         */
        getComponentAccessor(componentName: string): ComponentAccessor;
        /**
         * Tells the ECS that a game tick has occurred, causing component
         * `system` functions to get called.
         *
         * @param dt The timestep to pass to the system functions.
         *
         * If components have an `order` property, they'll get called in that order
         * (lowest to highest). Component order defaults to `99`.
         *
         * @example
         * ```js
         * ecs.createComponent({
         *  name: foo,
         *  order: 1,
         *  system: function(dt, states) {
         *    // states is the same array you'd get from #getStatesList()
         *    states.forEach(state => {
         *      console.log('Entity ID: ', state.__id)
         *    })
         *  }
         * })
         * ecs.tick(30) // triggers log statements
         * ```
         */
        tick(dt: number): ECS;
        /**
         * Functions exactly like `tick`, but calls `renderSystem` functions.
         * this effectively gives you a second set of systems that are
         * called with separate timing, in case you want to
         * [tick and render in separate loops](http://gafferongames.com/game-physics/fix-your-timestep/)
         * (which you should!).
         *
         * @param dt The timestep to pass to the system functions.
         *
         * @example
         * ```js
         * ecs.createComponent({
         *  name: foo,
         *  order: 5,
         *  renderSystem: function(dt, states) {
         *    // states is the same array you'd get from #getStatesList()
         *  }
         * })
         * ecs.render(1000/60)
         * ```
         */
        render(dt: number): ECS;
        /**
         * Debouncer, called whenever a deferral is queued.
         */
        private makeDeferralTimeout;
        /**
         * Ping all removal queues.
         * Called before and after tick/render, and after deferrals are queued.
         */
        private runAllDeferredRemovals;
        /**
         * Entity removal, processes the queue of entity IDs.
         */
        private doDeferredEntityRemovals;
        /**
         * Component removal, processes a queue of `{ id, compName }`
         */
        private doDeferredComponentRemovals;
    }
};