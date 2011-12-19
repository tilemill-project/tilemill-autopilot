view = views.Layers.extend({});

view.prototype.events = _({
    'click .aspects a': 'aspect'
}).extend(view.prototype.events);

view.prototype.initialize = _(view.prototype.initialize).wrap(function(p, o) {
    if (!o.charts) throw new Error('options.charts is required');

    _(this).bindAll(
        'compile',
        'aspect');
    $(this.el).parents('div.project').addClass('autopilot');
    this.charts = o.charts;
    this.charts.bind('change', this.compile);
    this.model.get('Layer').bind('change', this.compile);
    this.compile();
    return p.call(this);
});

view.prototype.compile = function() {
    this.model.get('Stylesheet').refresh([{
        id: 'style.mss',
        data: templates.AutopilotCompile({
            layer: this.model.get('Layer'),
            charts: this.charts
        })
    }]);
};

view.prototype.aspect = function(ev) {
    var id = $(ev.currentTarget).attr('href').split('#').pop();
    var type = $(ev.currentTarget).attr('class').split('-').pop().split(' ').shift();
    var chart = this.charts.get(id);
    var editor = $('.aspect', $(ev.currentTarget).parents('li'));

    this.$('.aspect').attr('class', 'aspect');
    this.$('.aspects a.active').removeClass('active');
    if (this.aspectView) this.aspectView.remove();

    // Target aspect is currently active one. Toggle off.
    if (this.aspectView &&
        this.aspectView.model === chart &&
        this.aspectView.type === type) {
        delete this.aspectView;
        return false;
    }

    var el = $('<div></div>');
    editor.addClass('active').addClass('aspect-' + type).html(el);
    $(ev.currentTarget).addClass('active');
    this.aspectView = new views.Aspect({
        el: el,
        type: type,
        model: chart,
        project: this.model,
        target: ev.currentTarget
    });
    return false;
};

view.prototype.render = function() {
    $(this.el).append(templates.Autopilot());
    this.makeLayer(new models.Layer({ id:'Map', geometry:'map' }));
    this.model.get('Layer').chain().each(this.makeLayer);
    this.$('ul.layers').sortable({
        axis: 'y',
        handle: '.handle',
        containment: $(this.el),
        tolerance: 'pointer',
        items: '> *:not(.pinned)'
    });
};

view.prototype.makeLayer = function(model) {
    model.chart = this.charts.get(model.id) || new models.Chart({id:model.id});
    model.el = $(templates.AutopilotLayer(model));

    // Add chart if not part of collection.
    if (!this.charts.get(model.id)) this.charts.add(model.chart);

    // Prepend layers since intuitively the last drawn layer appears
    // "on top" of the other layers (painting model).
    this.$('ul.layers').prepend(model.el);

    // Bind to the 'remove' event to teardown
    model.bind('remove', function() {
        model.el.remove();
    });
    // Bind change event to retemplate.
    model.bind('change', function() {
        var update = $(templates.AutopilotLayer(model));
        model.el.replaceWith(update);
        model.el = update;
    });
    // Bind chart change event to redrawing aspects.
    model.chart.bind('change', function() {
        var update = $(templates.AutopilotLayer(model));
        var type = $('.aspects a.active').attr('class').split('aspect-').pop().split(' ').shift();
        $('.aspects', model.el).replaceWith($('.aspects', update));
        $('.aspects a.aspect-'+type, model.el).addClass('active');
    });
};

views['Stylesheets'].augment({
    initialize: function(p) {
        var data = (this.model.get('Stylesheet').at(0) ||
            new models.Stylesheet()).get('data').split('\n');
        if (data[1] !== 'autopilot') return p.call(this);

        try { data = JSON.parse(data[2]); }
        catch(e) { data = []; }

        // Autopilot on!
        return new view({
            charts: new models.Charts(data),
            model:this.model,
            el:this.el
        });
    }
});
