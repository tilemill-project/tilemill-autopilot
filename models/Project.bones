model = models['Project'];

model.prototype.STYLESHEET_DEFAULT = [{
    id: 'style.mss',
    data: '\
/*\n\
autopilot\n\
[{"id":"Map","background-color":"#b8dee6"},{"id":"countries","polygon-fill":["#fff"]}]\n\
*/\n\
Map { background-color: #b8dee6; }\n\
#countries { polygon-fill: #fff; }'
}];

model.prototype.STYLESHEET_DEFAULT_NODATA = [{
    id: 'style.mss',
    data: '\
/*\n\
autopilot\n\
[{"id":"Map","background-color":"#b8dee6"}]\n\
*/\n\
Map { background-color: #b8dee6; }'
}];
