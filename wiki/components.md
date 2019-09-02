
# Component notes

Reference list of components, what they do, and order in which they're called.

Order for systems on custom components can be specified with an `order` property 
in the component definition. For example, if you define a component with a 
`renderSystem` that depends on the current camera target position, it will want an 
`order` greater than `50` (when `followsEntity` moves the camera target before each render).

----

## Overview

| name | order | desc
| ---- | ----- | ----
| `collideEntities` | `70` | marks entities that collide with other entities
| `collideTerrain`  |      | marks entities that collide with terrain
| `fadeOnZoom`      | `99` | marks an entity to hide when camera is zoomed in
| `followsEntity`   | `50` | locks location of an entity to another one
| `mesh`            | `100`| stores a mesh associated with an entity
| `movement`        | `30` | stores movement state (move direction, jumping, etc.)
| `physics`         | `40` | stores an entity's physics body
| `position`        | `60` | stores entity's position, height/weight, renderPosition
| `receivesInputs`  | `20` | marks an entity as being controlled by keyboard/mouse
| `shadow`          | `80` | stores and manages a shadow mesh for an entity
| `smoothCamera`    | `99` | marks a mesh to move smoothly to its physics position, rather than abruptly

----

## Component `system` handlers and order

| name | order | system
| ---- | ----- | ------
| `receivesInputs`  | `20` | update `movement` state based on key/mouse input
| `movement`        | `30` | applies physics forces based on `movement` state
| `physics`         | `40` | tick physics engine, update entity `position`
| `followsEntity`   | `50` | moves `position` to match target
| `position`        | `60` | update `extents` data based on position
| `collideEntities` | `70` | runs collision test, fires onCollide events
| `shadow`          | `80` | update shadow's `y` position
| `fadeOnZoom`      | `99` | checks camera zoom, hides or reveals entity
| `smoothCamera`    | `99` | removes itself after time limit

----

## Component `renderSystem` handlers and order

| name | order | render system
| ---- | ----- | ------
| `physics`         | `40` | backtrack entity `renderPosition` towards physics position
| `followsEntity`   | `50` | moves entity's `renderPosition` to match its follow target
| `shadow`          | `80` | update shadow's `x/z` position
| `mesh`            | `100`| moves rendering mesh to entity `renderPosition`


