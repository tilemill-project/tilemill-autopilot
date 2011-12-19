model = Backbone.Model.extend();

model.prototype.compile = function(layer) {
    if (this.id === 'Map') return this.toCSS(this.compileMap());
    switch (layer.get('geometry')) {
    case 'polygon':
        return this.toCSS(this.compilePolygon(layer));
        break;
    case 'line':
    case 'linestring':
        return this.toCSS(this.compileLine(layer));
        break;
    case 'point':
        return this.toCSS(this.compilePoint(layer));
        break;
    case 'raster':
        return this.toCSS(this.compileRaster(layer));
        break;
    default:
        return '';
        break;
    }
};

model.prototype.compileMap = function(layer) {
    var rules = {'Map':{}};
    if (this.get('fill')) rules['Map']['background-color'] = this.get('fill');
    return rules;
};

model.prototype.compilePolygon = function(layer) {
    var tree = _(this.toJSON()).reduce(_(function(memo, val, key) {
        if (key === 'id') return memo;
        if (key.indexOf('_') === 0) return memo;
        switch (key.split('-')[0]) {
        case 'fill':
            var zoom = this.get('_fill-zoom') || [0,22];
            var group = _('::fill[zoom>=<%=obj[0]%>][zoom<=<%=obj[1]%>]').template(zoom);
            memo[group] = memo[group] || {};
            memo[group]['polygon-fill'] = val;
            break;
        case 'line':
            if (!this.get('line-width')) return memo;
            var zoom = this.get('_line-zoom') || [0,22];
            var group = _('::line[zoom>=<%=obj[0]%>][zoom<=<%=obj[1]%>]').template(zoom);
            memo[group] = memo[group] || {};
            memo[group][key] = val;
            break;
        case 'text':
            if (!this.get('text-name')) return memo;
            if (!this.get('text-size')) return memo;
            var zoom = this.get('_text-zoom') || [0,22];
            var group = _('::text[zoom>=<%=obj[0]%>][zoom<=<%=obj[1]%>]').template(zoom);
            memo[group] = memo[group] || {};
            memo[group][key] = val;
            break;
        }
        return memo;
    }).bind(this), {});
    tree = _(tree).chain().keys()
        .sortBy(function(key) {
            if (key.indexOf('::fill') === 0) return 0;
            if (key.indexOf('::line') === 0) return 1;
            if (key.indexOf('::text') === 0) return 2;
            return 0;
        })
        .reduce(function(memo, key) {
            memo[key] = tree[key];
            return memo;
        }, {})
        .value();
    var rules = {};
    rules['#'+this.id] = tree;
    return rules;
};

model.prototype.compileLine = function(layer) {
    var rules = {};
    rules['#'+this.id] = _(this.toJSON()).reduce(_(function(memo, val, key) {
        if (key === 'id') return memo;
        if (key.indexOf('_') === 0) return memo;
        switch (key.split('-')[0]) {
        case 'line':
            if (!this.get('line-width')) return memo;
            var zoom = this.get('_line-zoom') || [0,22];
            var group = _('::line[zoom>=<%=obj[0]%>][zoom<=<%=obj[1]%>]').template(zoom);
            if (zoom[1]-zoom[0] === 22) {
                memo[key] = val;
            } else {
                memo[group] = memo[group] || {};
                memo[group][key] = val;
            }
            break;
        case 'text':
            if (!this.get('text-name')) return memo;
            if (!this.get('text-size')) return memo;
            var zoom = this.get('_text-zoom') || [0,22];
            var group = _('::text[zoom>=<%=obj[0]%>][zoom<=<%=obj[1]%>]').template(zoom);
            if (zoom[1]-zoom[0] === 22) {
                memo[key] = val;
            } else {
                memo[group] = memo[group] || {};
                memo[group][key] = val;
            }
            break;
        }
        return memo;
    }).bind(this), {});
    return rules;
};

model.prototype.compilePoint = function(layer) {
    var rules = {};
    return rules;
};

model.prototype.compileRaster = function(layer) {
    var rules = {};
    return rules;
};

model.prototype.toCSS = function(rules, indent) {
    indent = indent || '';
    return _(rules).map(_(function(val, key) {
        if (_(val).isObject()) return [
            indent + key + ' {',
            this.toCSS(val, indent + '  '),
            indent + '}'].join('\n');
        // Quoted attributes. @TODO use the Carto reference JSON for this.
        switch (key) {
        case 'text-name':
            return indent + key + ': "[' + val + ']";';
            break;
        case 'text-face-name':
            return indent + key + ': "' + val + '";';
            break;
        default:
            return indent + key + ': ' + val + ';';
            break;
        }
    }).bind(this)).join('\n');
};
