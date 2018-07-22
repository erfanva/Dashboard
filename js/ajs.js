// var app = angular.module('myApp', []);
var app = angular.module("myApp", ["ngRoute", "ngTouch", "angucomplete", "ui.bootstrap.contextMenu"]);
app.config(function($routeProvider) {
    $routeProvider
    .when("/", {
        template : ['<!--usersTableCard-->',
                    '<div class="col-lg-8">',
                        '<ng-users-table-card' ,
                            'users = "users"',
                            'max-users-in-page = "5">',
                        '</ng-users-table-card>',
                    '</div>',
                    '<!--formCard-->',
                    '<div class="col-lg-4" ngShow="addOrEdit">',
                        '<ng-form-card' ,
                            'fields = "users[0]">',
                        '</ng-form-card>',
                    '</div>'].join(' ')
    })
    .when("/edit", {
        template : ['<!--formCard-->',
                    '<div class="col-lg-4" ngShow="addOrEdit">',
                        '<ng-form-card' ,
                            'fields = "users[0]">',
                        '</ng-form-card>',
                    '</div>'].join(' ')
    })
    .when("/green", {
        templateUrl : "green.htm"
    })
    .when("/blue", {
        templateUrl : "blue.htm"
    });
});
app.factory('appService', function ($http, $q, $log){

    function getUsers() {
        var json1 = $http.get('json/json1.json');
        var json2 = $http.get('json/json2.json');
        var users;
        $q.all([json1, json2]).then(function(jsons) {
            var mergedJson = mergeJson("uid", jsons[0].data, jsons[1].data);
            users = mergedJson;
        });
        return users;
    }

    function removeRow(index) {
        users.splice(index, 1);
        this.deselect();
        $log.log(users.length);
        $.notify({
            // options
            icon: 'fa fa-user-times',
            title: '<strong>Success!</strong>',
            message: 'a row has been removed.' 
        },{
            // settings
            type: 'success'
        });
    }
    function saveRow(item, index) {
        users[index] = angular.copy(item);
        this.deselect();
        $.notify({
            // options
            icon: 'fa fa-user-edit',
            title: '<strong>Success!</strong>',
            message: 'a row has been edited.' 
        },{
            // settings
            type: 'success'
        });
    }
    function addRow(item) {
        users.push(angular.copy(item));
        this.deselect();
        $.notify({
            // options
            icon: 'fa fa-user-plus',
            title: '<strong>Success!</strong>',
            message: 'a row has been added.' 
        },{
            // settings
            type: 'success'
        });
    }
    return {           
        // editRow: editRow,
        removeRow: removeRow,
        saveRow: saveRow,
        addRow: addRow,
        getUsers: getUsers
    };
});


app.controller('myCtrl', function ($scope, appService) {
    $scope.users = appService.getUsers();
});

app.directive('ngUsersTableCard', function ($log, appService) {
    return {
        restrict: 'E',
        scope: {
            users: "=",
            maxUsersInPage: "@?",
            maxPageButtons: "@?"
        },
        templateUrl: 'ngUsersTableCard.htm',
        link: function(scope, element, attrs) {

            scope.sortBy = '';
            scope.tablePage = 0;
            scope.filterKey = '*';

            appService.deselect = function() { 
                $log.log('table(deselect):');
                scope.editingIndex = -1;
                appService.updateUsers();
            };

            appService.updateUsers = function() { 
                $log.log('table(update)');
                scope.users = appService.users;
                scope.tableMaxPage = Math.round(scope.users.length/scope.maxUsersInPage);
                $log.log(scope.users);
            };
            
            // scope.$watchCollection(appService.users, function(val) {
            //     if(val) {
            //         scope.users = appService.users;
            //         $log.log(scope.users);
            //         scope.tableMaxPage = Math.round(scope.users.length/scope.maxUsersInPage);
            //     }   
            // });  

            scope.orderByMe = function(x) {
                if(x === scope.sortBy)
                    scope.reverse = !scope.reverse;
                scope.sortBy = x;
                $log.log("Order by:" + scope.sortBy);
            }
            scope.changeTablePage = function(x) {
                if(0 <= x && x <= scope.tableMaxPage) {
                    scope.tablePage = x;
                }
            }
            scope.editThisRow = function (item) {
                if(scope.editingIndex == scope.users.indexOf(item))
                    scope.editingIndex = -1;
                else
                    scope.editingIndex = scope.users.indexOf(item);
                appService.editRow(scope.editingIndex, item);
                $log.log('table(editThisRow): ' + scope.editingIndex);
            }
            scope.range = function(count){
                var ratings = [];
                for (var i = 0; i < count; i++) { 
                    ratings.push(i) 
                } 
                return ratings;
            }
            scope.getFilter = function() {
                if(scope.filterKey === '*')
                    return scope.filterVal;
                var result = {};
                result[scope.filterKey] = scope.filterVal;
                return result;
            }

            scope.rowContextMenu = 
                [
                    ['Edit', function ($itemScope, event, modelValue, text, $li) {
                        scope.editingIndex = modelValue;
                        appService.editRow(scope.editingIndex);
                    }],
                    ['Remove', function ($itemScope, event, modelValue, text, $li) {
                        scope.editingIndex = modelValue;
                        appService.editRow(scope.editingIndex);
                        $("#areYouSureModal").modal("show");
                    }]
                ];
        }
    };
});

app.directive('ngFormCard', function ($log, appService) {
    return {
        restrict: 'E',
        scope: {
            fields:"="
        },
        templateUrl: 'ngFormCard.htm',
        link : function(scope, element, attrs){
            scope.editingIndex = -1

            appService.editRow = function(index, item) {      
                $log.log('form(editRow): ' + index) 
                scope.editingIndex = index
                if(index < 0) 
                    scope.aeform = {};
                else
                    scope.aeform = angular.copy(item)
            };

            scope.removeRow = function () {
                appService.removeRow(scope.editingIndex);
                scope.aeform = {};
                // clearForm(scope.form);
            }
            scope.saveRow = function () {
                appService.saveRow(scope.aeform, scope.editingIndex);
            };
            scope.addRow = function () {
                appService.addRow(scope.aeform);
                scope.aeform = {};
            };    
            scope.clearForm = function () {
                $log.log(scope.aeform)
                scope.aeform = {};  
            }
        }
    };
});


// ------------------------------------------------------- //
// Merge jsons function ( sameKey: what key is same in jsons )
// Example: mergeJson('id', json1, json2, ...);
// ------------------------------------------------------- //

function mergeJson(sameKey, target) {
    for (var argi = 2; argi < arguments.length; argi++) {
        var source = arguments[argi];

        for (var i in source) {
            for (var j in target) {
                if (target[j][sameKey] === source[i][sameKey]) {
                    for (var key in source[i]) {
                        target[j][key] = source[i][key];
                    }
                }
            }
        }
    }
    return target;
}