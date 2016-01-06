define(['./ImpressGenerator'],
function(ImpressGenerator) {
	'use strict';

	var service = {
		displayName: 'Impress',
		id: 'impress',
		capabilities: {
			freeformStepping: true
		},
		generate: function(deck) {
			return ImpressGenerator.render(deck);
		},

		getSlideHash: function(editorModel) {
			return '#/step-' + (editorModel.activeSlideIndex() + 1);
		}
	};

	return {
		initialize: function(registry) {
			registry.register({
				interfaces: 'strut.presentation_generator'
			}, service);
		}
	};
});