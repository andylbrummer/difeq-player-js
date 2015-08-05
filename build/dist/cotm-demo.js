/**
 * Created by andy on 11/16/14.
 */
(function () {
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
})();
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
            template: '<ul class="ctrl-parameters"><li ng-repeat="p in values"><span ng-bind="p.name"></span><div slider max="p.max" min="p.min" step="p.step" precision="p.precision" ng-model="p.value"></div></li></ul>',
            controller: ['$scope', function ($scope) {
                $scope.setValues = function () {
                    var values = [];
                    jQuery.each($scope.parameters, function (key, value) {
                        values.push({ name: key, value: value[0] || 0, min: value[1] || -1, max: value[2] || 1, step: value[3] || 0.05, precision: 2 });
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
                var backingStore = ctx.backingStorePixelRatio ||
                    ctx.webkitBackingStorePixelRatio ||
                    ctx.mozBackingStorePixelRatio ||
                    ctx.msBackingStorePixelRatio ||
                    ctx.oBackingStorePixelRatio ||
                    ctx.backingStorePixelRatio || 1;

                var ratio = (window.devicePixelRatio || 1) / backingStore;
                var sx = c.width / (range[1] - range[0])/ratio, dx = range[0];
                var sy = c.height / (range[3] - range[2])/ratio, dy = range[2];
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImRlbW8uanMiLCJQYXJhbUNvbnRyb2xsZXIuanMiLCJzb2x2ZXIuanMiLCJ0cmFjZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2xIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQy9TQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN6Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImNvdG0tZGVtby5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxyXG4gKiBDcmVhdGVkIGJ5IGFuZHkgb24gMTEvMTYvMTQuXHJcbiAqL1xyXG4oZnVuY3Rpb24gKCkge1xyXG5hbmd1bGFyXHJcbiAgICAubW9kdWxlKCdjbURlbW8nLCBbXSlcclxuICAgIC5kaXJlY3RpdmUoJ2NtRGVtbycsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgcmVxdWVzdEFuaW1hdGlvbkZyYW1lID0gd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSB8fCB3aW5kb3cubW96UmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8XHJcbiAgICAgICAgICAgIHdpbmRvdy53ZWJraXRSZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHwgd2luZG93Lm1zUmVxdWVzdEFuaW1hdGlvbkZyYW1lO1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHNjb3BlOiB7XHJcbiAgICAgICAgICAgICAgICBydW5uaW5nOiAnPScsXHJcbiAgICAgICAgICAgICAgICBjbURlbW86ICcmJ1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICByZXN0cmljdDogJ0UnLFxyXG4gICAgICAgICAgICByZXF1aXJlczogWydkcmF3J10sXHJcbiAgICAgICAgICAgIHRyYW5zY2x1ZGU6IGZhbHNlLFxyXG4gICAgICAgICAgICByZXBsYWNlOiB0cnVlLFxyXG4gICAgICAgICAgICB0ZW1wbGF0ZTogJzxkaXYgY2xhc3M9XCJkZW1vLWNvbnRyb2xzXCI+XFxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b24gY2xhc3M9XCJidG5cIiBuZy1jbGljaz1cInJ1bm5pbmcgPSB0cnVlXCIgbmctc2hvdz1cIiFydW5uaW5nXCI+PHNwYW4gY2xhc3M9XCJnbHlwaGljb24gZ2x5cGhpY29uLXBsYXlcIj48L3NwYW4+PC9idXR0b24+XFxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b24gY2xhc3M9XCJidG5cIiBuZy1jbGljaz1cInJ1bm5pbmcgPSBmYWxzZVwiIG5nLXNob3c9XCJydW5uaW5nXCI+PHNwYW4gY2xhc3M9XCJnbHlwaGljb24gZ2x5cGhpY29uLXBhdXNlXCI+PC9idXR0b24+XFxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJidG4tZ3JvdXBcIj5cXFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b24gY2xhc3M9XCJidG5cIiBuZy1jbGljaz1cImRvd25sb2FkKClcIiBjbGFzcz1cImV4dHJhXCI+PHNwYW4gY2xhc3M9XCJnbHlwaGljb24gZ2x5cGhpY29uLXBpY3R1cmVcIj48L2J1dHRvbj5cXFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b24gY2xhc3M9XCJidG5cIiBuZy1jbGljaz1cImZ1bGxTY3JlZW4oKVwiIGNsYXNzPVwiZXh0cmFcIj48c3BhbiBjbGFzcz1cImdseXBoaWNvbiBnbHlwaGljb24tZnVsbHNjcmVlblwiPjwvYnV0dG9uPlxcXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cXFxyXG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PicsXHJcbiAgICAgICAgICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcclxuICAgICAgICAgICAgICAgIHNjb3BlLmN1cnJlbnQgPSBudWxsO1xyXG4gICAgICAgICAgICAgICAgdmFyIHJ1biA9IGZ1bmN0aW9uICh0aW1lc3RhbXApIHtcclxuICAgICAgICAgICAgICAgICAgICBzY29wZS5zdGFydFRpbWUgPSBzY29wZS5zdGFydFRpbWUgfHwgdGltZXN0YW1wO1xyXG4gICAgICAgICAgICAgICAgICAgIHNjb3BlLmNtRGVtbyh7IHQ6IHRpbWVzdGFtcCAtIHNjb3BlLnN0YXJ0VGltZXQgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNjb3BlLnJ1bm5pbmcpIHJlcXVlc3RBbmltYXRpb25GcmFtZShydW4pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgc2NvcGUuJHdhdGNoKCdydW5uaW5nJywgZnVuY3Rpb24gKG5ld1ZhbCkge1xyXG4gICAgICAgICAgICAgICAgICAgIG5ld1ZhbCAmJiByZXF1ZXN0QW5pbWF0aW9uRnJhbWUocnVuKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgc2NvcGUuZG93bmxvYWQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNhbnZhcyA9IGVsZW1lbnQuc2libGluZ3MoJ2NhbnZhcycpWzBdOyAvL1RoaXMgaXMgYSBoYWNrXHJcbiAgICAgICAgICAgICAgICAgICAgY2FudmFzLnRvQmxvYihmdW5jdGlvbiAoYmxvYikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzYXZlQXMoYmxvYiwgYXR0cnMuZmlsZW5hbWUgfHwgXCJwcmV0dHkgaW1hZ2UucG5nXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgc2NvcGUuZnVsbFNjcmVlbiA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgY2FudmFzID0gZWxlbWVudC5zaWJsaW5ncygnY2FudmFzJylbMF07IC8vVGhpcyBpcyBhIGhhY2tcclxuICAgICAgICAgICAgICAgICAgICBzY29wZS5zdGFydFNpemUgPSB7IHdpZHRoOiBjYW52YXMud2lkdGgsIGhlaWdodDogY2FudmFzLmhlaWdodCB9O1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChjYW52YXMucmVxdWVzdEZ1bGxzY3JlZW4pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FudmFzLnJlcXVlc3RGdWxsc2NyZWVuKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChjYW52YXMubXNSZXF1ZXN0RnVsbHNjcmVlbikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYW52YXMubXNSZXF1ZXN0RnVsbHNjcmVlbigpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoY2FudmFzLm1velJlcXVlc3RGdWxsU2NyZWVuKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhbnZhcy5tb3pSZXF1ZXN0RnVsbFNjcmVlbigpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoY2FudmFzLndlYmtpdFJlcXVlc3RGdWxsc2NyZWVuKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhbnZhcy53ZWJraXRSZXF1ZXN0RnVsbHNjcmVlbigpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGV2ZW50cyA9IFsnd2Via2l0ZnVsbHNjcmVlbmNoYW5nZScsICdtc2Z1bGxzY3JlZW5jaGFuZ2UnLCAnbW96ZnVsbHNjcmVlbmNoYW5nZScsICdmdWxsc2NyZWVuY2hhbmdlJ107XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNoZWNrRnVsbFNpemUgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghKGRvY3VtZW50Lm1vekZ1bGxTY3JlZW5FbGVtZW50IHx8IGRvY3VtZW50LndlYmtpdEZ1bGxTY3JlZW5FbGVtZW50IHx8IGRvY3VtZW50Lm1zRnVsbFNjcmVlbkVsZW1lbnQgfHwgZG9jdW1lbnQuZnVsbFNjcmVlbkVsZW1lbnQpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygndW5zaXplJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbnZhcy53aWR0aCA9IHNjb3BlLnN0YXJ0U2l6ZS53aWR0aDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbnZhcy5oZWlnaHQgPSBzY29wZS5zdGFydFNpemUuaGVpZ2h0O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGpRdWVyeS5lYWNoKGV2ZW50cywgZnVuY3Rpb24gKGksIHYpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIodiwgY2hlY2tGdWxsU2l6ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGpRdWVyeS5lYWNoKGV2ZW50cywgZnVuY3Rpb24gKGksIHYpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcih2LCBjaGVja0Z1bGxTaXplKTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgY2FudmFzLndpZHRoID0gd2luZG93LnNjcmVlbi53aWR0aDtcclxuICAgICAgICAgICAgICAgICAgICBjYW52YXMuaGVpZ2h0ID0gd2luZG93LnNjcmVlbi5oZWlnaHQ7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgfSlcclxuICAgIC5kaXJlY3RpdmUoJ2RyYXdUcmFjZScsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBzY29wZToge1xyXG4gICAgICAgICAgICAgICAgZHJhd1RyYWNlOiAnPSdcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgY29udHJvbGxlcjogWyckc2NvcGUnLCAnJGVsZW1lbnQnLCBmdW5jdGlvbiAoJHNjb3BlLCAkZWxlbWVudCkge1xyXG4gICAgICAgICAgICAgICAgJHNjb3BlLiR3YXRjaChcImRyYXdUcmFjZS50XCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoISRzY29wZS5kcmF3IHx8ICEkc2NvcGUuZHJhd1RyYWNlKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5kcmF3KCRzY29wZS5kcmF3VHJhY2UudHJhY2UsICRlbGVtZW50WzBdLmdldENvbnRleHQoJzJkJykpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgJHNjb3BlLmRyYXcgPSBmdW5jdGlvbiAodiwgY3R4KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGggPSBjdHguY2FudmFzLmhlaWdodCwgdyA9IGN0eC5jYW52YXMud2lkdGg7XHJcbiAgICAgICAgICAgICAgICAgICAgY3R4LmNsZWFyUmVjdCgwLCAwLCBjdHguY2FudmFzLndpZHRoLCBjdHguY2FudmFzLmhlaWdodCk7XHJcbiAgICAgICAgICAgICAgICAgICAgY3R4LnN0cm9rZVN0eWxlID0gJ2hzbGEoMCwgNTAlLCA1MCUsIDAuMDUpJztcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgY3R4LmJlZ2luUGF0aCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGN0eC5tb3ZlVG8oKHZbdi5sZW5ndGggLSAxXVswXSArIDYwKSAqIDUsICh2W3YubGVuZ3RoIC0gMV1bMV0gKyA2MCkgKiA1KTtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gdi5sZW5ndGg7IGktLTspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHAgPSB2W2ldO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaSA9PSA2MDAwMCkgeyBjdHguc3Ryb2tlKCk7IGN0eC5iZWdpblBhdGgoKTsgY3R4LnN0cm9rZVN0eWxlID0gJ2hzbGEoMjQwLCA4MCUsIDUwJSwgMC4wNSknOyB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0eC5saW5lVG8oKHBbMF0gKyA2MCkgKiA1LCAocFsxXSArIDYwKSAqIDUpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBjdHguc3Ryb2tlKCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1dXHJcbiAgICAgICAgfVxyXG4gICAgfSlcclxuICAgIC5jb250cm9sbGVyKCd3aW5kQ3RybCcsIFsgJyRzY29wZScsIGZ1bmN0aW9uICgkc2NvcGUpIHtcclxuICAgICAgICAkc2NvcGUuYWR2YW5jZSA9IGZ1bmN0aW9uICh0KSB7XHJcbiAgICAgICAgICAgICRzY29wZS4kYXBwbHkoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgJHNjb3BlLnN0YXRlLnQgKz0gMC4wMTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfV0pO1xyXG59KSgpOyIsInZhciBmdW5jdGlvblBhdGhCdWlsZGVyID0gZnVuY3Rpb24gKGZ1bmMsIGV4dHJhU2NvcGUpIHtcclxuICAgIHZhciBzY29wZSA9IGFuZ3VsYXIuZXh0ZW5kKHtcclxuICAgICAgICBmOiAnPScsXHJcbiAgICAgICAgdDogJz0nLFxyXG4gICAgICAgIHZhbHVlczogJz0nLFxyXG4gICAgICAgIHBhdGhzOiAnPScsXHJcbiAgICAgICAgbW9kZWw6ICc9J1xyXG4gICAgfSwgZXh0cmFTY29wZSk7IFxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICByZXN0cmljdDogJ0EnLFxyXG4gICAgICAgIHNjb3BlOiBzY29wZSxcclxuICAgICAgICBjb250cm9sbGVyOiBbJyRzY29wZScsICckYXR0cnMnLCBmdW5jdGlvbiAoJHNjb3BlLCAkYXR0cnMpIHtcclxuICAgICAgICAgICAgJHNjb3BlLiR3YXRjaCgndCcsIGZ1bmN0aW9uICgpIHsgZnVuYygkc2NvcGUsICRhdHRycyk7IH0pO1xyXG4gICAgICAgICAgICAkc2NvcGUuJHdhdGNoKCdmJywgZnVuY3Rpb24gKCkgeyBmdW5jKCRzY29wZSwgJGF0dHJzKTsgfSk7XHJcbiAgICAgICAgICAgICRzY29wZS4kd2F0Y2goJ3ZhbHVlcycsIGZ1bmN0aW9uICgpIHsgZnVuYygkc2NvcGUsICRhdHRycyk7IH0sIHRydWUpO1xyXG4gICAgICAgIH1dXHJcbiAgICB9O1xyXG59O1xyXG5cclxuXHJcbmFuZ3VsYXJcclxuICAgIC5tb2R1bGUoJ3BhcmFtQXBwJywgWyd1aS5ib290c3RyYXAtc2xpZGVyJ10pXHJcbiAgICAuZGlyZWN0aXZlKCdwYXJhbWV0ZXJzJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnQScsXHJcbiAgICAgICAgICAgIHNjb3BlOiB7XHJcbiAgICAgICAgICAgICAgICBwYXJhbWV0ZXJzOiAnPScsXHJcbiAgICAgICAgICAgICAgICB2YWx1ZXM6ICc9J1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB0ZW1wbGF0ZTogJzx1bCBjbGFzcz1cImN0cmwtcGFyYW1ldGVyc1wiPjxsaSBuZy1yZXBlYXQ9XCJwIGluIHZhbHVlc1wiPjxzcGFuIG5nLWJpbmQ9XCJwLm5hbWVcIj48L3NwYW4+PGRpdiBzbGlkZXIgbWF4PVwicC5tYXhcIiBtaW49XCJwLm1pblwiIHN0ZXA9XCJwLnN0ZXBcIiBwcmVjaXNpb249XCJwLnByZWNpc2lvblwiIG5nLW1vZGVsPVwicC52YWx1ZVwiPjwvZGl2PjwvbGk+PC91bD4nLFxyXG4gICAgICAgICAgICBjb250cm9sbGVyOiBbJyRzY29wZScsIGZ1bmN0aW9uICgkc2NvcGUpIHtcclxuICAgICAgICAgICAgICAgICRzY29wZS5zZXRWYWx1ZXMgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHZhbHVlcyA9IFtdO1xyXG4gICAgICAgICAgICAgICAgICAgIGpRdWVyeS5lYWNoKCRzY29wZS5wYXJhbWV0ZXJzLCBmdW5jdGlvbiAoa2V5LCB2YWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZXMucHVzaCh7IG5hbWU6IGtleSwgdmFsdWU6IHZhbHVlWzBdIHx8IDAsIG1pbjogdmFsdWVbMV0gfHwgLTEsIG1heDogdmFsdWVbMl0gfHwgMSwgc3RlcDogdmFsdWVbM10gfHwgMC4wNSwgcHJlY2lzaW9uOiAyIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAkc2NvcGUudmFsdWVzID0gdmFsdWVzO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgJHNjb3BlLnNldFZhbHVlcygpO1xyXG4gICAgICAgICAgICB9XVxyXG4gICAgICAgIH1cclxuICAgIH0pXHJcbiAgICAuZGlyZWN0aXZlKCdwYXRoUmVuZGVyJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnQScsXHJcbiAgICAgICAgICAgIHNjb3BlOiB7XHJcbiAgICAgICAgICAgICAgICBwYXRoUmVuZGVyOiAnPScsXHJcbiAgICAgICAgICAgICAgICBsaW5lU3R5bGU6ICc9JyxcclxuICAgICAgICAgICAgICAgIGxpbmVXaWR0aDogJz0nLFxyXG4gICAgICAgICAgICAgICAgYmFja2dyb3VuZFN0eWxlOiAnPScsXHJcbiAgICAgICAgICAgICAgICByYW5nZTogJz0nIC8vIFttaW5YLCBtYXhYLCBtaW5ZLCBtYXhZXVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBjb250cm9sbGVyOiBbJyRzY29wZScsICckZWxlbWVudCcsIGZ1bmN0aW9uICgkc2NvcGUsICRlbGVtZW50KSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgYyA9ICRlbGVtZW50WzBdO1xyXG4gICAgICAgICAgICAgICAgdmFyIGN0eCA9IGMuZ2V0Q29udGV4dCgnMmQnKTtcclxuICAgICAgICAgICAgICAgIHZhciByYW5nZSA9ICRzY29wZS5yYW5nZSB8fCBbLTEsIDEsIC0xLCAxXTtcclxuICAgICAgICAgICAgICAgIHZhciBiYWNraW5nU3RvcmUgPSBjdHguYmFja2luZ1N0b3JlUGl4ZWxSYXRpbyB8fFxyXG4gICAgICAgICAgICAgICAgICAgIGN0eC53ZWJraXRCYWNraW5nU3RvcmVQaXhlbFJhdGlvIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgY3R4Lm1vekJhY2tpbmdTdG9yZVBpeGVsUmF0aW8gfHxcclxuICAgICAgICAgICAgICAgICAgICBjdHgubXNCYWNraW5nU3RvcmVQaXhlbFJhdGlvIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgY3R4Lm9CYWNraW5nU3RvcmVQaXhlbFJhdGlvIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgY3R4LmJhY2tpbmdTdG9yZVBpeGVsUmF0aW8gfHwgMTtcclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgcmF0aW8gPSAod2luZG93LmRldmljZVBpeGVsUmF0aW8gfHwgMSkgLyBiYWNraW5nU3RvcmU7XHJcbiAgICAgICAgICAgICAgICB2YXIgc3ggPSBjLndpZHRoIC8gKHJhbmdlWzFdIC0gcmFuZ2VbMF0pL3JhdGlvLCBkeCA9IHJhbmdlWzBdO1xyXG4gICAgICAgICAgICAgICAgdmFyIHN5ID0gYy5oZWlnaHQgLyAocmFuZ2VbM10gLSByYW5nZVsyXSkvcmF0aW8sIGR5ID0gcmFuZ2VbMl07XHJcbiAgICAgICAgICAgICAgICBjdHgubGluZVdpZHRoID0gJHNjb3BlLmxpbmVXaWR0aCB8fCAyLjA7XHJcblxyXG4gICAgICAgICAgICAgICAgY3R4LmZpbGxTdHlsZSA9ICRzY29wZS5iYWNrZ3JvdW5kU3R5bGUgfHwgJ3JnYmEoMzAsIDMwLCAxODAsIDAuMDI1KSc7XHJcbiAgICAgICAgICAgICAgICBmb3IodmFyIGk9MjA7IGktLTsgKSBjdHguZmlsbFJlY3QoMCwgMCwgYy53aWR0aCwgYy5oZWlnaHQpO1xyXG5cclxuICAgICAgICAgICAgICAgIHZhciBkcmF3UGF0aHMgPSBmdW5jdGlvbiAocGF0aHMpIHtcclxuICAgICAgICAgICAgICAgICAgICBjdHgubGluZVdpZHRoID0gMC41O1xyXG4gICAgICAgICAgICAgICAgICAgIGN0eC5zdHJva2VTdHlsZSA9ICRzY29wZS5saW5lU3R5bGUgfHwgJ3JnYmEoMjU1LDI1NSwyNTUsMS4wKSc7XHJcbiAgICAgICAgICAgICAgICAgICAgY3R4LmZpbGxTdHlsZSA9ICRzY29wZS5iYWNrZ3JvdW5kU3R5bGUgfHwgJ3JnYmEoMzAsIDMwLCAxODAsIDAuMDI1KSc7XHJcbiAgICAgICAgICAgICAgICAgICAgY3R4LmZpbGxSZWN0KDAsIDAsIGMud2lkdGgsIGMuaGVpZ2h0KTtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBwYXRoSW5kZXggPSBwYXRocy5sZW5ndGg7IHBhdGhJbmRleC0tOykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcGF0aCA9IHBhdGhzW3BhdGhJbmRleF07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0eC5iZWdpblBhdGgoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGN1ciA9IHBhdGhbcGF0aC5sZW5ndGggLSAxXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY3R4Lm1vdmVUbygoY3VyWzBdIC0gZHgpICogc3gsIChjdXJbMV0gLSBkeSkgKiBzeSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSBwYXRoLmxlbmd0aDsgaS0tOykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHAgPSBwYXRoW2ldO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3R4LmxpbmVUbygocFswXSAtIGR4KSAqIHN4LCAocFsxXSAtIGR5KSAqIHN5KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjdHguc3Ryb2tlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgICRzY29wZS4kd2F0Y2goJ3BhdGhSZW5kZXInLCBmdW5jdGlvbiAodmFsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHZhbCAmJiB2YWwubGVuZ3RoICYmIHZhbC5sZW5ndGggPiAwKSBkcmF3UGF0aHModmFsKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XVxyXG4gICAgICAgIH1cclxuICAgIH0pXHJcbiAgICAuZGlyZWN0aXZlKCdkZW5zaXR5UmVuZGVyJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnQScsXHJcbiAgICAgICAgICAgIHNjb3BlOiB7XHJcbiAgICAgICAgICAgICAgICBkZW5zaXR5UmVuZGVyOiAnPSdcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgY29udHJvbGxlcjogWyckc2NvcGUnLCAnJGVsZW1lbnQnLCBmdW5jdGlvbiAoJHNjb3BlLCAkZWxlbWVudCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGMgPSAkZWxlbWVudFswXTtcclxuICAgICAgICAgICAgICAgIHZhciBjdHggPSBjLmdldENvbnRleHQoJzJkJyk7XHJcbiAgICAgICAgICAgICAgICB2YXIgZHggPSBjLndpZHRoIC8gMjtcclxuICAgICAgICAgICAgICAgIHZhciBkeSA9IGMuaGVpZ2h0IC8gMjtcclxuICAgICAgICAgICAgICAgIHZhciBjYyA9IHt9O1xyXG4gICAgICAgICAgICAgICAgdmFyIGZsID0gTWF0aC5mbG9vcjtcclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgcGxvdCA9IGZ1bmN0aW9uIChmdW5jdGlvbnMpIHtcclxuICAgICAgICAgICAgICAgICAgICBjdHguZmlsbFN0eWxlID0gJ3JnYmEoMCwwLDAsMS4wKSc7XHJcbiAgICAgICAgICAgICAgICAgICAgY3R4LmZpbGxSZWN0KDAsIDAsIGMud2lkdGgsIGMuaGVpZ2h0KTtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBmSW5kZXggPSBmdW5jdGlvbnMubGVuZ3RoOyBmSW5kZXgtLTspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGYgPSBmdW5jdGlvbnNbZkluZGV4XTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgeCA9IGMud2lkdGg7IHgtLTspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIHkgPSBjLmhlaWdodDsgeS0tOykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciB2YWwgPSBmbChmKHggLSBkeCwgeSAtIGR5KSAqIDEwMCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHZhbCA8IDApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3R4LmZpbGxTdHlsZSA9IGNjW3ZhbF0gfHwgKGNjW3ZhbF0gPSAnaHNsKDI1MCwnICsgLXZhbCArICclLDMwJSknKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHguZmlsbFN0eWxlID0gY2NbdmFsXSB8fCAoY2NbdmFsXSA9ICdoc2woNTAsJyArIHZhbCArICclLDMwJSknKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3R4LmZpbGxSZWN0KHgsIHksIDEsIDEpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgICRzY29wZS4kd2F0Y2goJ2RlbnNpdHlSZW5kZXInLCBmdW5jdGlvbiAodmFsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHZhbCAmJiB2YWwubGVuZ3RoICYmIHZhbC5sZW5ndGggPiAwKSBwbG90KHZhbCk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfV1cclxuICAgICAgICB9XHJcbiAgICB9KVxyXG4gICAgLmRpcmVjdGl2ZSgnZ3JhcGgnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uUGF0aEJ1aWxkZXIoZnVuY3Rpb24gKCRzY29wZSwgJGF0dHJzKSB7XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoISRzY29wZS5mIHx8ICEkc2NvcGUudmFsdWVzKSByZXR1cm47XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIHAgPSBqUXVlcnkubWFwKCRzY29wZS52YWx1ZXMsIGZ1bmN0aW9uICh4KSB7IHJldHVybiBwYXJzZUZsb2F0KHgudmFsdWUpOyB9KTtcclxuICAgICAgICAgICAgICAgIHZhciBwYXJhbXMgPSBqUXVlcnkubWFwKCRzY29wZS52YWx1ZXMsIGZ1bmN0aW9uICh4KSB7IHJldHVybiB4Lm5hbWU7IH0pO1xyXG4gICAgICAgICAgICAgICAgdmFyIHBhdGhzID0gW107XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIGZmID0gJHNjb3BlLmY7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWpRdWVyeS5pc0FycmF5KGZmKSkgZmYgPSBbZmZdO1xyXG5cclxuICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgZmYubGVuZ3RoOyArK2opIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgbGl2ZV9mID0gbmV3IEZ1bmN0aW9uKFsndCddLmNvbmNhdChwYXJhbXMpLCAncmV0dXJuICcgKyBmZltqXSArICc7Jyk7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHBhdGggPSBbXSwgcHAgPSBbLTFdLmNvbmNhdChwKSwgcGMgPSB7fTtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciB4ID0gLTE7IHggPCAxLjAyOyB4ICs9IDAuMDEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcHBbMF0gPSB4O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXRoLnB1c2goW3gsIGxpdmVfZi5hcHBseShwYywgcHApXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHBhdGhzLnB1c2gocGF0aCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgJHNjb3BlLnBhdGhzID0gcGF0aHM7XHJcbiAgICAgICAgICAgIH0gY2F0Y2ggKGV4KSB7XHJcbiAgICAgICAgICAgICAgICAvL2FsZXJ0KGV4KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfSlcclxuICAgIC5kaXJlY3RpdmUoJ3BhcmFtZXRyaWMnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uUGF0aEJ1aWxkZXIoZnVuY3Rpb24gKCRzY29wZSwgJGF0dHJzKSB7XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoISRzY29wZS5mIHx8ICEkc2NvcGUudmFsdWVzKSByZXR1cm47XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIHAgPSBqUXVlcnkubWFwKCRzY29wZS52YWx1ZXMsIGZ1bmN0aW9uICh4KSB7IHJldHVybiBwYXJzZUZsb2F0KHgudmFsdWUpOyB9KTtcclxuICAgICAgICAgICAgICAgIHZhciBwYXJhbXMgPSBqUXVlcnkubWFwKCRzY29wZS52YWx1ZXMsIGZ1bmN0aW9uICh4KSB7IHJldHVybiB4Lm5hbWU7IH0pO1xyXG4gICAgICAgICAgICAgICAgdmFyIHBhdGhzID0gW107XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIGZmID0gJHNjb3BlLmY7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWpRdWVyeS5pc0FycmF5KGZmKSkgZmYgPSBbZmZdO1xyXG5cclxuICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgZmYubGVuZ3RoOyArK2opIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgbGl2ZV9mID0gbmV3IEZ1bmN0aW9uKFsndCddLmNvbmNhdChwYXJhbXMpLCAncmV0dXJuICcgKyBmZltqXSArICc7Jyk7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHBhdGggPSBbXSwgcHAgPSBbMF0uY29uY2F0KHApLCBwYyA9IHt9O1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIHQgPSAtMTgwOyB0IDwgMTgwOyArK3QpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcHBbMF0gPSB0IC8gMTU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciByID0gbGl2ZV9mLmFwcGx5KHBjLCBwcCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhdGgucHVzaChbclswXSwgclsxXV0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBwYXRocy5wdXNoKHBhdGgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICRzY29wZS5wYXRocyA9IHBhdGhzO1xyXG4gICAgICAgICAgICB9IGNhdGNoIChleCkge1xyXG4gICAgICAgICAgICAgICAgLy9hbGVydChleCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH0pXHJcbiAgICAuZGlyZWN0aXZlKCdkZW5zaXR5JywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiBmdW5jdGlvblBhdGhCdWlsZGVyKGZ1bmN0aW9uICgkc2NvcGUsICRhdHRycykge1xyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgaWYgKCEkc2NvcGUuZiB8fCAhJHNjb3BlLnZhbHVlcykgcmV0dXJuO1xyXG5cclxuICAgICAgICAgICAgICAgIHZhciBwID0galF1ZXJ5Lm1hcCgkc2NvcGUudmFsdWVzLCBmdW5jdGlvbiAoeCkgeyByZXR1cm4geC5uYW1lICsgJz0nICsgeC52YWx1ZTsgfSk7XHJcbiAgICAgICAgICAgICAgICB2YXIgcGFyYW1zID0galF1ZXJ5Lm1hcCgkc2NvcGUudmFsdWVzLCBmdW5jdGlvbiAoeCkgeyByZXR1cm4geC5uYW1lOyB9KTtcclxuICAgICAgICAgICAgICAgIHZhciBmdW5jdGlvbnMgPSBbXTtcclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgZmYgPSAkc2NvcGUuZjtcclxuICAgICAgICAgICAgICAgIGlmICghalF1ZXJ5LmlzQXJyYXkoZmYpKSBmZiA9IFtmZl07XHJcblxyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBmZi5sZW5ndGg7ICsraikge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBib2R5ID0gJ3ZhciAnICsgcCArICc7cmV0dXJuICcgKyBmZltqXSArICc7JztcclxuICAgICAgICAgICAgICAgICAgICB2YXIgbGl2ZV9mID0gbmV3IEZ1bmN0aW9uKFsneCcsICd5J10uY29uY2F0KHBhcmFtcyksIGJvZHkpO1xyXG4gICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9ucy5wdXNoKGxpdmVfZik7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgJHNjb3BlLnBhdGhzID0gZnVuY3Rpb25zO1xyXG4gICAgICAgICAgICB9IGNhdGNoIChleCkge1xyXG4gICAgICAgICAgICAgICAgLy9hbGVydChleCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH0pXHJcbiAgICAuZGlyZWN0aXZlKCd3aW5kJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiBmdW5jdGlvblBhdGhCdWlsZGVyKGZ1bmN0aW9uICgkc2NvcGUsICRhdHRycykge1xyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgaWYgKCEkc2NvcGUuZiB8fCAhJHNjb3BlLnZhbHVlcykgcmV0dXJuO1xyXG5cclxuICAgICAgICAgICAgICAgIHZhciBtb2RlbCA9ICRzY29wZS5tb2RlbCB8fCB7fTtcclxuICAgICAgICAgICAgICAgIHZhciBwYXJhbXMgPSBqUXVlcnkubWFwKCRzY29wZS52YWx1ZXMsIGZ1bmN0aW9uICh4KSB7IHJldHVybiB4Lm5hbWU7IH0pO1xyXG4gICAgICAgICAgICAgICAgdmFyIGZ1bmN0aW9ucyA9IFtdO1xyXG5cclxuICAgICAgICAgICAgICAgIHZhciByYW5nZSA9ICRzY29wZS5yYW5nZSB8fCBbLTEsIDEsIC0xLCAxXTtcclxuICAgICAgICAgICAgICAgIHZhciBzeCA9IHJhbmdlWzFdIC0gcmFuZ2VbMF0sIGR4ID0gcmFuZ2VbMF07XHJcbiAgICAgICAgICAgICAgICB2YXIgc3kgPSByYW5nZVszXSAtIHJhbmdlWzJdLCBkeSA9IHJhbmdlWzJdO1xyXG5cclxuICAgICAgICAgICAgICAgIHZhciBmZiA9ICRzY29wZS5mO1xyXG4gICAgICAgICAgICAgICAgaWYgKCFqUXVlcnkuaXNBcnJheShmZikpIGZmID0gW2ZmXTtcclxuICAgICAgICAgICAgICAgIHZhciB2YXJzID0gW3tuYW1lOiAneCcsIHZhbHVlOiAndlswXSd9LCB7bmFtZTogJ3knLCB2YWx1ZTogJ3ZbMV0nfSwge25hbWU6ICd6JywgdmFsdWU6ICd2WzJdJ31dLmNvbmNhdCgkc2NvcGUudmFsdWVzKTtcclxuICAgICAgICAgICAgICAgIHZhciBwID0galF1ZXJ5Lm1hcCh2YXJzLCBmdW5jdGlvbiAoeCkgeyByZXR1cm4geC5uYW1lICsgJz0nICsgeC52YWx1ZTsgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIGJvZHkgPSAndmFyICcgKyBwICsgJzsgcmV0dXJuIFsnICsgZmZbMF0gKyAnXTsnO1xyXG4gICAgICAgICAgICAgICAgbW9kZWwubGl2ZV9mID0gbmV3IEZ1bmN0aW9uKFsndiddLCBib2R5KTtcclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgdHJhY2VzID0gKCRzY29wZS5tb2RlbCAmJiAkc2NvcGUubW9kZWwudHJhY2VzKSB8fCBbXTtcclxuICAgICAgICAgICAgICAgIHZhciB0ID0gJHNjb3BlLnQ7XHJcbiAgICAgICAgICAgICAgICB2YXIgY291bnQgPSAkc2NvcGUuY291bnQgfHwgMzAwMDtcclxuICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSBjb3VudDsgai0tOykge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciB0cmFjZTAgPSB0cmFjZXNbal1cclxuICAgICAgICAgICAgICAgICAgICBpZiAoIXRyYWNlMCB8fCBNYXRoLnJhbmRvbSgpIDwgMC4wMDMpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHAgPSBbc3ggKiBNYXRoLnJhbmRvbSgpICsgZHgsIHN5ICogTWF0aC5yYW5kb20oKSArIGR5LCB0XTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHRyYWNlID0gbWFrZVRyYWNlKG1vZGVsLCBwLCAwLjAxKS5tb3ZlKDIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0cmFjZXNbal0gPSB0cmFjZTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0cmFjZTAubW92ZSgxKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAkc2NvcGUubW9kZWwgPSBtb2RlbDtcclxuICAgICAgICAgICAgICAgICRzY29wZS5tb2RlbC50cmFjZXMgPSB0cmFjZXM7XHJcbiAgICAgICAgICAgICAgICAkc2NvcGUucGF0aHMgPSB0cmFjZXMubWFwKGZ1bmN0aW9uICh0KSB7IHJldHVybiB0LnRyYWNlOyB9KTtcclxuICAgICAgICAgICAgfSBjYXRjaCAoZXgpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGV4KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sIHtcclxuICAgICAgICAgICAgcmFuZ2U6ICc9JyxcclxuICAgICAgICAgICAgY291bnQ6ICc9J1xyXG4gICAgICAgIH0pO1xyXG4gICAgfSlcclxuICAgICAgICAuZGlyZWN0aXZlKCd3aW5kMicsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uUGF0aEJ1aWxkZXIoZnVuY3Rpb24gKCRzY29wZSwgJGF0dHJzKSB7XHJcbi8vICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCEkc2NvcGUuZiB8fCAhJHNjb3BlLnZhbHVlcykgcmV0dXJuO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICB2YXIgbW9kZWwgPSAkc2NvcGUubW9kZWwgfHwge307XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHBhcmFtcyA9IGpRdWVyeS5tYXAoJHNjb3BlLnZhbHVlcywgZnVuY3Rpb24gKHgpIHsgcmV0dXJuIHgubmFtZTsgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGZ1bmN0aW9ucyA9IFtdO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICB2YXIgcmFuZ2UgPSAkc2NvcGUucmFuZ2UgfHwgWy0xLCAxLCAtMSwgMV07XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHN4ID0gcmFuZ2VbMV0gLSByYW5nZVswXSwgZHggPSByYW5nZVswXTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgc3kgPSByYW5nZVszXSAtIHJhbmdlWzJdLCBkeSA9IHJhbmdlWzJdO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICB2YXIgZmYgPSAkc2NvcGUuZjtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIWpRdWVyeS5pc0FycmF5KGZmKSkgZmYgPSBbZmZdO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciB2YXJzID0gW3tuYW1lOiAneCcsIHZhbHVlOiAndlswXSd9LCB7bmFtZTogJ3knLCB2YWx1ZTogJ3ZbMV0nfSwge25hbWU6ICd2eCcsIHZhbHVlOiAndlsyXSd9LCB7bmFtZTogJ3Z5JywgdmFsdWU6ICd2WzNdJ30sIHtuYW1lOiAndCcsIHZhbHVlOiAndls0XSd9XVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLmNvbmNhdCgkc2NvcGUudmFsdWVzKTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgcCA9IGpRdWVyeS5tYXAodmFycywgZnVuY3Rpb24gKHgpIHsgcmV0dXJuIHgubmFtZSArICc9JyArIHgudmFsdWU7IH0pO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICB2YXIgYm9keSA9ICd2YXIgJyArIHAgKyAnOyByZXR1cm4gWycgKyBmZlswXSArICddOyc7XHJcbiAgICAgICAgICAgICAgICAgICAgbW9kZWwubGl2ZV9mID0gbmV3IEZ1bmN0aW9uKFsndiddLCBib2R5KTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHRyYWNlcyA9ICgkc2NvcGUubW9kZWwgJiYgJHNjb3BlLm1vZGVsLnRyYWNlcykgfHwgW107XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHQgPSAkc2NvcGUudDtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgY291bnQgPSAkc2NvcGUuY291bnQgfHwgMTAwMDtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gY291bnQ7IGotLTspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHRyYWNlMCA9IHRyYWNlc1tqXVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXRyYWNlMCB8fCBNYXRoLnJhbmRvbSgpIDwgMC4wMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHAgPSBbc3ggKiBNYXRoLnJhbmRvbSgpICsgZHgsIHN5ICogTWF0aC5yYW5kb20oKSArIGR5LCAxLCAwLCB0XTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0cmFjZSA9IG1ha2VUcmFjZShtb2RlbCwgcCwgMC4wMSkubW92ZSgyKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyYWNlc1tqXSA9IHRyYWNlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJhY2UwLm1vdmUoMSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLm1vZGVsID0gbW9kZWw7XHJcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLm1vZGVsLnRyYWNlcyA9IHRyYWNlcztcclxuICAgICAgICAgICAgICAgICAgICAkc2NvcGUucGF0aHMgPSB0cmFjZXMubWFwKGZ1bmN0aW9uICh0KSB7IHJldHVybiB0LnRyYWNlOyB9KTtcclxuLy8gICAgICAgICAgICAgICAgfSBjYXRjaCAoZXgpIHtcclxuLy8gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGV4KTtcclxuLy8gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LCB7XHJcbiAgICAgICAgICAgICAgICByYW5nZTogJz0nLFxyXG4gICAgICAgICAgICAgICAgY291bnQ6ICc9J1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KS5jb250cm9sbGVyKFwibnVsbFwiLCBmdW5jdGlvbiAoKSB7IH0pOyIsIi8vZGlmZmVyZW50aWFsIHNvbHZlcnMuXHJcblxyXG5BcnJheS5wcm90b3R5cGUuc2NhbGUgPSBmdW5jdGlvbiAocykge1xyXG4gICAgZm9yICh2YXIgaSA9IHRoaXMubGVuZ3RoOyBpLS07KSB7XHJcbiAgICAgICAgdGhpc1tpXSA9IHRoaXNbaV0gKiBzO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn1cclxuXHJcbkFycmF5LnByb3RvdHlwZS5hZGQgPSBmdW5jdGlvbiAodikge1xyXG4gICAgZm9yICh2YXIgaSA9IHRoaXMubGVuZ3RoOyBpLS07ICkge1xyXG4gICAgICAgIHRoaXNbaV0gPSB0aGlzW2ldICsgdltpXTtcclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzO1xyXG59XHJcblxyXG5BcnJheS5wcm90b3R5cGUuYXMgPSBmdW5jdGlvbihzLCBkdCkge1xyXG4gICAgZm9yKHZhciBpID0gdGhpcy5sZW5ndGg7IGktLTsgKSB7XHJcbiAgICAgICAgdGhpc1tpXSA9IHRoaXNbaV0gKyBkdCAqIHNbaV07XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpcztcclxufVxyXG5cclxuQXJyYXkucHJvdG90eXBlLnN0ZXAgPSBmdW5jdGlvbiAoZiwgZHQpIHtcclxuICAgIHJldHVybiB0aGlzLmFzKGYodGhpcyksIGR0KTtcclxufVxyXG5cclxuQXJyYXkucHJvdG90eXBlLnN0ZXAyID0gZnVuY3Rpb24gKGYsIGR0KSB7XHJcbiAgICB2YXIgdGVtcCA9IHRoaXMuc2xpY2UoMCkuc3RlcChmLCBkdC8yKTtcclxuICAgIHJldHVybiB0aGlzLmFkZChmKHRlbXApLnNjYWxlKGR0KSk7XHJcbn1cclxuXHJcbkFycmF5LnByb3RvdHlwZS5yazQgPSBmdW5jdGlvbiAoZiwgZHQpIHtcclxuICAgIHZhciBtMSA9IGYodGhpcyk7XHJcbiAgICB2YXIgbTIgPSBmKHRoaXMuc2xpY2UoMCkuYXMobTEsIGR0IC8gMikpO1xyXG4gICAgdmFyIG0zID0gZih0aGlzLnNsaWNlKDApLmFzKG0yLCBkdCAvIDIpKTtcclxuICAgIHZhciBtNCA9IGYodGhpcy5zbGljZSgwKS5hcyhtMywgZHQpKTtcclxuICAgIHJldHVybiB0aGlzLnNsaWNlKDApLmFkZChtMS5hcyhtMiwgMikuYXMobTMsIDIpLmFkZChtNCkuc2NhbGUoZHQgLyA2KSk7XHJcbn1cclxuXHJcbkFycmF5LnByb3RvdHlwZS5wcmVkQ29yID0gZnVuY3Rpb24gKGYsIGR0LCBoKSB7XHJcbn0iLCJ2YXIgbWFrZVRyYWNlID0gZnVuY3Rpb24gKGYsIHAsIGR0KSB7XHJcbiAgICAvL2dlbmVyYXRlcyBhIHRyYWNlIG9mIGEgbXVsdGlkaW1lbnNpb25hbCBmaXJzdCBvcmRlciBkaWZmZXJlbnRpYWwgZXF1YXRpb24gdXNpbmcgdGhlIHJ1bmdhLWt1dHRhIG1ldGhvZC5cclxuICAgIC8vZiAtIHRoZSBkaWZmZXJlbnRpYWwgZXF1YXRpb25cclxuICAgIC8vcCAtIHRoZSBpbml0aWFsIHBvc2l0aW9uIG9mIHRoZSB0cmFjZVxyXG4gICAgLy9kdCAtIHRoZSBzdGVwIHNpemUgb2YgdGhlIGFwcHJveGltYXRpb24uXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIHRyYWNlOiBbXSxcclxuICAgICAgICBwOiBwLFxyXG4gICAgICAgIGY6IGYsXHJcbiAgICAgICAgZHQ6IGR0LFxyXG4gICAgICAgIHQ6IDAsXHJcbiAgICAgICAgLy9BZHZhbmNlIG4gc3RlcHMsIG1haW50YWluaW5nIGEgY29uc3RhbnQgYXJyYXkgbGVuZ3RoLlxyXG4gICAgICAgIG1vdmU6IGZ1bmN0aW9uIChuKSB7XHJcbiAgICAgICAgICAgIHZhciB0cmFjZSA9IG4gPCB0aGlzLnRyYWNlLmxlbmd0aCA/IHRoaXMudHJhY2Uuc2xpY2UobikgOiBbXSxcclxuICAgICAgICAgICAgICAgIHAgPSB0aGlzLnAsXHJcbiAgICAgICAgICAgICAgICBmMSA9IHRoaXMuZi5saXZlX2YgfHwgdGhpcy5mO1xyXG4gICAgICAgICAgICAgICAgZiA9IGYxLmJpbmQodGhpcyksXHJcbiAgICAgICAgICAgICAgICBkdCA9IHRoaXMuZHQ7XHJcbiAgICAgICAgICAgIHRoaXMudCArPSB0aGlzLmR0O1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gbjsgaS0tOykge1xyXG4gICAgICAgICAgICAgICAgdHJhY2UucHVzaChwKTtcclxuICAgICAgICAgICAgICAgIHAgPSBwLnJrNChmLCBkdCk7XHJcbiAgICAgICAgICAgICAgICBwID0gcC5yazQoZiwgZHQpO1xyXG4gICAgICAgICAgICAgICAgcCA9IHAucms0KGYsIGR0KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLnAgPSBwO1xyXG4gICAgICAgICAgICB0aGlzLnRyYWNlID0gdHJhY2U7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG52YXIgbWFrZUxvcmVueiA9IGZ1bmN0aW9uIChhLCByLCBiKSB7XHJcbiAgICByZXR1cm4gZnVuY3Rpb24gKHApIHtcclxuICAgICAgICB2YXIgeCA9IHBbMF0sIHkgPSBwWzFdLCB6ID0gcFsyXTtcclxuICAgICAgICByZXR1cm4gW1xyXG4gICAgICAgICAgICAgICAgYSAqICh5IC0geCksXHJcbiAgICAgICAgICAgICAgICB4ICogKHIgLSB6KSAtIHksXHJcbiAgICAgICAgICAgICAgICB4ICogeSAtIGIgKiB6XHJcbiAgICAgICAgXTtcclxuICAgIH1cclxufTtcclxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9