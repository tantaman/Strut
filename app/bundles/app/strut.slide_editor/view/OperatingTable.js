define(['libs/backbone',
		'css!styles/slide_editor/operatingTable.css',
		'strut/slide_components/ComponentFactory',
		'strut/editor/GlobalEvents',
		'strut/deck/Component',
		'./OperatingTableContextMenu',
		'strut/deck/Utils',
		'./Utils',
		'marked'],
function(Backbone, empty, ComponentFactory, GlobalEvents, Component,
	ContextMenu,
	DeckUtils,
	Utils,
	Tablets,
	marked) {
	'use strict';

	function MenuModel() {

	}

	MenuModel.prototype = {
		getBackground: function() {
			return DeckUtils.slideBackground(this.slide, this.deck);
		},

		setBackground: function(bg) {
			this.slide.set('background', bg)
		},

		editMarkdown: function() {
			this.slideEditorModel.set('mode', 'markdown');
		},

		stopEditingMarkdown: function() {
			this.slideEditorModel.set('mode', 'preview');
		}
	};

	return Backbone.View.extend({
		className: 'operatingTable',
		events: {
			"click": "_clicked",
			"focused": "_focus",
			"dragover": "_dragover",
			"drop": "_drop",
			destroyed: 'dispose'
		},

		initialize: function() {
			this._resize = this._resize.bind(this);
			$(window).resize(this._resize);
			this._menuModel = new MenuModel();
			this._menuModel.deck = this._deck;
			this._menuModel.slideEditorModel = this._slideEditorModel;

			// Re-render when active slide changes in the deck
			this._deck.on('change:activeSlide', function(deck, model) {
				this.setModel(model);
			}, this);
			this._deck.on('change:background', this._updateBg, this);
			this._deck.on('change:surface', this._updateSurface, this);
			this.setModel(this._deck.get('activeSlide'));

			GlobalEvents.on('cut', this._cut, this);
			GlobalEvents.on('copy', this._copy, this);
			GlobalEvents.on('paste', this._paste, this);
			GlobalEvents.on('delete', this._delete, this);

			this._clipboard = this._editorModel.clipboard;

			ContextMenu.setModel(this._menuModel);
		},

		render: function() {
			this._$slideContainer = $('<div class="slideContainer"></div>')
			this.$el.html(this._$slideContainer);
			this._$slideContainer.css(config.slide.size);

			this._$slideContainer.addClass(DeckUtils.slideBackground(this.model, this._deck));
			this._$markdownContent = $('<div class="markdownArea themedArea reveal"></div>');
			this._$slideContainer.append(this._$markdownContent);

			this._$slideContainer.selectable({
				filter: ".component",
				selected: function(event, ui) {
					$(ui.selected).trigger('select', ui);
				},
				unselected: function(event, ui) {
					$(ui.unselected).trigger('unselect', ui);
				}
			});

			var self = this;
			setTimeout(function() {
				self._rendered = true;
				self._resize();
				self._renderContents();
			}, 0);

			this.$el.addClass((this._deck.get('surface') || 'defaultbg'));

			return this;
		},

		_updateBg: function(model, bg) {
			if (!this._$slideContainer) return;
			this._$slideContainer.removeClass();
			bg = DeckUtils.slideBackground(this.model, this._deck);

			this._$slideContainer.addClass('slideContainer ui-selectable ' + bg);
		},

		_updateSurface: function(model, bg) {
			this.$el.removeClass();
			this.$el.addClass('operatingTable ' + bg);
			var currentBg = this._deck.get('background');
			if (currentBg == 'defaultbg')
				this._updateBg(model, bg);
		},

		// TODO: make the cut/copy/paste interfaces identical for
		// slides and slide components so we can mix this code into both?
		_cut: function() {
			if (this._editorModel.get('scope') == 'operatingTable') {
				var components = this.model.selected;
				if (components.length) {
					this._clipboard.setItems(components);
					this.model.remove(components);
				}
			}
		},

		_copy: function() {
			if (this._editorModel.get('scope') == 'operatingTable') {
				var components = this.model.selected;
				if (components.length) {
					this._clipboard.setItems(components);
				}
			}
		},

		_paste: function() {
			var components = this._clipboard.getItems();
			if (components != null && components.length && components[0] instanceof Component) {
				this.model.add(components);
			}
		},

		_delete: function() {
			if (this._editorModel.get('scope') == 'operatingTable') {
				var components = this.model.selected;
				if (components.length) {
					this.model.remove(components);
				}
			}
		},

		_clicked: function() {
			this._focus();
			this.model.get('components').forEach(function(comp) {
				if (comp.get('selected')) {
					comp.set('selected', false);
				}
			});
			this.$el.find('.editable').removeClass('editable').attr('contenteditable', false)
				.trigger('editComplete');

			this._focus();
		},

		_focus: function() {
			this._editorModel.set('scope', 'operatingTable');
		},

		_dragover: function(e) {
			e.stopPropagation()
			e.preventDefault()
			e.originalEvent.dataTransfer.dropEffect = 'copy'
		},

		_drop: function(e) {
			e.stopPropagation()
			e.preventDefault()
			var f = e.originalEvent.dataTransfer.files[0]

			if (!f.type.match('image.*'))
				return

			var reader = new FileReader()
			var self = this;
			reader.onload = function(e) {
				self.model.add(
					ComponentFactory.instance.createModel({
						type: 'Image',
						src: e.target.result
					}));
			};

			reader.readAsDataURL(f)
		},

		_componentAdded: function(model, comp) {
			var view = ComponentFactory.instance.createView(comp);
			this._$slideContainer.append(view.render());
		},

		setModel: function(model) {
			var prevModel = this.model;
			if (this.model === model) return;

			if (this.model != null) {
				this.model.off(null, null, this);
			}
			this.model = model;
			if (this.model != null) {
				this.model.on('change:components.add', this._componentAdded, this);
				this.model.on('change:background', this._updateBg, this);
				this.model.on('change:markdown', this._renderMarkdown, this);
				this._updateBg();
			}
			this._renderContents(prevModel);
			this._menuModel.slide = model;
			return this;
		},

		dispose: function() {
			$(window).off('resize', this._resize);
			this._deck.off(null, null, this);
			if (this.model)
				this.model.off(null, null, this);
			GlobalEvents.off(null, null, this);
		},

		_renderContents: function(prevModel) {
			if (prevModel != null) {
				prevModel.trigger('unrender', true);
			}

			if (!this._rendered) return;

			if (this.model != null) {
				var components = this.model.get('components');
				components.forEach(function(comp) {
					var view = ComponentFactory.instance.createView(comp);
					this._$slideContainer.append(view.render());
				}, this);

				this._renderMarkdown();
			}
		},

		_renderMarkdown: function() {
			if (this.model.get('markdown')) {
				this._$markdownContent.html(marked(this.model.get('markdown')));
			} else {
				this._$markdownContent.html('');
			}
		},

		_resize: function() {
			var dimensions = Utils.computeSlideDimensions(this.$el);
			this._$slideContainer.css({
				'margin-left': dimensions.remainingWidth / 2,
				'margin-right': dimensions.remainingWidth / 2
			});

			this._$slideContainer.css(window.browserPrefix + 'transform', 'scale(' + dimensions.scale + ')');
		},

		constructor: function OperatingTable(editorModel, slideEditorModel) {
			this._deck = editorModel.deck();
			this._registry = editorModel.registry;
			this._editorModel = editorModel;
			this._slideEditorModel = slideEditorModel;
			Backbone.View.prototype.constructor.call(this);
		}
	});
});
