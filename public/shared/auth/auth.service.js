'use strict';

angular.module('meanbaseApp')
  .factory('Auth', function Auth($location, $rootScope, $http, $cookieStore, $q, feathers, api) {
    var currentUser = {};
    if($cookieStore.get('token')) {
      currentUser = feathers.get('user');
    }

    return {
      /**
       * Authenticate user and save token
       *
       * @param  {Object}   user     - login info
       * @param  {Function} callback - optional
       * @return {Promise}
       */
      login: function(user, callback) {
        var cb = callback || angular.noop;
        var deferred = $q.defer();

        feathers.authenticate({
          type: 'local',
          email: user.email,
          password: user.password
        }).then(function(result){
          $rootScope.isLoggedIn = true;
          currentUser = feathers.get('user');
          $rootScope.currentUser = currentUser;
          deferred.resolve(currentUser);
          return cb();
        }).catch(function(err){
          console.error('Error authenticating!', err);
          this.logout();
          deferred.reject(err);
          return cb(err);
        }.bind(this));

        return deferred.promise;
      },

      /**
       * Delete access token and user info
       *
       * @param  {Function}
       */
      logout: function() {
        feathers.logout();
        currentUser = {};
        $rootScope.isLoggedIn = false;
      },

      /**
       * Create a new user
       *
       * @param  {Object}   user     - user info
       * @param  {Function} callback - optional
       * @return {Promise}
       */
      createUser: function(user, callback) {
        var cb = callback || angular.noop;

        var deferred = $q.defer();

        return api.users.create(user).then(function(response) {
          return feathers.authenticate({
            type: 'local',
            email: user.email,
            password: user.password
          }).then(function(response) {
            $rootScope.isLoggedIn = true;
            currentUser = feathers.get('user');
            deferred.resolve(currentUser);
            $rootScope.currentUser = currentUser;
          }).catch(function(err) {
            console.log("err authenticating", err);
            deferred.reject(err);
          });
          return cb(user);
        }, function(err)  {
          this.logout();
        });

        return deferred.promise;
      },

      /**
       * Change password
       *
       * @param  {String}   oldPassword
       * @param  {String}   newPassword
       * @param  {Function} callback    - optional
       * @return {Promise}
       */
      changePassword: function(oldPassword, newPassword, callback) {
        var cb = callback || angular.noop;

        return api.users.update({ _id: currentUser._id }, {
          oldPassword: oldPassword,
          newPassword: newPassword
        }, function(user) {
          return cb(user);
        }, function(err) {
          return cb(err);
        });
      },

      /**
       * Gets all available info on authenticated user
       *
       * @return {Object} user
       */
      getCurrentUser: function() {
        return currentUser;
      },

      /**
       * Check if a user is logged in
       *
       * @return {Boolean}
       */
      isLoggedIn: function() {
        return (currentUser && currentUser.hasOwnProperty('role'));
      },

      /**
       * Waits for currentUser to resolve before checking if user is logged in
       */
      isLoggedInAsync: async function(cb) {
        if(!cb) { cb = angular.noop; }
        try {
          await feathers.authenticate();
          currentUser = feathers.get('user');
          cb(true);
          return true
        } catch(err) {
          console.log("Error authenticating", err);
          cb(false);
          return false
        }


        // feathers.authenticate().then(function(result) {
        //   currentUser = feathers.get('user');
        //   cb(true);
        // }, function(err) {
        //   console.log("Error authenticating", err);
        //   cb(false);
        // });
      },

      // Check if the user's role has the correct permission
      hasPermission: function(permissionName, cb) {
        currentUser = feathers.get('user');
        if(!currentUser || _.isEmpty(currentUser)) {
          feathers.authenticate().then(function(result) {
            $rootScope.isLoggedIn = true;
            currentUser = feathers.get('user');
            if(!currentUser.hasOwnProperty('permissions')) { cb(false); return false; }
            // If user's role is in meanbaseGlobals.roles then check roles to see if user has permission
            // Or if user has allPrivilages
            if(currentUser.permissions.indexOf(permissionName) > -1 || currentUser.permissions.indexOf('allPrivilages') > -1) {
              cb(true);
            } else {
              cb(false);
            }
          }, function(err) {
            cb(false);
          });
        }
        else if(currentUser.hasOwnProperty('permissions')) {
          // If user's role is in meanbaseGlobals.roles then check roles to see if user has permission
          // Or if user has allPrivilages
          if(currentUser.permissions.indexOf(permissionName) > -1 || currentUser.permissions.indexOf('allPrivilages') > -1) {
            cb(true);
          } else {
            cb(false);
          }
        } else {
          cb(false);
        }
      },

      /**
       * Check if a user is an admin
       *
       * @return {Boolean}
       */
      isAdmin: function() {
        return currentUser.role === 'admin';
      },

      /**
       * Get auth token
       */
      getToken: function() {
        return feathers.get('token')
      }
    };
  });
