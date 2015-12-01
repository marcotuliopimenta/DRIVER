(function() {
    'use strict';

    /**
     * @ngInject
     */
    function AuthService($q, $http, $cookies, $rootScope, $timeout, $window, ASEConfig, UserService) {
        var module = {};

        var userIdCookieString = 'AuthService.userId';
        var tokenCookieString = 'AuthService.token';
        var cookieTimeout = null;
        var cookieTimeoutMillis = 24 * 60 * 60 * 1000;      // 24 hours

        var events = {
            loggedIn: 'ASE:Auth:LoggedIn',
            loggedOut: 'ASE:Auth:LoggedOut'
        };

        module.events = events;

        module.isAuthenticated =  function () {
            return !!(module.getToken() && module.getUserId() >= 0);
        };

        module.authenticate = function(auth, needsAdmin) {
            var dfd = $q.defer();
            $http.post(ASEConfig.api.hostname + '/api-token-auth/', auth)
            .success(function(data, status) {
                var result = {
                    status: status,
                    error: ''
                };

                // if user needs to be an admin to log in, check if they are first
                if (needsAdmin) {
                    if (data && data.user && data.token) {
                        UserService.isAdmin(data.user, data.token).then(function(isAdmin) {
                            if (isAdmin) {
                                // am an admin; log in
                                setUserId(data.user);
                                setToken(data.token);
                                result.isAuthenticated = module.isAuthenticated();
                                if (result.isAuthenticated) {
                                    $rootScope.$broadcast(events.loggedIn);
                                } else {
                                    result.error = 'Unknown error logging in.';
                                }
                            } else {
                                // user is not an admin and admin access is required
                                result.isAuthenticated = false;
                                result.error = 'Must be an administrator to access this portion of the site.';
                            }
                            dfd.resolve(result);
                        }, function(error) {
                            result.isAuthenticated = false;
                            result.error = 'Unknown error logging in.';
                            dfd.resolve(result);
                        });
                    } else {
                        result.isAuthenticated = false;
                        result.error = 'Error obtaining user information.';
                        dfd.resolve(result);
                    }
                } else {
                    // admin access not required; log in
                    setUserId(data.user);
                    setToken(data.token);
                    result.isAuthenticated = module.isAuthenticated();
                    if (result.isAuthenticated) {
                        $rootScope.$broadcast(events.loggedIn);
                    } else {
                        result.error = 'Unknown error logging in.';
                    }
                    dfd.resolve(result);
                }
            })
            .error(function(data, status) {
                var error = _.values(data).join(' ');
                if (data.username) {
                    error = 'Username field required.';
                }
                if (data.password) {
                    error = 'Password field required.';
                }
                var result = {
                    isAuthenticated: false,
                    status: status,
                    error: error
                };
                dfd.resolve(result);
            });

            return dfd.promise;
        };

        module.getToken = function() {
            return $cookies.getObject(tokenCookieString);
        };

        module.getUserId = function() {
            var userId = parseInt($cookies.getObject(userIdCookieString), 10);
            return isNaN(userId) ? -1 : userId;
        };

        module.logout =  function() {
            setUserId(null);
            $cookies.remove(tokenCookieString);
            $rootScope.$broadcast(events.loggedOut);
            if (cookieTimeout) {
                $timeout.cancel(cookieTimeout);
                cookieTimeout = null;
            }
            // trigger full page refresh
            $window.location.reload();

            // TODO: hit logout openid endpoint after clearing cookies to log out of OpenID too,
            // instead of simply refreshing page.
            // Does GLUU support end_session_endpoint? Google seemingly has none defined.
            //$window.location.href = ASEConfig.api.hostname + '/openid/logout?next=/';
        };

        return module;

        function setToken(token) {
            if (!token) {
                return;
            }

            // clear timeout if we re-authenticate for whatever reason
            if (cookieTimeout) {
                $timeout.cancel(cookieTimeout);
                cookieTimeout = null;
            }

            $cookies.putObject(tokenCookieString, token);

            cookieTimeout = $timeout(function() {
                module.logout();
            }, cookieTimeoutMillis);
        }

        function setUserId(id) {
            var userId = parseInt(id, 10);
            userId = !isNaN(userId) && userId >= 0 ? userId : -1;
            $cookies.putObject(userIdCookieString, userId);
        }
    }

    angular.module('ase.auth').factory('AuthService', AuthService);

})();
