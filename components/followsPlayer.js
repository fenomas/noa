'use strict';

/**
 * Simple flag to indicate that an entity follows the player position
 * (used for camera position tracking)
 */

module.exports = function (noa) {
	
	return {

		name: 'follows-player',

		state: { },

		onAdd: null,

		onRemove: null,

		processor: null


	}
}

