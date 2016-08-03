var HarnessClient = (function (Harness) {
    var gui = null;
    var currentHarnessName = localStorage.getItem('currentHarnessName');

    if (!currentHarnessName || currentHarnessName === "null") {
        currentHarnessName = 'Production';
    }

    function createGuiStyles() {
        var styleTag = document.createElement('style');
        styleTag.setAttribute('id', 'dat-gui-style-override');
        styleTag.setAttribute('media', 'screen');
        var styleFnString = function () {/*
         .dg .c input[type=text] {
         margin-top: 0;
         font-size: 12px;
         padding: 0;
         }
         .dg select {
         padding: initial;
         font-size: initial;
         width: initial;
         box-shadow: initial;
         border: initial;
         height: initial;
         font-size: initial;
         }
         */
        }.toString();
        var bodyStart = styleFnString.indexOf('/') + 1;
        var bodyEnd = styleFnString.lastIndexOf('/');
        styleTag.innerHTML = styleFnString.substring(bodyStart, bodyEnd);
        document.head.appendChild(styleTag);
    }

    var guiFields = {
        Harness: currentHarnessName
    };

    var initGUI = function () {
        gui = new dat.GUI({width: 400});
        var harnessNames = Harness.getHarnessNames();
        gui.add(guiFields, 'HarnessInstance', harnessNames).onChange(function (selectedHarness) {
            localStorage.setItem('currentHarnessName', selectedHarness);
            location.reload(true);
        });
    };

    //todo figure out where sockets n stuff fit in this, probably an additional file that is user defined
    document.addEventListener('DOMContentLoaded', function () {
        window.AngularAsyncModules.unravelComplete = function() {
            Harness.load(currentHarnessName);
            //harness will never set to an invalid harness name
            //if name does not exist it will set itself to 'Production'
            var harness = Harness.getCurrentHarness();
            currentHarnessName = harness.name;
            guiFields.Harness = currentHarnessName;
            localStorage.setItem('currentHarnessName', currentHarnessName);

            createGuiStyles();
            if (harness.name !== 'Production') { //don't replace body in production
                var body = document.body;
                body.setAttribute('ng-app', harness.moduleName);
                angular.module(harness.moduleName).directive('entryPoint', function () {
                    return {
                        template: harness.template,
                        templateUrl: harness.templateUrl,
                        controller: harness.context
                    };
                });
                body.innerHTML = '<entry-point></entry-point>';
            }
            //init gui down here in case we nuked the body html from orbit
            initGUI();
        };
    });
})(HarnessInstance);