model = Backbone.Model.extend();

model.prototype.compile = function(layer) {
    // Exception for Map pseudo-layer.
    if (this.id === 'Map') {
        var rules = {'Map':{}};
        if (this.get('fill')) rules['Map']['background-color'] = this.get('fill');
        return this.toCSS(rules);
    }

    var tree = _(this.toJSON()).reduce(_(function(memo, val, key) {
        if (key === 'id') return memo;
        if (key.indexOf('_') === 0) return memo;
        switch (key.split('-')[0]) {
        case 'fill':
            var zoom = this.get('_fill-zoom') || [0,22];
            var group = _('::fill[zoom>=<%=obj[0]%>][zoom<=<%=obj[1]%>]').template(zoom);
            var attr = {
                'polygon': 'polygon-fill',
                'point': 'marker-fill'
            };
            memo[group] = memo[group] || {};
            memo[group][attr[layer.get('geometry')]] = val;
            break;
        case 'line':
            if (!this.get('line-width')) return memo;
            var zoom = this.get('_line-zoom') || [0,22];
            var scale = this.get('_line-scale') || 1;
            var group = _('::line[zoom>=<%=obj[0]%>][zoom<=<%=obj[1]%>]').template(zoom);
            memo[group] = memo[group] || {};
            if (scale > 1 && _(['line-width']).include(key)) {
                for (var z = zoom[0], i = 0; z < zoom[1]; z++, i++) {
                    memo[group]['[zoom='+z+']'] = memo[group]['[zoom='+z+']'] || {};
                    memo[group]['[zoom='+z+']'][key] = val + '*' + Math.pow(scale,i);
                }
            } else {
                memo[group][key] = val;
            }
            break;
        case 'text':
            if (!this.get('text-name')) return memo;
            if (!this.get('text-size')) return memo;
            var zoom = this.get('_text-zoom') || [0,22];
            var scale = this.get('_text-scale') || 1;
            var group = _('::text[zoom>=<%=obj[0]%>][zoom<=<%=obj[1]%>]').template(zoom);
            memo[group] = memo[group] || {};
            memo[group]['text-allow-overlap'] = 'true';
            if (scale > 1 && _(['text-size','text-character-spacing']).include(key)) {
                for (var z = zoom[0], i = 0; z < zoom[1]; z++, i++) {
                    memo[group]['[zoom='+z+']'] = memo[group]['[zoom='+z+']'] || {};
                    memo[group]['[zoom='+z+']'][key] = val + '*' + Math.pow(scale,i);
                }
            } else {
                memo[group][key] = val;
            }
            break;
        // Outlier
        case 'marker':
            if (!this.get('marker-width')) return memo;
            var zoom = this.get('_marker-zoom') || [0,22];
            var scale = this.get('_marker-scale') || 1;
            var group = _('::marker[zoom>=<%=obj[0]%>][zoom<=<%=obj[1]%>]').template(zoom);
            memo[group] = memo[group] || {};
            memo[group]['marker-allow-overlap'] = 'true';
            if (scale > 1 && _(['marker-width','marker-line-width']).include(key)) {
                for (var z = zoom[0], i = 0; z < zoom[1]; z++, i++) {
                    memo[group]['[zoom='+z+']'] = memo[group]['[zoom='+z+']'] || {};
                    memo[group]['[zoom='+z+']'][key] = val + '*' + Math.pow(scale,i);
                }
            } else {
                memo[group][key] = val;
            }
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
    console.warn(this.toCSS(rules));
    return this.toCSS(rules);
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
