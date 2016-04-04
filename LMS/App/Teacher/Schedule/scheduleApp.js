﻿(function () {
    var app = angular.module('schedule', ['base']);

    app.config(function ($routeProvider, $locationProvider) {
        $routeProvider
            .when('/', {
                templateUrl: LMS.rootPath + 'App/Teacher/Schedule/Views/scheduleIndexView.html',
                controller: 'indexCtrl'
            })
            .otherwise({
                redirectTo: '/'
            });

        //$locationProvider.html5Mode({
        //    enabled: true,
        //    requireBase: false
        //});
    });

    var monthNames = [
        'Januari',
        'Februari',
        'Mars',
        'April',
        'Maj',
        'Juni',
        'Juli',
        'Augusti',
        'September',
        'Oktober',
        'November',
        'December'
    ];

    function parseMSDate(s) {
        if (!s) return null;
        return new Date(parseInt(s.substr(6)));
    };

    app.directive('schedule', function ($parse, $animate) {
        return {
            restrict: 'A',
            scope: {
                month: '=schedule',
                first: '=',
                limit: '=',
                click: '&',
                refresh: '&'
            },
            link: function (scope, el, attr) {
                function inMonth(d) { return d > 0 && d <= scope.limit };
                function calcDay(i) { return i - scope.first + 1 };

                function generate(m) {
                    for (var y = 0; y < 6; ++y) {
                        var tr = angular.element('<tr></tr>');
                        var w = y * 7;
                        for (var x = 0; x < 7; ++x) {
                            var day = calcDay(w + x);
                            var text = inMonth(day) ? day : '-';
                            var td = angular.element('<td class="col-md-1">' + text + '</td>');

                            var onClick = function (d) {
                                var fn = scope.click();
                                return function () {
                                    fn(d);
                                };
                            };

                            td.on('click', onClick(day));
                            tr.append(td);
                        }
                        el.append(tr);
                    }
                    $animate.addClass(el, 'added');
                    scope.$parent.tbody = el;
                    scope.refresh()(el);
                }

                scope.$watch('month', function (val) {
                    el.removeClass('added');
                    el.empty();
                    generate(val);
                });
            }
        };
    });

    app.controller('indexCtrl', ['$scope', '$http', function ($scope, $http) {
        function init() {
            $scope.json = [];
            $scope.usedDays = [];
            $scope.curMonth = new Date().getMonth();
            genCal($scope.curMonth);
            getData();
        };

        function genCal(month) {
            var now = new Date(2016, month, 1);
            var firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
            $scope.numDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
            $scope.firstDay = firstDay.getDay();
            $scope.monthName = monthNames[now.getMonth()];
        };

        function refresh(tbody) {
            var json = $scope.json;
            var trs = tbody.children();
            for (var j = 0; j < json.length; ++j) {
                var o = json[j];
                //var odate = parseMSDate(o.date_end);
                //o.date_end = parseMSDate(o.date_end);
                //o.date_start = parseMSDate(o.date_start);
                if (o.date_end.getMonth() == $scope.curMonth) {
                    var day = o.date_end.getDate();
                    var idx = day + $scope.firstDay - 1;
                    var y = Math.floor(idx / 7);
                    var x = idx % 7;
                    var tr = trs[y];
                    var td = angular.element(tr.children[x]);
                    $scope.usedDays[day] = o;
                    td.addClass('sched_' + o.type_id);
                }
            }
            console.log('refresh() called');
        };

        $scope.refresh = refresh;

        function getData() {
            $http.get(LMS.rootPath + 'Data/Schedule').then(function (resp) {
                var json = resp.data;
                for (var i = 0; i < json.length; ++i) {
                    var o = json[i];
                    o.date_start = parseMSDate(o.date_start);
                    o.date_end = parseMSDate(o.date_end);
                }
                $scope.json = json;
                refresh($scope.tbody);
            });
        };

        $scope.addMonth = function (delta) {
            $scope.curMonth += delta;
            genCal($scope.curMonth);
        };

        $scope.foo = function (s) {
            //alert('hello from foo(): ' + s);
            $scope.clickedDay = null;
            $scope.clickedDay = $scope.usedDays[s];
            $scope.$apply();
        };

        init();
    }]);
}());