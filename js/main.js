var synth = synth || {};


// Audio
//
synth.audio = synth.audio || {};
synth.audio.context = synth.audio.context || new webkitAudioContext();

(function (synth) {
    function AudioNode() {
        this.input = this.ctx.createGainNode();
        this.input.gain.value = 1;
        this.output = this.ctx.createGainNode();
        this.output.gain.value = 1;

        this.variables = this.variables || {};
        _.each(this.variables, function(variable) {
        });

        this.initialize();
    }


    // When a variable changes trigger a parameter change
    AudioNode.prototype._bindVariable = function(variable, target, trigger) {
        var self = this,
            splitTarget = target.split('.'),
            obj = this[splitTarget.shift()];
        while (splitTarget.length > 1) {
            obj = obj[splitTarget.shift()];
        }
        this.on('change:' + variable, function() {
            obj[splitTarget[0]] = self.val(variable);
        });

        if (trigger === undefined || trigger === true) {
            this.trigger('change:' + variable);
        }
    };

    // Get or set a variable defined in the "variables" options
    AudioNode.prototype.val = function () {
        var key,
            value;
        if (arguments.length == 2) {
            key = arguments[0];
            value = arguments[1];

            if (this.variables.hasOwnProperty(key)) { // change the value for existing variables only
                this.variables[key] = value;
                this.trigger('change:' + key);
            }
        } else {
            key = arguments[0];
        }
        return this.variables[key];
    };

    // Connect output to node
    AudioNode.prototype.connect = function (node) {
        this.output.connect(node.input);
    };

    // Disconnect output 
    AudioNode.prototype.disconnect = function () {
        this.output.disconnect();
    };

    AudioNode.extend = function (options) {
        var parent = this;
        var Obj = function () { 
            parent.apply(this, arguments);
        };
        Obj.prototype = _.extend(options, parent.prototype, Backbone.Events);

        return Obj;
    };


    // Premade nodes
    synth.audio.nodes = synth.audio.nodes || {};
    synth.audio.nodes.Oscillator = AudioNode.extend({
        name: 'Oscillator',
        ctx: synth.audio.context,
        variables: {
            frequency: 160,
            type: 'square'
        },
        initialize: function () {
            var self = this;
            this.oscNode = this.ctx.createOscillator();
            this._bindVariable('frequency', 'oscNode.frequency.value');
            this._bindVariable('type', 'oscNode.type');
            this.oscNode.connect(this.output);
            this.oscNode.start(0);
        }
    });

    synth.audio.nodes.Gain = AudioNode.extend({
        name: 'Gain',
        ctx: synth.audio.context,
        variables: {
            gain: 0.2,
        },
        initialize: function () {
            this.gainNode = this.ctx.createGainNode();
            this._bindVariable('gain', 'gainNode.gain.value');

            this.input.connect(this.gainNode);
            this.gainNode.connect(this.output);
        }
    });

    synth.audio.nodes.Destination = AudioNode.extend({
        name: 'Destination',
        ctx: synth.audio.context,
        initialize: function () {
            this.input.connect(this.ctx.destination);
        }
    });

    synth.audio.AudioNode = AudioNode;
})(synth);


// UI
//
synth.ui = synth.ui || {};
synth.ui.widgets = synth.ui.widgets || {};

(function (synth) {
    function Widget() {
        this.cWidth = synth.ui.paper.width;
        this.cHeight = synth.ui.paper.height;
        this.paper = synth.ui.paper;
    }

    Widget.prototype.render = function () {
        var self = this,
            rectWidth = 80,
            rectHeight = 40,
            center = this.canvasCenter();

        // the rectangle
        this.gRect = this.paper.rect(center.x, center.y, rectWidth, rectHeight, 1);
        this.gRect.attr('fill', '#eee');
        console.log(this.gRect.id);

        // the text
        this.gLabel = this.paper.text(center.x + rectWidth / 2, center.y + rectHeight / 2, this.audioNode.name);

        // all together
        this.gSet = this.paper.set();
        this.gSet.push(
            this.gRect,
            this.gLabel
        );

        // dragging functionality
        this.gSet.drag(function (dx, dy, x, y, event) {
            var bbox = self.gSet.getBBox(),
                newX = self.gSet.ox + dx,
                newY = self.gSet.oy + dy;
            if (!(newY < 1 || newX < 1 || (newY + bbox.height) > self.cHeight || (newX + bbox.width) > self.cWidth)) {
                self.gSet.translate(newX - bbox.x, newY - bbox.y);
            }
        }, function (event) {
            var bbox = self.gSet.getBBox();
            self.gSet.ox = bbox.x;
            self.gSet.oy = bbox.y;
        }, function (event) {
        });
    };

    Widget.prototype.canvasCenter = function () {
        return {
            x: this.paper.width / 2,
            y: this.paper.height / 2
        };
    };

    Widget.extend = function (options) {
        var parent = this;
        var Obj = function () { 
            parent.apply(this, arguments);
        };
        Obj.prototype = _.extend(options, parent.prototype, Backbone.Events);

        return Obj;
    };

    function Connection(from, to) {
    }

    synth.ui.widgets = {};
    synth.ui.widgets.Oscillator = Widget.extend({
        audioNode: new synth.audio.nodes.Oscillator()
    });
    synth.ui.widgets.Gain = Widget.extend({
        audioNode: new synth.audio.nodes.Gain()
    });
    synth.ui.widgets.Destination = Widget.extend({
        audioNode: new synth.audio.nodes.Destination()
    });

    synth.ui.Widget = Widget;
})(synth);

// Synth
// pretty much a container for everything else;
(function (synth) {
    synth.init = function () {
        var paper = synth.ui.paper;
        paper.rect(0, 0, paper.width, paper.height).attr('fill', '#aaa');
    };
})(synth);
