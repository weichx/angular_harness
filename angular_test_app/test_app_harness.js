Harness('myDirectiveHarness', function (harness) {
    harness.setTemplate('<my-directive str="str"></my-directive><h1>working</h1>');
    harness.addToGroup('TestGroup1');

    harness.setDefaultMocks({
        MyService: "Full"
    });

    harness.setContext(function($scope) {
        $scope.str = "str";
    });

    harness.addVariant('variant1', function (variant) {
        variant.setDefaultMocks({
            MyService: "Medium"
        });
        variant.setTemplate('<my-directive str="str"></my-directive><h1>variant1</h1>');

    });

    harness.addVariant('variant2', function (variant) {
        variant.setContext(function($scope){
            $scope.str = "HELLO variant2";
        });
    });
});

Harness('myDirectiveHarness2', function(harness) {
    harness.setTemplate('<my-directive str="str"></my-directive><h1>working harness 2</h1>');
    harness.setContext(function($scope) {
       $scope.str = "HARNESS NUMBER TWO"
    });

    harness.addVariant('variant1', function(variant) {
        harness.setTemplate('<my-directive str="str"></my-directive><h1>working harness 2, variant 1</h1>');
        variant.setContext(function($scope) {
            $scope.str = "VARIANT 1, harness 2";
        });
    });
});

Mock("MyService", function (mockSet) {

    mockSet.add('Empty', function () {
        this.value = 'Empty MyService';
        this.something = function (x) {
            alert('empty mock [' + x + ']');
        };
    });

    mockSet.add('Medium', function () {
        this.value = 'Medium MyService';

        this.something = function (x) {
            alert('medium mock [' + x + ']');
        };
    });

    mockSet.add('Full', function () {
        this.value = 'Full MyService';

        this.something = function (x) {
            alert('full mock [' + x + ']');
        };
    });
});

Mock('SomeDataSource', function (mockSet) {
    mockSet.add('mock1', function () {
        this.str = 'mock1';
    });

    mockSet.add('mock2', function () {
        this.str = 'mock2'
    });
});