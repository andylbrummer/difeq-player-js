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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImRlbW8uanMiLCJQYXJhbUNvbnRyb2xsZXIuanMiLCJzb2x2ZXIuanMiLCJ0cmFjZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2xIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQy9TQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN6Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImNvdG0tZGVtby5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxyXG4gKiBDcmVhdGVkIGJ5IGFuZHkgb24gMTEvMTYvMTQuXHJcbiAqL1xyXG4oZnVuY3Rpb24gKCkge1xyXG5hbmd1bGFyXHJcbiAgICAubW9kdWxlKCdjbURlbW8nLCBbXSlcclxuICAgIC5kaXJlY3RpdmUoJ2NtRGVtbycsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgcmVxdWVzdEFuaW1hdGlvbkZyYW1lID0gd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSB8fCB3aW5kb3cubW96UmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8XHJcbiAgICAgICAgICAgIHdpbmRvdy53ZWJraXRSZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHwgd2luZG93Lm1zUmVxdWVzdEFuaW1hdGlvbkZyYW1lO1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHNjb3BlOiB7XHJcbiAgICAgICAgICAgICAgICBydW5uaW5nOiAnPScsXHJcbiAgICAgICAgICAgICAgICBjbURlbW86ICcmJ1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICByZXN0cmljdDogJ0UnLFxyXG4gICAgICAgICAgICByZXF1aXJlczogWydkcmF3J10sXHJcbiAgICAgICAgICAgIHRyYW5zY2x1ZGU6IGZhbHNlLFxyXG4gICAgICAgICAgICByZXBsYWNlOiB0cnVlLFxyXG4gICAgICAgICAgICB0ZW1wbGF0ZTogJzxkaXYgY2xhc3M9XCJkZW1vLWNvbnRyb2xzXCI+XFxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b24gY2xhc3M9XCJidG5cIiBuZy1jbGljaz1cInJ1bm5pbmcgPSB0cnVlXCIgbmctc2hvdz1cIiFydW5uaW5nXCI+PHNwYW4gY2xhc3M9XCJnbHlwaGljb24gZ2x5cGhpY29uLXBsYXlcIj48L3NwYW4+PC9idXR0b24+XFxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b24gY2xhc3M9XCJidG5cIiBuZy1jbGljaz1cInJ1bm5pbmcgPSBmYWxzZVwiIG5nLXNob3c9XCJydW5uaW5nXCI+PHNwYW4gY2xhc3M9XCJnbHlwaGljb24gZ2x5cGhpY29uLXBhdXNlXCI+PC9idXR0b24+XFxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJidG4tZ3JvdXBcIj5cXFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b24gY2xhc3M9XCJidG5cIiBuZy1jbGljaz1cImRvd25sb2FkKClcIiBjbGFzcz1cImV4dHJhXCI+PHNwYW4gY2xhc3M9XCJnbHlwaGljb24gZ2x5cGhpY29uLXBpY3R1cmVcIj48L2J1dHRvbj5cXFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b24gY2xhc3M9XCJidG5cIiBuZy1jbGljaz1cImZ1bGxTY3JlZW4oKVwiIGNsYXNzPVwiZXh0cmFcIj48c3BhbiBjbGFzcz1cImdseXBoaWNvbiBnbHlwaGljb24tZnVsbHNjcmVlblwiPjwvYnV0dG9uPlxcXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cXFxyXG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PicsXHJcbiAgICAgICAgICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcclxuICAgICAgICAgICAgICAgIHNjb3BlLmN1cnJlbnQgPSBudWxsO1xyXG4gICAgICAgICAgICAgICAgdmFyIHJ1biA9IGZ1bmN0aW9uICh0aW1lc3RhbXApIHtcclxuICAgICAgICAgICAgICAgICAgICBzY29wZS5zdGFydFRpbWUgPSBzY29wZS5zdGFydFRpbWUgfHwgdGltZXN0YW1wO1xyXG4gICAgICAgICAgICAgICAgICAgIHNjb3BlLmNtRGVtbyh7IHQ6IHRpbWVzdGFtcCAtIHNjb3BlLnN0YXJ0VGltZXQgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNjb3BlLnJ1bm5pbmcpIHJlcXVlc3RBbmltYXRpb25GcmFtZShydW4pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgc2NvcGUuJHdhdGNoKCdydW5uaW5nJywgZnVuY3Rpb24gKG5ld1ZhbCkge1xyXG4gICAgICAgICAgICAgICAgICAgIG5ld1ZhbCAmJiByZXF1ZXN0QW5pbWF0aW9uRnJhbWUocnVuKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgc2NvcGUuZG93bmxvYWQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNhbnZhcyA9IGVsZW1lbnQuc2libGluZ3MoJ2NhbnZhcycpWzBdOyAvL1RoaXMgaXMgYSBoYWNrXHJcbiAgICAgICAgICAgICAgICAgICAgY2FudmFzLnRvQmxvYihmdW5jdGlvbiAoYmxvYikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzYXZlQXMoYmxvYiwgYXR0cnMuZmlsZW5hbWUgfHwgXCJwcmV0dHkgaW1hZ2UucG5nXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgc2NvcGUuZnVsbFNjcmVlbiA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgY2FudmFzID0gZWxlbWVudC5zaWJsaW5ncygnY2FudmFzJylbMF07IC8vVGhpcyBpcyBhIGhhY2tcclxuICAgICAgICAgICAgICAgICAgICBzY29wZS5zdGFydFNpemUgPSB7IHdpZHRoOiBjYW52YXMud2lkdGgsIGhlaWdodDogY2FudmFzLmhlaWdodCB9O1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChjYW52YXMucmVxdWVzdEZ1bGxzY3JlZW4pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FudmFzLnJlcXVlc3RGdWxsc2NyZWVuKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChjYW52YXMubXNSZXF1ZXN0RnVsbHNjcmVlbikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYW52YXMubXNSZXF1ZXN0RnVsbHNjcmVlbigpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoY2FudmFzLm1velJlcXVlc3RGdWxsU2NyZWVuKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhbnZhcy5tb3pSZXF1ZXN0RnVsbFNjcmVlbigpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoY2FudmFzLndlYmtpdFJlcXVlc3RGdWxsc2NyZWVuKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhbnZhcy53ZWJraXRSZXF1ZXN0RnVsbHNjcmVlbigpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGV2ZW50cyA9IFsnd2Via2l0ZnVsbHNjcmVlbmNoYW5nZScsICdtc2Z1bGxzY3JlZW5jaGFuZ2UnLCAnbW96ZnVsbHNjcmVlbmNoYW5nZScsICdmdWxsc2NyZWVuY2hhbmdlJ107XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNoZWNrRnVsbFNpemUgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghKGRvY3VtZW50Lm1vekZ1bGxTY3JlZW5FbGVtZW50IHx8IGRvY3VtZW50LndlYmtpdEZ1bGxTY3JlZW5FbGVtZW50IHx8IGRvY3VtZW50Lm1zRnVsbFNjcmVlbkVsZW1lbnQgfHwgZG9jdW1lbnQuZnVsbFNjcmVlbkVsZW1lbnQpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygndW5zaXplJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbnZhcy53aWR0aCA9IHNjb3BlLnN0YXJ0U2l6ZS53aWR0aDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbnZhcy5oZWlnaHQgPSBzY29wZS5zdGFydFNpemUuaGVpZ2h0O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGpRdWVyeS5lYWNoKGV2ZW50cywgZnVuY3Rpb24gKGksIHYpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIodiwgY2hlY2tGdWxsU2l6ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGpRdWVyeS5lYWNoKGV2ZW50cywgZnVuY3Rpb24gKGksIHYpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcih2LCBjaGVja0Z1bGxTaXplKTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgY2FudmFzLndpZHRoID0gd2luZG93LnNjcmVlbi53aWR0aDtcclxuICAgICAgICAgICAgICAgICAgICBjYW52YXMuaGVpZ2h0ID0gd2luZG93LnNjcmVlbi5oZWlnaHQ7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgfSlcclxuICAgIC5kaXJlY3RpdmUoJ2RyYXdUcmFjZScsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBzY29wZToge1xyXG4gICAgICAgICAgICAgICAgZHJhd1RyYWNlOiAnPSdcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgY29udHJvbGxlcjogWyckc2NvcGUnLCAnJGVsZW1lbnQnLCBmdW5jdGlvbiAoJHNjb3BlLCAkZWxlbWVudCkge1xyXG4gICAgICAgICAgICAgICAgJHNjb3BlLiR3YXRjaChcImRyYXdUcmFjZS50XCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoISRzY29wZS5kcmF3IHx8ICEkc2NvcGUuZHJhd1RyYWNlKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5kcmF3KCRzY29wZS5kcmF3VHJhY2UudHJhY2UsICRlbGVtZW50WzBdLmdldENvbnRleHQoJzJkJykpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgJHNjb3BlLmRyYXcgPSBmdW5jdGlvbiAodiwgY3R4KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGggPSBjdHguY2FudmFzLmhlaWdodCwgdyA9IGN0eC5jYW52YXMud2lkdGg7XHJcbiAgICAgICAgICAgICAgICAgICAgY3R4LmNsZWFyUmVjdCgwLCAwLCBjdHguY2FudmFzLndpZHRoLCBjdHguY2FudmFzLmhlaWdodCk7XHJcbiAgICAgICAgICAgICAgICAgICAgY3R4LnN0cm9rZVN0eWxlID0gJ2hzbGEoMCwgNTAlLCA1MCUsIDAuMDUpJztcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgY3R4LmJlZ2luUGF0aCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGN0eC5tb3ZlVG8oKHZbdi5sZW5ndGggLSAxXVswXSArIDYwKSAqIDUsICh2W3YubGVuZ3RoIC0gMV1bMV0gKyA2MCkgKiA1KTtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gdi5sZW5ndGg7IGktLTspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHAgPSB2W2ldO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaSA9PSA2MDAwMCkgeyBjdHguc3Ryb2tlKCk7IGN0eC5iZWdpblBhdGgoKTsgY3R4LnN0cm9rZVN0eWxlID0gJ2hzbGEoMjQwLCA4MCUsIDUwJSwgMC4wNSknOyB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0eC5saW5lVG8oKHBbMF0gKyA2MCkgKiA1LCAocFsxXSArIDYwKSAqIDUpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBjdHguc3Ryb2tlKCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1dXHJcbiAgICAgICAgfVxyXG4gICAgfSlcclxuICAgIC5jb250cm9sbGVyKCd3aW5kQ3RybCcsIFsgJyRzY29wZScsIGZ1bmN0aW9uICgkc2NvcGUpIHtcclxuICAgICAgICAkc2NvcGUuYWR2YW5jZSA9IGZ1bmN0aW9uICh0KSB7XHJcbiAgICAgICAgICAgICRzY29wZS4kYXBwbHkoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgJHNjb3BlLnN0YXRlLnQgKz0gMC4wMTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfV0pO1xyXG59KSgpOyIsInZhciBmdW5jdGlvblBhdGhCdWlsZGVyID0gZnVuY3Rpb24gKGZ1bmMsIGV4dHJhU2NvcGUpIHtcclxuICAgIHZhciBzY29wZSA9IGFuZ3VsYXIuZXh0ZW5kKHtcclxuICAgICAgICBmOiAnPScsXHJcbiAgICAgICAgdDogJz0nLFxyXG4gICAgICAgIHZhbHVlczogJz0nLFxyXG4gICAgICAgIHBhdGhzOiAnPScsXHJcbiAgICAgICAgbW9kZWw6ICc9J1xyXG4gICAgfSwgZXh0cmFTY29wZSk7IFxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICByZXN0cmljdDogJ0EnLFxyXG4gICAgICAgIHNjb3BlOiBzY29wZSxcclxuICAgICAgICBjb250cm9sbGVyOiBbJyRzY29wZScsICckYXR0cnMnLCBmdW5jdGlvbiAoJHNjb3BlLCAkYXR0cnMpIHtcclxuICAgICAgICAgICAgJHNjb3BlLiR3YXRjaCgndCcsIGZ1bmN0aW9uICgpIHsgZnVuYygkc2NvcGUsICRhdHRycyk7IH0pO1xyXG4gICAgICAgICAgICAkc2NvcGUuJHdhdGNoKCdmJywgZnVuY3Rpb24gKCkgeyBmdW5jKCRzY29wZSwgJGF0dHJzKTsgfSk7XHJcbiAgICAgICAgICAgICRzY29wZS4kd2F0Y2goJ3ZhbHVlcycsIGZ1bmN0aW9uICgpIHsgZnVuYygkc2NvcGUsICRhdHRycyk7IH0sIHRydWUpO1xyXG4gICAgICAgIH1dXHJcbiAgICB9O1xyXG59O1xyXG5cclxuXHJcbmFuZ3VsYXJcclxuICAgIC5tb2R1bGUoJ3BhcmFtQXBwJywgWyd1aS5ib290c3RyYXAtc2xpZGVyJ10pXHJcbiAgICAuZGlyZWN0aXZlKCdwYXJhbWV0ZXJzJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnQScsXHJcbiAgICAgICAgICAgIHNjb3BlOiB7XHJcbiAgICAgICAgICAgICAgICBwYXJhbWV0ZXJzOiAnPScsXHJcbiAgICAgICAgICAgICAgICB2YWx1ZXM6ICc9J1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB0ZW1wbGF0ZTogJzx1bCBjbGFzcz1cImN0cmwtcGFyYW1ldGVyc1wiPjxsaSBuZy1yZXBlYXQ9XCJwIGluIHZhbHVlc1wiPjxzcGFuIG5nLWJpbmQ9XCJwLm5hbWVcIj48L3NwYW4+PGRpdiBzbGlkZXIgbWF4PVwie3twLm1heH19XCIgbWluPVwie3twLm1pbn19XCIgc3RlcD1cInt7cC5zdGVwfX1cIiBuZy1tb2RlbD1cInAudmFsdWVcIj48L2Rpdj48L2xpPjwvdWw+JyxcclxuICAgICAgICAgICAgY29udHJvbGxlcjogWyckc2NvcGUnLCBmdW5jdGlvbiAoJHNjb3BlKSB7XHJcbiAgICAgICAgICAgICAgICAkc2NvcGUuc2V0VmFsdWVzID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciB2YWx1ZXMgPSBbXTtcclxuICAgICAgICAgICAgICAgICAgICBqUXVlcnkuZWFjaCgkc2NvcGUucGFyYW1ldGVycywgZnVuY3Rpb24gKGtleSwgdmFsdWUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWVzLnB1c2goeyBuYW1lOiBrZXksIHZhbHVlOiB2YWx1ZVswXSB8fCAwLCBtaW46IHZhbHVlWzFdIHx8IC0xLCBtYXg6IHZhbHVlWzJdIHx8IDEsIHN0ZXA6IHZhbHVlWzNdIHx8IDAuMDUgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICRzY29wZS52YWx1ZXMgPSB2YWx1ZXM7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAkc2NvcGUuc2V0VmFsdWVzKCk7XHJcbiAgICAgICAgICAgIH1dXHJcbiAgICAgICAgfVxyXG4gICAgfSlcclxuICAgIC5kaXJlY3RpdmUoJ3BhdGhSZW5kZXInLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgcmVzdHJpY3Q6ICdBJyxcclxuICAgICAgICAgICAgc2NvcGU6IHtcclxuICAgICAgICAgICAgICAgIHBhdGhSZW5kZXI6ICc9JyxcclxuICAgICAgICAgICAgICAgIGxpbmVTdHlsZTogJz0nLFxyXG4gICAgICAgICAgICAgICAgbGluZVdpZHRoOiAnPScsXHJcbiAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kU3R5bGU6ICc9JyxcclxuICAgICAgICAgICAgICAgIHJhbmdlOiAnPScgLy8gW21pblgsIG1heFgsIG1pblksIG1heFldXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6IFsnJHNjb3BlJywgJyRlbGVtZW50JywgZnVuY3Rpb24gKCRzY29wZSwgJGVsZW1lbnQpIHtcclxuICAgICAgICAgICAgICAgIHZhciBjID0gJGVsZW1lbnRbMF07XHJcbiAgICAgICAgICAgICAgICB2YXIgY3R4ID0gYy5nZXRDb250ZXh0KCcyZCcpO1xyXG4gICAgICAgICAgICAgICAgdmFyIHJhbmdlID0gJHNjb3BlLnJhbmdlIHx8IFstMSwgMSwgLTEsIDFdO1xyXG4gICAgICAgICAgICAgICAgdmFyIGJhY2tpbmdTdG9yZSA9IGN0eC5iYWNraW5nU3RvcmVQaXhlbFJhdGlvIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgY3R4LndlYmtpdEJhY2tpbmdTdG9yZVBpeGVsUmF0aW8gfHxcclxuICAgICAgICAgICAgICAgICAgICBjdHgubW96QmFja2luZ1N0b3JlUGl4ZWxSYXRpbyB8fFxyXG4gICAgICAgICAgICAgICAgICAgIGN0eC5tc0JhY2tpbmdTdG9yZVBpeGVsUmF0aW8gfHxcclxuICAgICAgICAgICAgICAgICAgICBjdHgub0JhY2tpbmdTdG9yZVBpeGVsUmF0aW8gfHxcclxuICAgICAgICAgICAgICAgICAgICBjdHguYmFja2luZ1N0b3JlUGl4ZWxSYXRpbyB8fCAxO1xyXG5cclxuICAgICAgICAgICAgICAgIHZhciByYXRpbyA9ICh3aW5kb3cuZGV2aWNlUGl4ZWxSYXRpbyB8fCAxKSAvIGJhY2tpbmdTdG9yZTtcclxuICAgICAgICAgICAgICAgIHZhciBzeCA9IGMud2lkdGggLyAocmFuZ2VbMV0gLSByYW5nZVswXSkvcmF0aW8sIGR4ID0gcmFuZ2VbMF07XHJcbiAgICAgICAgICAgICAgICB2YXIgc3kgPSBjLmhlaWdodCAvIChyYW5nZVszXSAtIHJhbmdlWzJdKS9yYXRpbywgZHkgPSByYW5nZVsyXTtcclxuICAgICAgICAgICAgICAgIGN0eC5saW5lV2lkdGggPSAkc2NvcGUubGluZVdpZHRoIHx8IDIuMDtcclxuXHJcbiAgICAgICAgICAgICAgICBjdHguZmlsbFN0eWxlID0gJHNjb3BlLmJhY2tncm91bmRTdHlsZSB8fCAncmdiYSgzMCwgMzAsIDE4MCwgMC4wMjUpJztcclxuICAgICAgICAgICAgICAgIGZvcih2YXIgaT0yMDsgaS0tOyApIGN0eC5maWxsUmVjdCgwLCAwLCBjLndpZHRoLCBjLmhlaWdodCk7XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIGRyYXdQYXRocyA9IGZ1bmN0aW9uIChwYXRocykge1xyXG4gICAgICAgICAgICAgICAgICAgIGN0eC5saW5lV2lkdGggPSAwLjU7XHJcbiAgICAgICAgICAgICAgICAgICAgY3R4LnN0cm9rZVN0eWxlID0gJHNjb3BlLmxpbmVTdHlsZSB8fCAncmdiYSgyNTUsMjU1LDI1NSwxLjApJztcclxuICAgICAgICAgICAgICAgICAgICBjdHguZmlsbFN0eWxlID0gJHNjb3BlLmJhY2tncm91bmRTdHlsZSB8fCAncmdiYSgzMCwgMzAsIDE4MCwgMC4wMjUpJztcclxuICAgICAgICAgICAgICAgICAgICBjdHguZmlsbFJlY3QoMCwgMCwgYy53aWR0aCwgYy5oZWlnaHQpO1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIHBhdGhJbmRleCA9IHBhdGhzLmxlbmd0aDsgcGF0aEluZGV4LS07KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBwYXRoID0gcGF0aHNbcGF0aEluZGV4XTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY3R4LmJlZ2luUGF0aCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgY3VyID0gcGF0aFtwYXRoLmxlbmd0aCAtIDFdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjdHgubW92ZVRvKChjdXJbMF0gLSBkeCkgKiBzeCwgKGN1clsxXSAtIGR5KSAqIHN5KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IHBhdGgubGVuZ3RoOyBpLS07KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgcCA9IHBhdGhbaV07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHgubGluZVRvKChwWzBdIC0gZHgpICogc3gsIChwWzFdIC0gZHkpICogc3kpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0eC5zdHJva2UoKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgJHNjb3BlLiR3YXRjaCgncGF0aFJlbmRlcicsIGZ1bmN0aW9uICh2YWwpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAodmFsICYmIHZhbC5sZW5ndGggJiYgdmFsLmxlbmd0aCA+IDApIGRyYXdQYXRocyh2YWwpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1dXHJcbiAgICAgICAgfVxyXG4gICAgfSlcclxuICAgIC5kaXJlY3RpdmUoJ2RlbnNpdHlSZW5kZXInLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgcmVzdHJpY3Q6ICdBJyxcclxuICAgICAgICAgICAgc2NvcGU6IHtcclxuICAgICAgICAgICAgICAgIGRlbnNpdHlSZW5kZXI6ICc9J1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBjb250cm9sbGVyOiBbJyRzY29wZScsICckZWxlbWVudCcsIGZ1bmN0aW9uICgkc2NvcGUsICRlbGVtZW50KSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgYyA9ICRlbGVtZW50WzBdO1xyXG4gICAgICAgICAgICAgICAgdmFyIGN0eCA9IGMuZ2V0Q29udGV4dCgnMmQnKTtcclxuICAgICAgICAgICAgICAgIHZhciBkeCA9IGMud2lkdGggLyAyO1xyXG4gICAgICAgICAgICAgICAgdmFyIGR5ID0gYy5oZWlnaHQgLyAyO1xyXG4gICAgICAgICAgICAgICAgdmFyIGNjID0ge307XHJcbiAgICAgICAgICAgICAgICB2YXIgZmwgPSBNYXRoLmZsb29yO1xyXG5cclxuICAgICAgICAgICAgICAgIHZhciBwbG90ID0gZnVuY3Rpb24gKGZ1bmN0aW9ucykge1xyXG4gICAgICAgICAgICAgICAgICAgIGN0eC5maWxsU3R5bGUgPSAncmdiYSgwLDAsMCwxLjApJztcclxuICAgICAgICAgICAgICAgICAgICBjdHguZmlsbFJlY3QoMCwgMCwgYy53aWR0aCwgYy5oZWlnaHQpO1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGZJbmRleCA9IGZ1bmN0aW9ucy5sZW5ndGg7IGZJbmRleC0tOykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgZiA9IGZ1bmN0aW9uc1tmSW5kZXhdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciB4ID0gYy53aWR0aDsgeC0tOykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgeSA9IGMuaGVpZ2h0OyB5LS07KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHZhbCA9IGZsKGYoeCAtIGR4LCB5IC0gZHkpICogMTAwKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodmFsIDwgMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHguZmlsbFN0eWxlID0gY2NbdmFsXSB8fCAoY2NbdmFsXSA9ICdoc2woMjUwLCcgKyAtdmFsICsgJyUsMzAlKScpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN0eC5maWxsU3R5bGUgPSBjY1t2YWxdIHx8IChjY1t2YWxdID0gJ2hzbCg1MCwnICsgdmFsICsgJyUsMzAlKScpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHguZmlsbFJlY3QoeCwgeSwgMSwgMSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgJHNjb3BlLiR3YXRjaCgnZGVuc2l0eVJlbmRlcicsIGZ1bmN0aW9uICh2YWwpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAodmFsICYmIHZhbC5sZW5ndGggJiYgdmFsLmxlbmd0aCA+IDApIHBsb3QodmFsKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XVxyXG4gICAgICAgIH1cclxuICAgIH0pXHJcbiAgICAuZGlyZWN0aXZlKCdncmFwaCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gZnVuY3Rpb25QYXRoQnVpbGRlcihmdW5jdGlvbiAoJHNjb3BlLCAkYXR0cnMpIHtcclxuICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgIGlmICghJHNjb3BlLmYgfHwgISRzY29wZS52YWx1ZXMpIHJldHVybjtcclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgcCA9IGpRdWVyeS5tYXAoJHNjb3BlLnZhbHVlcywgZnVuY3Rpb24gKHgpIHsgcmV0dXJuIHBhcnNlRmxvYXQoeC52YWx1ZSk7IH0pO1xyXG4gICAgICAgICAgICAgICAgdmFyIHBhcmFtcyA9IGpRdWVyeS5tYXAoJHNjb3BlLnZhbHVlcywgZnVuY3Rpb24gKHgpIHsgcmV0dXJuIHgubmFtZTsgfSk7XHJcbiAgICAgICAgICAgICAgICB2YXIgcGF0aHMgPSBbXTtcclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgZmYgPSAkc2NvcGUuZjtcclxuICAgICAgICAgICAgICAgIGlmICghalF1ZXJ5LmlzQXJyYXkoZmYpKSBmZiA9IFtmZl07XHJcblxyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBmZi5sZW5ndGg7ICsraikge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBsaXZlX2YgPSBuZXcgRnVuY3Rpb24oWyd0J10uY29uY2F0KHBhcmFtcyksICdyZXR1cm4gJyArIGZmW2pdICsgJzsnKTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgcGF0aCA9IFtdLCBwcCA9IFstMV0uY29uY2F0KHApLCBwYyA9IHt9O1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIHggPSAtMTsgeCA8IDEuMDI7IHggKz0gMC4wMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBwcFswXSA9IHg7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhdGgucHVzaChbeCwgbGl2ZV9mLmFwcGx5KHBjLCBwcCldKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgcGF0aHMucHVzaChwYXRoKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAkc2NvcGUucGF0aHMgPSBwYXRocztcclxuICAgICAgICAgICAgfSBjYXRjaCAoZXgpIHtcclxuICAgICAgICAgICAgICAgIC8vYWxlcnQoZXgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9KVxyXG4gICAgLmRpcmVjdGl2ZSgncGFyYW1ldHJpYycsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gZnVuY3Rpb25QYXRoQnVpbGRlcihmdW5jdGlvbiAoJHNjb3BlLCAkYXR0cnMpIHtcclxuICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgIGlmICghJHNjb3BlLmYgfHwgISRzY29wZS52YWx1ZXMpIHJldHVybjtcclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgcCA9IGpRdWVyeS5tYXAoJHNjb3BlLnZhbHVlcywgZnVuY3Rpb24gKHgpIHsgcmV0dXJuIHBhcnNlRmxvYXQoeC52YWx1ZSk7IH0pO1xyXG4gICAgICAgICAgICAgICAgdmFyIHBhcmFtcyA9IGpRdWVyeS5tYXAoJHNjb3BlLnZhbHVlcywgZnVuY3Rpb24gKHgpIHsgcmV0dXJuIHgubmFtZTsgfSk7XHJcbiAgICAgICAgICAgICAgICB2YXIgcGF0aHMgPSBbXTtcclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgZmYgPSAkc2NvcGUuZjtcclxuICAgICAgICAgICAgICAgIGlmICghalF1ZXJ5LmlzQXJyYXkoZmYpKSBmZiA9IFtmZl07XHJcblxyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBmZi5sZW5ndGg7ICsraikge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBsaXZlX2YgPSBuZXcgRnVuY3Rpb24oWyd0J10uY29uY2F0KHBhcmFtcyksICdyZXR1cm4gJyArIGZmW2pdICsgJzsnKTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgcGF0aCA9IFtdLCBwcCA9IFswXS5jb25jYXQocCksIHBjID0ge307XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgdCA9IC0xODA7IHQgPCAxODA7ICsrdCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBwcFswXSA9IHQgLyAxNTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHIgPSBsaXZlX2YuYXBwbHkocGMsIHBwKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcGF0aC5wdXNoKFtyWzBdLCByWzFdXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHBhdGhzLnB1c2gocGF0aCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgJHNjb3BlLnBhdGhzID0gcGF0aHM7XHJcbiAgICAgICAgICAgIH0gY2F0Y2ggKGV4KSB7XHJcbiAgICAgICAgICAgICAgICAvL2FsZXJ0KGV4KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfSlcclxuICAgIC5kaXJlY3RpdmUoJ2RlbnNpdHknLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uUGF0aEJ1aWxkZXIoZnVuY3Rpb24gKCRzY29wZSwgJGF0dHJzKSB7XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoISRzY29wZS5mIHx8ICEkc2NvcGUudmFsdWVzKSByZXR1cm47XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIHAgPSBqUXVlcnkubWFwKCRzY29wZS52YWx1ZXMsIGZ1bmN0aW9uICh4KSB7IHJldHVybiB4Lm5hbWUgKyAnPScgKyB4LnZhbHVlOyB9KTtcclxuICAgICAgICAgICAgICAgIHZhciBwYXJhbXMgPSBqUXVlcnkubWFwKCRzY29wZS52YWx1ZXMsIGZ1bmN0aW9uICh4KSB7IHJldHVybiB4Lm5hbWU7IH0pO1xyXG4gICAgICAgICAgICAgICAgdmFyIGZ1bmN0aW9ucyA9IFtdO1xyXG5cclxuICAgICAgICAgICAgICAgIHZhciBmZiA9ICRzY29wZS5mO1xyXG4gICAgICAgICAgICAgICAgaWYgKCFqUXVlcnkuaXNBcnJheShmZikpIGZmID0gW2ZmXTtcclxuXHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGZmLmxlbmd0aDsgKytqKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGJvZHkgPSAndmFyICcgKyBwICsgJztyZXR1cm4gJyArIGZmW2pdICsgJzsnO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBsaXZlX2YgPSBuZXcgRnVuY3Rpb24oWyd4JywgJ3knXS5jb25jYXQocGFyYW1zKSwgYm9keSk7XHJcbiAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb25zLnB1c2gobGl2ZV9mKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAkc2NvcGUucGF0aHMgPSBmdW5jdGlvbnM7XHJcbiAgICAgICAgICAgIH0gY2F0Y2ggKGV4KSB7XHJcbiAgICAgICAgICAgICAgICAvL2FsZXJ0KGV4KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfSlcclxuICAgIC5kaXJlY3RpdmUoJ3dpbmQnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uUGF0aEJ1aWxkZXIoZnVuY3Rpb24gKCRzY29wZSwgJGF0dHJzKSB7XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoISRzY29wZS5mIHx8ICEkc2NvcGUudmFsdWVzKSByZXR1cm47XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIG1vZGVsID0gJHNjb3BlLm1vZGVsIHx8IHt9O1xyXG4gICAgICAgICAgICAgICAgdmFyIHBhcmFtcyA9IGpRdWVyeS5tYXAoJHNjb3BlLnZhbHVlcywgZnVuY3Rpb24gKHgpIHsgcmV0dXJuIHgubmFtZTsgfSk7XHJcbiAgICAgICAgICAgICAgICB2YXIgZnVuY3Rpb25zID0gW107XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIHJhbmdlID0gJHNjb3BlLnJhbmdlIHx8IFstMSwgMSwgLTEsIDFdO1xyXG4gICAgICAgICAgICAgICAgdmFyIHN4ID0gcmFuZ2VbMV0gLSByYW5nZVswXSwgZHggPSByYW5nZVswXTtcclxuICAgICAgICAgICAgICAgIHZhciBzeSA9IHJhbmdlWzNdIC0gcmFuZ2VbMl0sIGR5ID0gcmFuZ2VbMl07XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIGZmID0gJHNjb3BlLmY7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWpRdWVyeS5pc0FycmF5KGZmKSkgZmYgPSBbZmZdO1xyXG4gICAgICAgICAgICAgICAgdmFyIHZhcnMgPSBbe25hbWU6ICd4JywgdmFsdWU6ICd2WzBdJ30sIHtuYW1lOiAneScsIHZhbHVlOiAndlsxXSd9LCB7bmFtZTogJ3onLCB2YWx1ZTogJ3ZbMl0nfV0uY29uY2F0KCRzY29wZS52YWx1ZXMpO1xyXG4gICAgICAgICAgICAgICAgdmFyIHAgPSBqUXVlcnkubWFwKHZhcnMsIGZ1bmN0aW9uICh4KSB7IHJldHVybiB4Lm5hbWUgKyAnPScgKyB4LnZhbHVlOyB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgYm9keSA9ICd2YXIgJyArIHAgKyAnOyByZXR1cm4gWycgKyBmZlswXSArICddOyc7XHJcbiAgICAgICAgICAgICAgICBtb2RlbC5saXZlX2YgPSBuZXcgRnVuY3Rpb24oWyd2J10sIGJvZHkpO1xyXG5cclxuICAgICAgICAgICAgICAgIHZhciB0cmFjZXMgPSAoJHNjb3BlLm1vZGVsICYmICRzY29wZS5tb2RlbC50cmFjZXMpIHx8IFtdO1xyXG4gICAgICAgICAgICAgICAgdmFyIHQgPSAkc2NvcGUudDtcclxuICAgICAgICAgICAgICAgIHZhciBjb3VudCA9ICRzY29wZS5jb3VudCB8fCAzMDAwO1xyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaiA9IGNvdW50OyBqLS07KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHRyYWNlMCA9IHRyYWNlc1tqXVxyXG4gICAgICAgICAgICAgICAgICAgIGlmICghdHJhY2UwIHx8IE1hdGgucmFuZG9tKCkgPCAwLjAwMykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcCA9IFtzeCAqIE1hdGgucmFuZG9tKCkgKyBkeCwgc3kgKiBNYXRoLnJhbmRvbSgpICsgZHksIHRdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgdHJhY2UgPSBtYWtlVHJhY2UobW9kZWwsIHAsIDAuMDEpLm1vdmUoMik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyYWNlc1tqXSA9IHRyYWNlO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyYWNlMC5tb3ZlKDEpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICRzY29wZS5tb2RlbCA9IG1vZGVsO1xyXG4gICAgICAgICAgICAgICAgJHNjb3BlLm1vZGVsLnRyYWNlcyA9IHRyYWNlcztcclxuICAgICAgICAgICAgICAgICRzY29wZS5wYXRocyA9IHRyYWNlcy5tYXAoZnVuY3Rpb24gKHQpIHsgcmV0dXJuIHQudHJhY2U7IH0pO1xyXG4gICAgICAgICAgICB9IGNhdGNoIChleCkge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coZXgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSwge1xyXG4gICAgICAgICAgICByYW5nZTogJz0nLFxyXG4gICAgICAgICAgICBjb3VudDogJz0nXHJcbiAgICAgICAgfSk7XHJcbiAgICB9KVxyXG4gICAgICAgIC5kaXJlY3RpdmUoJ3dpbmQyJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb25QYXRoQnVpbGRlcihmdW5jdGlvbiAoJHNjb3BlLCAkYXR0cnMpIHtcclxuLy8gICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoISRzY29wZS5mIHx8ICEkc2NvcGUudmFsdWVzKSByZXR1cm47XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHZhciBtb2RlbCA9ICRzY29wZS5tb2RlbCB8fCB7fTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgcGFyYW1zID0galF1ZXJ5Lm1hcCgkc2NvcGUudmFsdWVzLCBmdW5jdGlvbiAoeCkgeyByZXR1cm4geC5uYW1lOyB9KTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgZnVuY3Rpb25zID0gW107XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHZhciByYW5nZSA9ICRzY29wZS5yYW5nZSB8fCBbLTEsIDEsIC0xLCAxXTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgc3ggPSByYW5nZVsxXSAtIHJhbmdlWzBdLCBkeCA9IHJhbmdlWzBdO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBzeSA9IHJhbmdlWzNdIC0gcmFuZ2VbMl0sIGR5ID0gcmFuZ2VbMl07XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHZhciBmZiA9ICRzY29wZS5mO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghalF1ZXJ5LmlzQXJyYXkoZmYpKSBmZiA9IFtmZl07XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHZhcnMgPSBbe25hbWU6ICd4JywgdmFsdWU6ICd2WzBdJ30sIHtuYW1lOiAneScsIHZhbHVlOiAndlsxXSd9LCB7bmFtZTogJ3Z4JywgdmFsdWU6ICd2WzJdJ30sIHtuYW1lOiAndnknLCB2YWx1ZTogJ3ZbM10nfSwge25hbWU6ICd0JywgdmFsdWU6ICd2WzRdJ31dXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuY29uY2F0KCRzY29wZS52YWx1ZXMpO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBwID0galF1ZXJ5Lm1hcCh2YXJzLCBmdW5jdGlvbiAoeCkgeyByZXR1cm4geC5uYW1lICsgJz0nICsgeC52YWx1ZTsgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHZhciBib2R5ID0gJ3ZhciAnICsgcCArICc7IHJldHVybiBbJyArIGZmWzBdICsgJ107JztcclxuICAgICAgICAgICAgICAgICAgICBtb2RlbC5saXZlX2YgPSBuZXcgRnVuY3Rpb24oWyd2J10sIGJvZHkpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICB2YXIgdHJhY2VzID0gKCRzY29wZS5tb2RlbCAmJiAkc2NvcGUubW9kZWwudHJhY2VzKSB8fCBbXTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgdCA9ICRzY29wZS50O1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBjb3VudCA9ICRzY29wZS5jb3VudCB8fCAxMDAwO1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSBjb3VudDsgai0tOykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgdHJhY2UwID0gdHJhY2VzW2pdXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghdHJhY2UwIHx8IE1hdGgucmFuZG9tKCkgPCAwLjAxKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgcCA9IFtzeCAqIE1hdGgucmFuZG9tKCkgKyBkeCwgc3kgKiBNYXRoLnJhbmRvbSgpICsgZHksIDEsIDAsIHRdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHRyYWNlID0gbWFrZVRyYWNlKG1vZGVsLCBwLCAwLjAxKS5tb3ZlKDIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJhY2VzW2pdID0gdHJhY2U7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmFjZTAubW92ZSgxKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAkc2NvcGUubW9kZWwgPSBtb2RlbDtcclxuICAgICAgICAgICAgICAgICAgICAkc2NvcGUubW9kZWwudHJhY2VzID0gdHJhY2VzO1xyXG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5wYXRocyA9IHRyYWNlcy5tYXAoZnVuY3Rpb24gKHQpIHsgcmV0dXJuIHQudHJhY2U7IH0pO1xyXG4vLyAgICAgICAgICAgICAgICB9IGNhdGNoIChleCkge1xyXG4vLyAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coZXgpO1xyXG4vLyAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sIHtcclxuICAgICAgICAgICAgICAgIHJhbmdlOiAnPScsXHJcbiAgICAgICAgICAgICAgICBjb3VudDogJz0nXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pLmNvbnRyb2xsZXIoXCJudWxsXCIsIGZ1bmN0aW9uICgpIHsgfSk7IiwiLy9kaWZmZXJlbnRpYWwgc29sdmVycy5cclxuXHJcbkFycmF5LnByb3RvdHlwZS5zY2FsZSA9IGZ1bmN0aW9uIChzKSB7XHJcbiAgICBmb3IgKHZhciBpID0gdGhpcy5sZW5ndGg7IGktLTspIHtcclxuICAgICAgICB0aGlzW2ldID0gdGhpc1tpXSAqIHM7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpcztcclxufVxyXG5cclxuQXJyYXkucHJvdG90eXBlLmFkZCA9IGZ1bmN0aW9uICh2KSB7XHJcbiAgICBmb3IgKHZhciBpID0gdGhpcy5sZW5ndGg7IGktLTsgKSB7XHJcbiAgICAgICAgdGhpc1tpXSA9IHRoaXNbaV0gKyB2W2ldO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn1cclxuXHJcbkFycmF5LnByb3RvdHlwZS5hcyA9IGZ1bmN0aW9uKHMsIGR0KSB7XHJcbiAgICBmb3IodmFyIGkgPSB0aGlzLmxlbmd0aDsgaS0tOyApIHtcclxuICAgICAgICB0aGlzW2ldID0gdGhpc1tpXSArIGR0ICogc1tpXTtcclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzO1xyXG59XHJcblxyXG5BcnJheS5wcm90b3R5cGUuc3RlcCA9IGZ1bmN0aW9uIChmLCBkdCkge1xyXG4gICAgcmV0dXJuIHRoaXMuYXMoZih0aGlzKSwgZHQpO1xyXG59XHJcblxyXG5BcnJheS5wcm90b3R5cGUuc3RlcDIgPSBmdW5jdGlvbiAoZiwgZHQpIHtcclxuICAgIHZhciB0ZW1wID0gdGhpcy5zbGljZSgwKS5zdGVwKGYsIGR0LzIpO1xyXG4gICAgcmV0dXJuIHRoaXMuYWRkKGYodGVtcCkuc2NhbGUoZHQpKTtcclxufVxyXG5cclxuQXJyYXkucHJvdG90eXBlLnJrNCA9IGZ1bmN0aW9uIChmLCBkdCkge1xyXG4gICAgdmFyIG0xID0gZih0aGlzKTtcclxuICAgIHZhciBtMiA9IGYodGhpcy5zbGljZSgwKS5hcyhtMSwgZHQgLyAyKSk7XHJcbiAgICB2YXIgbTMgPSBmKHRoaXMuc2xpY2UoMCkuYXMobTIsIGR0IC8gMikpO1xyXG4gICAgdmFyIG00ID0gZih0aGlzLnNsaWNlKDApLmFzKG0zLCBkdCkpO1xyXG4gICAgcmV0dXJuIHRoaXMuc2xpY2UoMCkuYWRkKG0xLmFzKG0yLCAyKS5hcyhtMywgMikuYWRkKG00KS5zY2FsZShkdCAvIDYpKTtcclxufVxyXG5cclxuQXJyYXkucHJvdG90eXBlLnByZWRDb3IgPSBmdW5jdGlvbiAoZiwgZHQsIGgpIHtcclxufSIsInZhciBtYWtlVHJhY2UgPSBmdW5jdGlvbiAoZiwgcCwgZHQpIHtcclxuICAgIC8vZ2VuZXJhdGVzIGEgdHJhY2Ugb2YgYSBtdWx0aWRpbWVuc2lvbmFsIGZpcnN0IG9yZGVyIGRpZmZlcmVudGlhbCBlcXVhdGlvbiB1c2luZyB0aGUgcnVuZ2Eta3V0dGEgbWV0aG9kLlxyXG4gICAgLy9mIC0gdGhlIGRpZmZlcmVudGlhbCBlcXVhdGlvblxyXG4gICAgLy9wIC0gdGhlIGluaXRpYWwgcG9zaXRpb24gb2YgdGhlIHRyYWNlXHJcbiAgICAvL2R0IC0gdGhlIHN0ZXAgc2l6ZSBvZiB0aGUgYXBwcm94aW1hdGlvbi5cclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgdHJhY2U6IFtdLFxyXG4gICAgICAgIHA6IHAsXHJcbiAgICAgICAgZjogZixcclxuICAgICAgICBkdDogZHQsXHJcbiAgICAgICAgdDogMCxcclxuICAgICAgICAvL0FkdmFuY2UgbiBzdGVwcywgbWFpbnRhaW5pbmcgYSBjb25zdGFudCBhcnJheSBsZW5ndGguXHJcbiAgICAgICAgbW92ZTogZnVuY3Rpb24gKG4pIHtcclxuICAgICAgICAgICAgdmFyIHRyYWNlID0gbiA8IHRoaXMudHJhY2UubGVuZ3RoID8gdGhpcy50cmFjZS5zbGljZShuKSA6IFtdLFxyXG4gICAgICAgICAgICAgICAgcCA9IHRoaXMucCxcclxuICAgICAgICAgICAgICAgIGYxID0gdGhpcy5mLmxpdmVfZiB8fCB0aGlzLmY7XHJcbiAgICAgICAgICAgICAgICBmID0gZjEuYmluZCh0aGlzKSxcclxuICAgICAgICAgICAgICAgIGR0ID0gdGhpcy5kdDtcclxuICAgICAgICAgICAgdGhpcy50ICs9IHRoaXMuZHQ7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSBuOyBpLS07KSB7XHJcbiAgICAgICAgICAgICAgICB0cmFjZS5wdXNoKHApO1xyXG4gICAgICAgICAgICAgICAgcCA9IHAucms0KGYsIGR0KTtcclxuICAgICAgICAgICAgICAgIHAgPSBwLnJrNChmLCBkdCk7XHJcbiAgICAgICAgICAgICAgICBwID0gcC5yazQoZiwgZHQpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMucCA9IHA7XHJcbiAgICAgICAgICAgIHRoaXMudHJhY2UgPSB0cmFjZTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcbnZhciBtYWtlTG9yZW56ID0gZnVuY3Rpb24gKGEsIHIsIGIpIHtcclxuICAgIHJldHVybiBmdW5jdGlvbiAocCkge1xyXG4gICAgICAgIHZhciB4ID0gcFswXSwgeSA9IHBbMV0sIHogPSBwWzJdO1xyXG4gICAgICAgIHJldHVybiBbXHJcbiAgICAgICAgICAgICAgICBhICogKHkgLSB4KSxcclxuICAgICAgICAgICAgICAgIHggKiAociAtIHopIC0geSxcclxuICAgICAgICAgICAgICAgIHggKiB5IC0gYiAqIHpcclxuICAgICAgICBdO1xyXG4gICAgfVxyXG59O1xyXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=