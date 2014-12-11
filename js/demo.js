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
            template: '<div class="btn-group">\
                            <button class="btn" ng-click="running = true" class="glyphicon glyphicon-play-circle"><span class="glyphicon glyphicon-play"></span></button>\
                            <button class="btn" ng-click="running = false"><span class="glyphicon glyphicon-stop"></button>\
                            <button class="btn" ng-click="download()"><span class="glyphicon glyphicon-picture"></button>\
                            <button class="btn" ng-click="fullScreen()"><span class="glyphicon glyphicon-fullscreen"></button>\
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