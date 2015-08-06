(function () {
    'use strict';

    /* ngInject */
    function StateConfig($stateProvider) {
        $stateProvider.state('map', {
            url: '/:rtuuid/map',
            template: '<driver-map></driver-map>',
            label: 'Map',
            showInNavbar: true
        });
    }

    angular.module('driver.views.map', [
        'ui.router',
        'ui.bootstrap'
    ]).config(StateConfig);

})();
