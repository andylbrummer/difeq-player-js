var functionPathBuilder = function (func, extraScope) {
    var scope = angular.extend({
        f: '=',
        t: '=',
        values: '=',
        paths: '=',
        model: '='
    }, extraScope); 
    return {
        restrict: 'A',
        scope: scope,
        controller: ['$scope', '$attrs', function ($scope, $attrs) {
            $scope.$watch('t', function () { func($scope, $attrs); });
            $scope.$watch('f', function () { func($scope, $attrs); });
            $scope.$watch('values', function () { func($scope, $attrs); }, true);
        }]
    };
};


angular
    .module('paramApp', ['ui.bootstrap-slider'])
    .directive('parameters', function () {
        return {
            restrict: 'A',
            scope: {
                parameters: '=',
                values: '='
            },
            template: '<ul class="ctrl-parameters"><li ng-repeat="p in values"><span ng-bind="p.name"></span><div slider max="{{p.max}}" min="{{p.min}}" step="{{p.step}}" ng-model="p.value"></div></li></ul>',
            controller: ['$scope', function ($scope) {
                $scope.setValues = function () {
                    var values = [];
                    jQuery.each($scope.parameters, function (key, value) {
                        values.push({ name: key, value: value[0] || 0, min: value[1] || -1, max: value[2] || 1, step: value[3] || 0.05 });
                    });
                    return $scope.values = values;
                }
                $scope.setValues();
            }]
        }
    })
    .directive('pathRender', function () {
        return {
            restrict: 'A',
            scope: {
                pathRender: '=',
                lineStyle: '=',
                lineWidth: '=',
                backgroundStyle: '=',
                range: '=' // [minX, maxX, minY, maxY]
            },
            controller: ['$scope', '$element', function ($scope, $element) {
                var c = $element[0];
                var ctx = c.getContext('2d');
                var range = $scope.range || [-1, 1, -1, 1];
                var sx = c.width / (range[1] - range[0]), dx = range[0];
                var sy = c.height / (range[3] - range[2]), dy = range[2];
                ctx.lineWidth = $scope.lineWidth || 2.0;

                ctx.fillStyle = $scope.backgroundStyle || 'rgba(30, 30, 180, 0.025)';
                for(var i=20; i--; ) ctx.fillRect(0, 0, c.width, c.height);

                var drawPaths = function (paths) {
                    ctx.lineWidth = 0.5;
                    ctx.strokeStyle = $scope.lineStyle || 'rgba(255,255,255,1.0)';
                    ctx.fillStyle = $scope.backgroundStyle || 'rgba(30, 30, 180, 0.025)';
                    ctx.fillRect(0, 0, c.width, c.height);
                    for (var pathIndex = paths.length; pathIndex--;) {
                        var path = paths[pathIndex];
                        ctx.beginPath();
                        var cur = path[path.length - 1];
                        ctx.moveTo((cur[0] - dx) * sx, (cur[1] - dy) * sy);
                        for (var i = path.length; i--;) {
                            var p = path[i];
                            ctx.lineTo((p[0] - dx) * sx, (p[1] - dy) * sy);
                        }
                        ctx.stroke();
                    }
                };
                $scope.$watch('pathRender', function (val) {
                    if (val && val.length && val.length > 0) drawPaths(val);
                });
            }]
        }
    })
    .directive('densityRender', function () {
        return {
            restrict: 'A',
            scope: {
                densityRender: '='
            },
            controller: ['$scope', '$element', function ($scope, $element) {
                var c = $element[0];
                var ctx = c.getContext('2d');
                var dx = c.width / 2;
                var dy = c.height / 2;
                var cc = {};
                var fl = Math.floor;

                var plot = function (functions) {
                    ctx.fillStyle = 'rgba(0,0,0,1.0)';
                    ctx.fillRect(0, 0, c.width, c.height);
                    for (var fIndex = functions.length; fIndex--;) {
                        var f = functions[fIndex];
                        for (var x = c.width; x--;) {
                            for (var y = c.height; y--;) {
                                var val = fl(f(x - dx, y - dy) * 100);
                                if (val < 0) {
                                    ctx.fillStyle = cc[val] || (cc[val] = 'hsl(250,' + -val + '%,30%)');
                                } else {
                                    ctx.fillStyle = cc[val] || (cc[val] = 'hsl(50,' + val + '%,30%)');
                                }
                                ctx.fillRect(x, y, 1, 1);
                            }
                        }
                    }
                };
                $scope.$watch('densityRender', function (val) {
                    if (val && val.length && val.length > 0) plot(val);
                });
            }]
        }
    })
    .directive('graph', function () {
        return functionPathBuilder(function ($scope, $attrs) {
            try {
                if (!$scope.f || !$scope.values) return;

                var p = jQuery.map($scope.values, function (x) { return parseFloat(x.value); });
                var params = jQuery.map($scope.values, function (x) { return x.name; });
                var paths = [];

                var ff = $scope.f;
                if (!jQuery.isArray(ff)) ff = [ff];

                for (var j = 0; j < ff.length; ++j) {
                    var live_f = new Function(['t'].concat(params), 'return ' + ff[j] + ';');
                    var path = [], pp = [-1].concat(p), pc = {};
                    for (var x = -1; x < 1.02; x += 0.01) {
                        pp[0] = x;
                        path.push([x, live_f.apply(pc, pp)]);
                    }
                    paths.push(path);
                }

                $scope.paths = paths;
            } catch (ex) {
                //alert(ex);
            }
        });
    })
    .directive('parametric', function () {
        return functionPathBuilder(function ($scope, $attrs) {
            try {
                if (!$scope.f || !$scope.values) return;

                var p = jQuery.map($scope.values, function (x) { return parseFloat(x.value); });
                var params = jQuery.map($scope.values, function (x) { return x.name; });
                var paths = [];

                var ff = $scope.f;
                if (!jQuery.isArray(ff)) ff = [ff];

                for (var j = 0; j < ff.length; ++j) {
                    var live_f = new Function(['t'].concat(params), 'return ' + ff[j] + ';');
                    var path = [], pp = [0].concat(p), pc = {};
                    for (var t = -180; t < 180; ++t) {
                        pp[0] = t / 15;
                        var r = live_f.apply(pc, pp);
                        path.push([r[0], r[1]]);
                    }
                    paths.push(path);
                }

                $scope.paths = paths;
            } catch (ex) {
                //alert(ex);
            }
        });
    })
    .directive('density', function () {
        return functionPathBuilder(function ($scope, $attrs) {
            try {
                if (!$scope.f || !$scope.values) return;

                var p = jQuery.map($scope.values, function (x) { return x.name + '=' + x.value; });
                var params = jQuery.map($scope.values, function (x) { return x.name; });
                var functions = [];

                var ff = $scope.f;
                if (!jQuery.isArray(ff)) ff = [ff];

                for (var j = 0; j < ff.length; ++j) {
                    var body = 'var ' + p + ';return ' + ff[j] + ';';
                    var live_f = new Function(['x', 'y'].concat(params), body);
                    functions.push(live_f);
                }

                $scope.paths = functions;
            } catch (ex) {
                //alert(ex);
            }
        });
    })
    .directive('wind', function () {
        return functionPathBuilder(function ($scope, $attrs) {
            try {
                if (!$scope.f || !$scope.values) return;

                var model = $scope.model || {};
                var params = jQuery.map($scope.values, function (x) { return x.name; });
                var functions = [];

                var range = $scope.range || [-1, 1, -1, 1];
                var sx = range[1] - range[0], dx = range[0];
                var sy = range[3] - range[2], dy = range[2];

                var ff = $scope.f;
                if (!jQuery.isArray(ff)) ff = [ff];
                var vars = [{name: 'x', value: 'v[0]'}, {name: 'y', value: 'v[1]'}, {name: 'z', value: 'v[2]'}].concat($scope.values);
                var p = jQuery.map(vars, function (x) { return x.name + '=' + x.value; });

                var body = 'var ' + p + '; return [' + ff[0] + '];';
                model.live_f = new Function(['v'], body);

                var traces = ($scope.model && $scope.model.traces) || [];
                var t = $scope.t;
                var count = $scope.count || 3000;
                for (var j = count; j--;) {
                    var trace0 = traces[j]
                    if (!trace0 || Math.random() < 0.003) {
                        var p = [sx * Math.random() + dx, sy * Math.random() + dy, t];
                        var trace = makeTrace(model, p, 0.01).move(2);
                        traces[j] = trace;
                    } else {
                        trace0.move(1);
                    }
                }
                $scope.model = model;
                $scope.model.traces = traces;
                $scope.paths = traces.map(function (t) { return t.trace; });
            } catch (ex) {
                console.log(ex);
            }
        }, {
            range: '=',
            count: '='
        });
    })
        .directive('wind2', function () {
            return functionPathBuilder(function ($scope, $attrs) {
//                try {
                    if (!$scope.f || !$scope.values) return;

                    var model = $scope.model || {};
                    var params = jQuery.map($scope.values, function (x) { return x.name; });
                    var functions = [];

                    var range = $scope.range || [-1, 1, -1, 1];
                    var sx = range[1] - range[0], dx = range[0];
                    var sy = range[3] - range[2], dy = range[2];

                    var ff = $scope.f;
                    if (!jQuery.isArray(ff)) ff = [ff];
                    var vars = [{name: 'x', value: 'v[0]'}, {name: 'y', value: 'v[1]'}, {name: 'vx', value: 'v[2]'}, {name: 'vy', value: 'v[3]'}, {name: 't', value: 'v[4]'}]
                                        .concat($scope.values);
                    var p = jQuery.map(vars, function (x) { return x.name + '=' + x.value; });

                    var body = 'var ' + p + '; return [' + ff[0] + '];';
                    model.live_f = new Function(['v'], body);

                    var traces = ($scope.model && $scope.model.traces) || [];
                    var t = $scope.t;
                    var count = $scope.count || 1000;
                    for (var j = count; j--;) {
                        var trace0 = traces[j]
                        if (!trace0 || Math.random() < 0.01) {
                            var p = [sx * Math.random() + dx, sy * Math.random() + dy, 1, 0, t];
                            var trace = makeTrace(model, p, 0.01).move(2);
                            traces[j] = trace;
                        } else {
                            trace0.move(1);
                        }
                    }
                    $scope.model = model;
                    $scope.model.traces = traces;
                    $scope.paths = traces.map(function (t) { return t.trace; });
//                } catch (ex) {
//                    console.log(ex);
//                }
            }, {
                range: '=',
                count: '='
            });
        }).controller("null", function () { });
/**
 * Created by andy on 11/16/14.
 */
angular
    .module('cmDemo', [])
    .directive('cmDemo', function () {
        var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
            window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
        return {
            scope: {
                running: '=',
                cmDemo: '&'
            },
            restrict: 'E',
            requires: ['draw'],
            transclude: false,
            replace: true,
            template: '<div class="demo-controls">\
                            <button class="btn" ng-click="running = true" ng-show="!running"><span class="glyphicon glyphicon-play"></span></button>\
                            <button class="btn" ng-click="running = false" ng-show="running"><span class="glyphicon glyphicon-pause"></button>\
                            <div class="btn-group">\
                                <button class="btn" ng-click="download()" class="extra"><span class="glyphicon glyphicon-picture"></button>\
                                <button class="btn" ng-click="fullScreen()" class="extra"><span class="glyphicon glyphicon-fullscreen"></button>\
                            </div>\
                    </div>',
            link: function (scope, element, attrs) {
                scope.current = null;
                var run = function (timestamp) {
                    scope.startTime = scope.startTime || timestamp;
                    scope.cmDemo({ t: timestamp - scope.startTimet });
                    if (scope.running) requestAnimationFrame(run);
                }
                scope.$watch('running', function (newVal) {
                    newVal && requestAnimationFrame(run);
                });
                scope.download = function () {
                    var canvas = element.siblings('canvas')[0]; //This is a hack
                    canvas.toBlob(function (blob) {
                        saveAs(blob, attrs.filename || "pretty image.png");
                    });
                }
                scope.fullScreen = function () {
                    var canvas = element.siblings('canvas')[0]; //This is a hack
                    scope.startSize = { width: canvas.width, height: canvas.height };
                    if (canvas.requestFullscreen) {
                        canvas.requestFullscreen();
                    } else if (canvas.msRequestFullscreen) {
                        canvas.msRequestFullscreen();
                    } else if (canvas.mozRequestFullScreen) {
                        canvas.mozRequestFullScreen();
                    } else if (canvas.webkitRequestFullscreen) {
                        canvas.webkitRequestFullscreen();
                    }

                    var events = ['webkitfullscreenchange', 'msfullscreenchange', 'mozfullscreenchange', 'fullscreenchange'];
                    var checkFullSize = function () {
                        if (!(document.mozFullScreenElement || document.webkitFullScreenElement || document.msFullScreenElement || document.fullScreenElement)) {
                            console.log('unsize')
                            canvas.width = scope.startSize.width;
                            canvas.height = scope.startSize.height;
                        }
                        jQuery.each(events, function (i, v) {
                            document.removeEventListener(v, checkFullSize);
                        });
                    };

                    jQuery.each(events, function (i, v) {
                        document.addEventListener(v, checkFullSize);
                    });

                    canvas.width = window.screen.width;
                    canvas.height = window.screen.height;
                }
            }
        };
    })
    .directive('drawTrace', function () {
        return {
            scope: {
                drawTrace: '='
            },
            controller: ['$scope', '$element', function ($scope, $element) {
                $scope.$watch("drawTrace.t", function () {
                    if (!$scope.draw || !$scope.drawTrace)
                        return;

                    $scope.draw($scope.drawTrace.trace, $element[0].getContext('2d'));
                });

                $scope.draw = function (v, ctx) {
                    var h = ctx.canvas.height, w = ctx.canvas.width;
                    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
                    ctx.strokeStyle = 'hsla(0, 50%, 50%, 0.05)';

                    ctx.beginPath();
                    ctx.moveTo((v[v.length - 1][0] + 60) * 5, (v[v.length - 1][1] + 60) * 5);
                    for (var i = v.length; i--;) {
                        var p = v[i];
                        if (i == 60000) { ctx.stroke(); ctx.beginPath(); ctx.strokeStyle = 'hsla(240, 80%, 50%, 0.05)'; }
                        ctx.lineTo((p[0] + 60) * 5, (p[1] + 60) * 5);
                    }
                    ctx.stroke();
                }
            }]
        }
    })
    .controller('windCtrl', [ '$scope', function ($scope) {
        $scope.advance = function (t) {
            $scope.$apply(function () {
                $scope.state.t += 0.01;
            });
        }
    }]);
//differential solvers.

Array.prototype.scale = function (s) {
    for (var i = this.length; i--;) {
        this[i] = this[i] * s;
    }
    return this;
}

Array.prototype.add = function (v) {
    for (var i = this.length; i--; ) {
        this[i] = this[i] + v[i];
    }
    return this;
}

Array.prototype.as = function(s, dt) {
    for(var i = this.length; i--; ) {
        this[i] = this[i] + dt * s[i];
    }
    return this;
}

Array.prototype.step = function (f, dt) {
    return this.as(f(this), dt);
}

Array.prototype.step2 = function (f, dt) {
    var temp = this.slice(0).step(f, dt/2);
    return this.add(f(temp).scale(dt));
}

Array.prototype.rk4 = function (f, dt) {
    var m1 = f(this);
    var m2 = f(this.slice(0).as(m1, dt / 2));
    var m3 = f(this.slice(0).as(m2, dt / 2));
    var m4 = f(this.slice(0).as(m3, dt));
    return this.slice(0).add(m1.as(m2, 2).as(m3, 2).add(m4).scale(dt / 6));
}

Array.prototype.predCor = function (f, dt, h) {
}
var makeTrace = function (f, p, dt) {
    //generates a trace of a multidimensional first order differential equation using the runga-kutta method.
    //f - the differential equation
    //p - the initial position of the trace
    //dt - the step size of the approximation.
    return {
        trace: [],
        p: p,
        f: f,
        dt: dt,
        t: 0,
        //Advance n steps, maintaining a constant array length.
        move: function (n) {
            var trace = n < this.trace.length ? this.trace.slice(n) : [],
                p = this.p,
                f1 = this.f.live_f || this.f;
                f = f1.bind(this),
                dt = this.dt;
            this.t += this.dt;
            for (var i = n; i--;) {
                trace.push(p);
                p = p.rk4(f, dt);
                p = p.rk4(f, dt);
                p = p.rk4(f, dt);
            }
            this.p = p;
            this.trace = trace;
            return this;
        }
    }
}
var makeLorenz = function (a, r, b) {
    return function (p) {
        var x = p[0], y = p[1], z = p[2];
        return [
                a * (y - x),
                x * (r - z) - y,
                x * y - b * z
        ];
    }
};
