define(["./ComponentView", "libs/etch",
        "strut/deck/ComponentCommands",
        "tantaman/web/undo_support/CmdListFactory"],
function(ComponentView, etch, ComponentCommands, CmdListFactory) {
	'use strict';
    var undoHistory = CmdListFactory.managedInstance('editor');
    var styles;
    styles = ["family", "size", "weight", "style", "color", "decoration", "align"];
    return ComponentView.extend({
      className: "component textBox",
      tagName: "div",
      events: function() {
        var myEvents, parentEvents;
        parentEvents = ComponentView.prototype.events.call(this);
        myEvents = {
          "dblclick": "dblclicked",
          "editComplete": "editCompleted",
          "mousedown": "mousedown",
          "mouseup": "mouseup"
        };
        return _.extend(parentEvents, myEvents);
      },
      initialize: function() {
        var style, _i, _len;
        ComponentView.prototype.initialize.apply(this, arguments);
        for (_i = 0, _len = styles.length; _i < _len; _i++) {
          style = styles[_i];
          this.model.on("change:" + style, this._styleChanged, this);
        }
        this._lastDx = 0;
        this.keydown = this.keydown.bind(this);
        // $(document).bind("keydown", this.keydown);
        return this.model.on("edit", this.edit, this);
      },
      scaleStart: function() {
        this._initialSize = this.model.get('size');
      },
      remove: function() {
        ComponentView.prototype.remove.apply(this, arguments);
        // $(document).unbind("keydown", this.keydown);
      },
      scale: function(e, deltas) {
        var currSize, sign;
        currSize = this.model.get("size");
        sign = deltas.dx - this._lastDx > 0 ? 1 : -1;
        this.model.set("size", currSize + Math.round(sign * Math.sqrt(Math.abs(deltas.dx - this._lastDx))));
        return this._lastDx = deltas.dx;
      },
      scaleStop: function() {
        var cmd = ComponentCommands.TextScale(this._initialSize, this.model);
        undoHistory.push(cmd);
      },
      dblclicked: function(e) {
        this.$el.addClass("editable");
        this.$el.find(".content").attr("contenteditable", true);
        if (e != null) {
          etch.editableInit.call(this, e, this.model.get("y") * this.dragScale + 35);

          // Focus editor and select all text.
          if (!this.editing) {
            this.$el.find(".content").get(0).focus();
            document.execCommand('selectAll', false, null);
          }
				}
        this.allowDragging = false;
        return this.editing = true;
      },
      mouseup: function(e) {
        if (this.editing) {
          etch.triggerCaret();
          //etch.editableInit.call(this, e, this.model.get("y") * this.dragScale + 35);
        }
      },
      mousedown: function(e) {
        if (this.editing) {
          e.stopPropagation();
          etch.editableInit.call(this, e, this.model.get("y") * this.dragScale + 35);
        } else {
          ComponentView.prototype.mousedown.apply(this, arguments);
        }
        return true;
      },
			keydown: function(e) {
				// When user starts typing text in selected textbox, open edit mode immediately.
				if (this.model.get("selected") && !this.editing) {
					if (!e.ctrlKey && !e.altKey && !e.metaKey && String.fromCharCode(e.which).match(/[\w]/)) {
					  this.edit();
					}
				}
			},
      editCompleted: function() {
        var text;
        text = this.$textEl.html();
        this.editing = false;
        if (text === "") {
          return this.remove();
        } else {
          this.model.set("text", text);
					window.getSelection().removeAllRanges();
          this.$el.find(".content").attr("contenteditable", false);
          this.$el.removeClass("editable");
          return this.allowDragging = true;
        }
      },
      __selectionChanged: function(model, selected) {
        ComponentView.prototype.__selectionChanged.apply(this, arguments);
        if (!selected && this.editing) {
          return this.editCompleted();
        }
      },
      edit: function() {
        var e;
        this.model.set("selected", true);
        e = $.Event("click", {
          pageX: this.model.get("x")
        });
        this.dblclicked(e);
        return this.$el.find(".content").selectText();
      },
      _styleChanged: function(model, style, opts) {
        var key, value, _ref, _results;
        _ref = opts.changes; //model.changed;
        if (!_ref) return;
        for (var i = 0; i < _ref.length; ++i) {
          key = _ref[i];
          value = model.get(key);
          if (value) {
            if (key === "decoration" || key === "align") {
              console.log("DECORATION CHANGE");
              key = "text" + key.substring(0, 1).toUpperCase() + key.substr(1);
            } else if (key !== "color") {
              key = "font" + key.substr(0, 1).toUpperCase() + key.substr(1);
            }
            this.$el.css(key, style);
          }
        }
      },
      render: function() {
        ComponentView.prototype.render.call(this);
        this.$textEl = this.$el.find(".content");
        this.$textEl.html(this.model.get("text"));
        this.$el.css({
          fontFamily: this.model.get("family"),
          fontSize: this.model.get("size"),
          fontWeight: this.model.get("weight"),
          fontStyle: this.model.get("style"),
          color: "#" + this.model.get("color"),
          top: this.model.get("y"),
          left: this.model.get("x"),
          textDecoration: this.model.get("decoration"),
          textAlign: this.model.get("align")
        });
        return this.$el;
      },
      constructor: function TextBoxView() {
			ComponentView.prototype.constructor.apply(this, arguments);
		}
    });
  });