view = Backbone.View.extend();

view.prototype.events = {
    'slidecreate .slider.value': 'sliderValue',
    'slidechange .slider.value': 'sliderValue',
    'slide .slider.value': 'sliderValue',
    'slidecreate .slider.range': 'sliderRange',
    'slidechange .slider.range': 'sliderRange',
    'slide .slider.range': 'sliderRange',
    'change select': 'select'
};

view.prototype.css2rgb = views.Stylesheets.prototype.css2rgb;

view.prototype.initialize = function(options) {
    _(this).bindAll(
        'render',
        'select',
        'sliderValue',
        'sliderRange');
    if (!options.type) throw new Error('options.type required');
    if (!options.target) throw new Error('options.target required');
    if (!options.project) throw new Error('options.project required');

    this.type = options.type;
    this.target = options.target;
    this.project = options.project;
    this.datasource = new models.Datasource();

    // Skip datasource load for Map.
    if (this.model.id === 'Map') return this.render();

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
    var key = this.$('.colorpicker').data('key');
    var hsv = Color.RGB_HSV(this.css2rgb(this.model.get(key) || '#fff'));
    var loading = true;
    new Color.Picker({
        hue: hsv.H,
        sat: hsv.S,
        val: hsv.V,
        element: this.$('.colorpicker').get(0),
        callback: _(function(hex) {
            if (loading) return;
            var attr = {};
            attr[key] = '#' + hex;
            this.model.set(attr);
        }).bind(this)
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
            value: model.get(key) || 0
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

view.prototype.sliderValue = function(ev, ui) {
    var key = $(ev.target).data('key');
    var attr = {};
    attr[key] = $(ev.target).slider('value');
    this.model.set(attr);
    $('.ui-slider-handle', ev.target).html($(ev.target).slider('value'));
};

view.prototype.sliderRange = function(ev, ui) {
    var key = $(ev.target).data('key');
    var attr = {};
    attr[key] = $(ev.target).slider('values');
    this.model.set(attr);
    $('.ui-slider-handle:first', ev.target).text($(ev.target).slider('values')[0]);
    $('.ui-slider-handle:last', ev.target).html($(ev.target).slider('values')[1]);
};

