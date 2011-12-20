view = Backbone.View.extend();

view.prototype.events = {
    'slidecreate .slider': 'sliderValue',
    'slidechange .slider': 'sliderValue',
    'slide .slider': 'sliderUp',
    'change select': 'select',
    'click .shades a.swatch': 'shadeSwatch',
    'click a[href=#shadeAdd]': 'shadeAdd',
    'click a[href=#shadeRemove]': 'shadeRemove',
    'click a[href=#shadeFlip]': 'shadeFlip',
    'click a[href=#shadeInterpolate]': 'shadeInterpolate'
};

view.prototype.css2rgb = views.Stylesheets.prototype.css2rgb;

view.prototype.initialize = function(options) {
    _(this).bindAll(
        'render',
        'select',
        'sliderUp',
        'sliderValue',
        'shades',
        'shadeSwatch',
        'shadeAdd',
        'shadeFlip',
        'shadeInterpolate',
        'shadeRemove',
        'polygonField');
    if (!options.type) throw new Error('options.type required');
    if (!options.target) throw new Error('options.target required');
    if (!options.project) throw new Error('options.project required');

    this.type = options.type;
    this.target = options.target;
    this.project = options.project;
    this.datasource = new models.Datasource();

    // Skip datasource load for Map.
    if (this.model.id === 'Map') return this.render();

    // Bind model change handlers.
    this.model.bind('change:polygon-fill', this.shades);
    this.model.bind('change:_polygon-field', this.polygonField);

    // Load datasource.
    var layer = this.project.get('Layer').get(this.model.id);
    this.datasource.set(_(layer.get('Datasource')).extend({
        id: layer.id,
        project: this.project.id,
        srs: null
    }));
    this.datasource.fetch({
        success: this.render,
        error: function(m, e) { new views.Modal(err) }
    });
};

view.prototype.render = function() {
    $(this.el).html(templates['Aspect'+this.type](this));
    var model = this.model;

    var colorpicker = this.$('.colorpicker');
    var key = colorpicker.data('key');
    var index = colorpicker.data('index');
    var val = _(index).isUndefined()
        ? this.model.get(key) || '#fff'
        : (this.model.get(key) || [])[index] || '#fff';
    var hsv = Color.RGB_HSV(this.css2rgb(val));
    var loading = true;
    new Color.Picker({
        hue: hsv.H,
        sat: hsv.S,
        val: hsv.V,
        element: colorpicker.get(0),
        callback: function(hex) {
            if (loading) return;
            var attr = {};
            var key = colorpicker.data('key');
            var index = colorpicker.data('index');
            if (_(index).isUndefined()) {
                attr[key] = '#' + hex;
            } else {
                attr[key] = _(model.get(key) || []).clone();
                attr[key][index] = '#' + hex;
            }
            model.set(attr);
        }
    });
    loading = false;

    this.$('select').each(function() {
        var key = $(this).attr('name');
        $(this).val(model.get(key));
    });

    this.$('.slider.value').each(function() {
        var key = $(this).data('key');
        $(this).slider({
            min:$(this).data('min') || 0,
            max:$(this).data('max') || 0,
            step:$(this).data('step') || 1,
            value: model.get(key) || 0,
            range: 'min'
        });
    });

    this.$('.slider.range').each(function() {
        var key = $(this).data('key');
        $(this).slider({
            min:$(this).data('min') || 0,
            max:$(this).data('max') || 0,
            step:$(this).data('step') || 1,
            values: model.get(key) || [
                $(this).data('min') || 0,
                $(this).data('max') || 0
            ],
            range: true
        });
    });
    return this;
};

view.prototype.select = function(ev) {
    var key = $(ev.currentTarget).attr('name');
    var attr = {};
    attr[key] = $(ev.currentTarget).val();
    this.model.set(attr);
};

view.prototype.sliderUp = function(ev, ui) {
    function num(num) {
        num = num || 0;
        if (num >= 1e6) {
            return (num / 1e6).toFixed(1) + 'm';
        } else if (num >= 1e3) {
            return (num / 1e3).toFixed(1) + 'k';
        } else if (num >= 100) {
            return num.toFixed(0);
        } else {
            return num;
        }
    };
    if ($(ev.target).hasClass('range')) {
        $('.ui-slider-handle:first', ev.target).text(num($(ev.target).slider('values')[0]));
        $('.ui-slider-handle:last', ev.target).text(num($(ev.target).slider('values')[1]));
    } else {
        $('.ui-slider-handle', ev.target).text(num($(ev.target).slider('value')));
    }
};

view.prototype.sliderValue = function(ev, ui) {
    this.sliderUp(ev, ui);
    var attr = {};
    if ($(ev.target).hasClass('range')) {
        attr[$(ev.target).data('key')] = $(ev.target).slider('values');
    } else {
        attr[$(ev.target).data('key')] = $(ev.target).slider('value');
    }
    this.model.set(attr);
};

view.prototype.shadeAdd = function() {
    var shades = _(this.model.get('polygon-fill')).clone();
    if (shades.length > 4) return false;
    shades.push(_(shades).last());
    this.model.set({'polygon-fill':shades});
    return false;
};

view.prototype.shadeRemove = function() {
    var shades = _(this.model.get('polygon-fill')).clone();
    if (shades.length < 2) return false;
    shades.pop();
    this.model.set({'polygon-fill':shades});
    return false;
};

view.prototype.shadeFlip = function() {
    var shades = _(this.model.get('polygon-fill')).clone();
    shades.reverse();
    this.model.set({'polygon-fill':shades});
    return false;
};

view.prototype.shadeInterpolate = function() {
    var shades = _(this.model.get('polygon-fill')).clone();
    if (shades.length < 3) return false;
    var divisor = shades.length - 1;
    var start = this.css2rgb(_(shades).first());
    var end = this.css2rgb(_(shades).last());
    var diff = {
        R:(end.R-start.R)/divisor | 0,
        G:(end.G-start.G)/divisor | 0,
        B:(end.B-start.B)/divisor | 0
    };
    this.model.set({'polygon-fill': _(shades).map(function(val, i) {
        if (i === 0) return val;
        if (i === shades.length - 1) return val;
        return ['#',
            (start.R + (diff.R*i)).toString(16),
            (start.G + (diff.G*i)).toString(16),
            (start.B + (diff.B*i)).toString(16)].join('');
    })});
    return false;
};

view.prototype.shades = function() {
    this.$('.shades').replaceWith($('.shades', templates['Aspect'+this.type](this)));
};

view.prototype.shadeSwatch = function(ev) {
    var target = $(ev.currentTarget);
    var index = this.$('.shades a.swatch').index(target);
    this.$('.colorpicker').data('index', index);
    return false;
};

view.prototype.polygonField = function() {
    var field = this.model.get('_polygon-field');
    if (!field) return;

    // Load datasource.
    $(this.el).addClass('loading');
    var layer = this.project.get('Layer').get(this.model.id);
    new models.Datasource(_(layer.get('Datasource')).extend({
        id: layer.id,
        project: this.project.id,
        srs: null
    })).fetchFeatures({
        success: _(function(m) {
            $(this.el).removeClass('loading');
            var info = m.get('fields')[field];
            this.$('.minmax').replaceWith($('.minmax', templates['Aspect'+this.type](this)));
            this.$('.minmax').slider({
                min:info.min,
                max:info.max,
                step:(info.max - info.min) > 10 ? 1 : 0.1,
                values: this.model.get('_polygon-range') || [info.min, info.max],
                range: true
            });
        }).bind(this)
    });
    return false;
};

