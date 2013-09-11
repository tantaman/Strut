define(function() {
	var mixers;
	return mixers = {
		scaleByResize: function(e, deltas) {
			var height, offset, width;
			offset = this.$el.offset();
			width = (deltas.x - offset.left) / this.dragScale;
			height = (deltas.y - offset.top) / this.dragScale;
			return this.model.set("scale", {
				width: width,
				height: height
			});
		},

		scaleChangeByResize: function(model, size) {
			this.$el.css(size);
		},

		scaleObjectEmbed: function(e, deltas) {
			var height, offset, size, width;
			offset = this.$el.offset();
			width = (deltas.x - offset.left) / this.dragScale;
			height = (deltas.y - offset.top) / this.dragScale;
			size = {
				width: width,
				height: height
			};
			return this.model.set("scale", size);
		},

		scaleChangeObjectEmbed: function(model, size) {
			this.$object.attr(size);
			this.$embed.attr(size);
			this.$el.css(size);
		}
	};
});