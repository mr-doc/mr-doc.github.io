"use strict";
angular.module("npm-theme-browser", ["infinite-scroll"]), angular.module("npm-theme-browser").controller("ThemeListCtrl", function($scope, $http, $location, $q) {
    var fields = ["name", "keywords", "rating", "description", "author", "modified", "homepage", "version"],
        initialFetchSize = 20,
        formatResult = function(data) {
            return fields.forEach(function(k) {
                return "keywords" !== k && Array.isArray(data[k]) && (data[k] = data[k][0]);
            }), data;
        },
        formatData = function(data) {
            var out = {
                results: data.results.map(formatResult),
                total: data.total
            };
            return out;
        },
        makeRequest = function(start, size) {
            return $http.get("http://npmsearch.com/query", {
                params: {
                    q: ["keywords:mr-doc-theme"],
                    fields: fields.join(","),
                    start: start,
                    size: size,
                    sort: "rating:desc"
                },
                transformResponse: $http.defaults.transformResponse.concat([formatData])
            });
        },
        sortBy = function() {
            var args = arguments;
            return function(a, b) {
                for (var scoreA, scoreB, i = 0, len = args.length; len > i; i++) {
                    if (scoreA = args[i](a), scoreB = args[i](b), scoreB > scoreA) return -1;
                    if (scoreA > scoreB) return 1;
                }
                return 0;
            };
        },
        sortResults = function(results) {
            return results.sort(sortBy(function(plugin) {
                return $scope.blackList[plugin.name] ? 1 : 0;
            }, function(plugin) {
                return -plugin.rating;
            }, function(plugin) {
                return plugin.name;
            }));
        };
    $q.all([$http.get("blacklist.json"), makeRequest(0, initialFetchSize)]).then(function(responses) {
        return $scope.blackList = responses[0].data, $scope.data = sortResults(responses[1].data.results), makeRequest(initialFetchSize, responses[1].data.total);
    }).then(function(response) {
        $scope.data = sortResults($scope.data.concat(response.data.results)), angular.isString($location.search().q) && ($scope.search = $location.search().q);
    }), $scope.orderByDocKeywords = function(item) {
        return "mr-doc-theme" === item ? -1 : 0;
    }, $scope.notBlacklisted = function(item) {
        return item && !$scope.blackList[item.name];
    };
});