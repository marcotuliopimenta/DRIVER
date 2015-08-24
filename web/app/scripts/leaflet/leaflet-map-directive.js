(function () {
    'use strict';

    /** Provides access to the leaflet map object instantiated by the directive */
    /* ngInject */
    function LeafletController($q) {
        var ctl = this;
        var _map = null;
        initialize();

        function initialize() {
            _map = $q.defer();

            ctl.getMap = getMap;
            ctl.setMap = setMap;
        }

        /**
         * Get a promise reference to the map object created by the directive
         * @return {Promise} Resolves with an L.map object
         */
        function getMap() {
            return _map.promise;
        }

        /** Sets the map object for this controller. Call only once, on directive creation
         * @param {L.map} map The L.map object to use on this controller.
         */
        function setMap(map) {
            _map.resolve(map);
        }
    }

    /* ngInject */
    function LeafletMap(LeafletDefaults) {
        var module = {
            restrict: 'A',
            scope: {},
            controller: 'LeafletController',
            controllerAs: 'lf',
            bindToController: true,
            link: link
        };
        return module;

        function link(scope, element, attrs, controller) {
            var defaults = LeafletDefaults.get();
            var map = new L.map(element[0], defaults);
            controller.setMap(map);
        }
    }

    angular.module('Leaflet')
        .controller('LeafletController', LeafletController)
        .directive('leafletMap', LeafletMap);
})();