/**
@module model.presentation
@author Matt Crinklaw-Vogt
*
*/


(function() {

  define(["libs/backbone",
          "./SpatialObject",
          "strut/slide_components/ComponentFactory",
          "common/Math2", "./ComponentCommands",
          'tantaman/web/undo_support/CmdListFactory'],
function(Backbone, SpatialObject, ComponentFactory, Math2, ComponentCommands, CmdListFactory) {
    var undoHistory = CmdListFactory.managedInstance('editor');
    var defaults;

    defaults = {
      z: 0,
      impScale: 3,
      rotateX: 0,
      rotateY: 0,
      rotateZ: 0
    };
    /**
        Represents a slide in the presentation!
        Slides contain components (text boxes, videos, images, etc.)
        Slide fires a "contentsChanged" event whenever any of their
        components are updated.
    
        Slide fires "change:components.add/remove" events when components are
        added or removed.
        @class model.presentation.Slide
        @extend model.geom.SpatialObject
        *
    */

    return SpatialObject.extend({
      initialize: function() {
        var components, hydratedComps,
          _this = this;
        components = this.get("components");
        if (components === undefined) {
          this.set("components", []);
        } else {
          hydratedComps = [];
          this.set("components", hydratedComps);
          components.forEach(function(rawComp) {
            var comp;
            if (rawComp instanceof Backbone.Model) {
              comp = rawComp.clone();
              hydratedComps.push(comp);
            } else {
              comp = ComponentFactory.instance.createModel(rawComp);
              hydratedComps.push(comp);
            }
            return _this._registerWithComponent(comp);
          });
        }
        _.defaults(this.attributes, defaults);
        this.on("unrender", this._unrendered, this);

        components = this.get('components');
        components.some(function(comp) {
          if (comp.get('selected')) {
            this.selectionChanged(comp, true);
            return true;
          }
        }, this);
      },
      type: 'slide',
      _unrendered: function() {
        return this.get("components").forEach(function(component) {
          return component.trigger("unrender", true);
        });
      },
      _registerWithComponent: function(component) {
        component.on("dispose", this.remove, this);
        component.on("change:selected", this.selectionChanged, this);
        return component.on("change", this.componentChanged, this);
      },
      customClasses: function() {
        return '';
      },
      getPositionData: function() {
        return {
          x: this.attributes.x,
          y: this.attributes.y,
          z: this.attributes.z,
          impScale: this.attributes.impScale,
          rotateX: this.attributes.rotateX,
          rotateY: this.attributes.rotateY,
          rotateZ: this.attributes.rotateZ
        };
      },
      /**
            Adds a component in a space that has not already
            been occupied.  Triggers "contentsChanged"
            and "change:components.add" events.
      
            The contentsChanged event is used by the preview canvas to re-render itself.
            The change:components.add is used by the operating table to know to render the new component.
            @method
            @param {model.presentation.components.Component} component The component (text box,
            image, video, etc. to be added)
            *
      */

      add: function(component) {
        var cmd;
        this._placeComponent(component);

        component.set('selected', true);
        this.selectionChanged(component, true);

        cmd = new ComponentCommands.Add(this, component);
        cmd.do();
        return undoHistory.push(cmd);
      },
      __doAdd: function(component) {
        this.attributes.components.push(component);
        this._registerWithComponent(component);
        this.trigger("contentsChanged");
        return this.trigger("change:components.add", this, component);
      },
      /**
            * A pretty naive implementation but it should do the job just fine.
            * Places a new component in a location that doesn't currently contain a component
            * @method _placeComponent
            * @param {Component} component The component to be placed
            *
      */

      _placeComponent: function(component) {
        return this.attributes.components.forEach(function(existingComponent) {
          var existingX, existingY;
          existingX = existingComponent.get("x");
          existingY = existingComponent.get("y");
          if (Math2.compare(existingX, component.get("x"), 5) && Math2.compare(existingY, component.get("y"), 5)) {
            return component.set({
              x: existingX + 20,
              y: existingY + 20
            });
          }
        });
      },
      dispose: function() {
        this.set({
          active: false,
          selected: false
        });
        this.trigger("dispose", this);
        return this.off("dispose");
      },
      remove: function(component) {
        var cmd;
        cmd = new ComponentCommands.Remove(this, component);
        cmd.do();
        return undoHistory.push(cmd);
      },
      __doRemove: function(component) {
        var idx;
        idx = this.attributes.components.indexOf(component);
        if (idx !== -1) {
          this.attributes.components.splice(idx, 1);
          this.trigger("contentsChanged");
          this.trigger("change:components.remove", this, component);
          component.trigger("unrender");
        //  component.off(null, null, this);
          component.off();
          return component;
        } else {
          return undefined;
        }
      },
      componentChanged: function(model, value) {
        return this.trigger("contentsChanged");
      },
      unselectComponents: function() {
        if (this.lastSelection) {
          return this.lastSelection.set("selected", false);
        }
      },
      selectionChanged: function(model, selected) {
        if (selected) {
          if (this.lastSelection !== model) {
            this.attributes.components.forEach(function(component) {
              if (component !== model) {
                return component.set("selected", false);
              }
            });
            this.lastSelection = model;
          }
          return this.trigger("change:activeComponent", this, model, selected);
        } else {
          this.trigger("change:activeComponent", this, undefined);
          return this.lastSelection = undefined;
        }
      },
      constructor: function Slide() {
            SpatialObject.prototype.constructor.apply(this, arguments);
        }
    });
  });

}).call(this);
