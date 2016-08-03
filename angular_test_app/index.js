angular.module('Application', [])
    .directive('myDirective', function () {
        return {
            scope: {
                str: "="
            },
            template: "<div>This is some directive<br><span ng-click='derp()'>Click meh<span></div><br/><p>{{MyService.value}}</p>",
            controller: function ($scope, MyService, SomeDataSource) {
                $scope.MyService = MyService;
                $scope.derp = function () {
                    MyService.something(SomeDataSource.str);
                };

                console.log($scope.str);
            }
        }
    })

    .service('MyService', function () {
        this.value = 'im a real service';
        this.something = function (str) {
            alert('this is an alert [' + str + ']');
        };
    })
    .service('SomeDataSource', function() {
        this.str = 'real thing';
    });

