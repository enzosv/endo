'use strict'
angular.module('endo')
  .directive('calendar', function () {
    return {
      templateUrl: '../html/calendar.html',
      controller: function ($scope, Calendar, DateService) {
        $scope.calendars = []
        $scope.events = []
        var calendarCount = 0
        var calendarsLoaded = 0
        var tempEvents = []
        var tempCalendars = []
        var oAuthToken

        $scope.$on('sync', function () {
          console.log('CALENDAR: RECEIVED SYNC REQUEST')
          refreshCalendar()
        })

        $scope.$on('reset', function () {
          console.log('CALENDAR: RECEIVED RESET REQUEST')
          reset()
        })

        $scope.$on('login', function () {
          console.log('CALENDAR: RECEIVED LOGIN REQUEST')
          refreshCalendar()
        })

        $scope.$on('addEvent', function () {
          console.log('CALENDAR: RECEIVED ADD REQUEST')

          var calendarName = $scope.search.split('#')
          var query
          if (calendarName.length > 1) {
            calendarName = calendarName[1].split(' ')[0]
            query = $scope.search.replace('#' + calendarName, '')
            Calendar.addEvent(oAuthToken, getCalendarIdWithName(calendarName), query)
              .then(function (response) {
                refreshCalendar()
              }, function (error) {
                console.error(error)
              })
          } else {
            Calendar.addEvent(oAuthToken, getCalendarIdWithName(calendarName[0]), $scope.search)
              .then(function (response) {
                refreshCalendar()
              }, function (error) {
                console.error(error)
              })
          }
          $scope.search = ''
        })

        function reset () {
          $scope.calendars = []
          $scope.events = []
          calendarCount = 0
          calendarsLoaded = 0
          tempEvents = []
          tempCalendars = []
          oAuthToken = ''
        }

        chrome.storage.local.get(['calendars', 'calLastSync'], function (local) {
          if (local) {
            if (local.calendars) {
              if (local.calendars.length === 0) {
                refreshCalendar()
              } else {
                $scope.calendars = local.calendars
                for (var i = 0; i < local.calendars.length; i++) {
                  processEvents(local.calendars[i].items, local.calendars[i].color, local.calendars[i].summary, local.calendars[i].visible, local.calendars[i].id)
                  $scope.events = $scope.events.concat(local.calendars[i].items)
                }
                $scope.$apply()
                if (local.calLastSync) {
                  if (local.calLastSync < new Date()
                    .getTime() - 300000) {
                    refreshCalendar()
                  } else {
                    chrome.identity.getAuthToken({
                      'interactive': true
                    }, function (token) {
                      oAuthToken = token
                    })
                  }
                } else {
                  refreshCalendar()
                }
              }
            } else {
              refreshCalendar()
            }
          }
        })

        function refreshCalendar () {
          console.log('CALENDAR: REFRESHING')
          chrome.identity.getAuthToken({
            'interactive': true
          }, function (token) {
            oAuthToken = token
            Calendar.listCalendars(token)
              .then(function (response) {
                var calendars = response.data.items

                var startTime = (function () {
                  var date = new Date()
                  date.setHours(0)
                  date.setMinutes(0)
                  date.setSeconds(0)
                  return DateService.rfc3339FromDate(date)
                })()
                var endTime = (function () {
                  var date = new Date()
                  date.setDate(date.getDate() + 14)
                  date.setHours(23)
                  date.setMinutes(59)
                  date.setSeconds(59)
                  return DateService.rfc3339FromDate(date)
                })()
                calendarCount = calendars.length
                calendarsLoaded = 0
                tempEvents = []
                tempCalendars = []
                for (var i = 0; i < calendars.length; i++) {
                  getEventsForId(calendars[i].id, calendars[i].backgroundColor, startTime, endTime)
                }
              }, function (error) {
                console.error(error)
              })
          })
        }

        function getEventsForId (id, color, startTime, endTime) {
          Calendar.listEvents(oAuthToken, id, startTime, endTime)
            .then(function (response) {
              var count = response.data.items.length
              console.log('CALENDAR: GOT ' + count + ' EVENTS FOR ' + id)
              if (count > 0) {
                response.data.color = color
                var matchedOld = false
                for (var i = 0; i < $scope.calendars.length; i++) {
                  if ($scope.calendars[i].id === id) {
                    response.data.visible = $scope.calendars[i].visible
                    matchedOld = true
                    break
                  }
                }
                if (!matchedOld) {
                  response.data.visible = true
                }
                response.data.id = id
                processEvents(response.data.items, color, response.data.summary, response.data.visible, id)
                tempCalendars.push(response.data)
                tempEvents = tempEvents.concat(response.data.items)
              }
              saveCalendars()
            }, function (error) {
              saveCalendars()
              console.error(error)
            })
        }

        function processEvents (items, color, summary, visible, calendarId) {
          for (var i = 0; i < items.length; i++) {
            var item = items[i]
            item.color = color
            var epochTime
            if (item.start.date) {
              epochTime = Date.parse(item.start.date)
              item.epochTime = epochTime
              item.parsedStart = DateService.parse(epochTime, true)
            } else {
              epochTime = Date.parse(item.start.dateTime)
              item.epochTime = epochTime
              item.parsedStart = DateService.parse(epochTime, true, true)
            }
            item.visible = visible
            item.fullParsedDate = DateService.getFullDate(epochTime)
            item.calendarId = calendarId
            item.searchKey = (item.parsedStart + ' ' + item.fullParsedDate + ' ' + item.summary + ' ' + summary)
              .toLowerCase()
          }
        }

        $scope.saveVisibility = function (calendar) {
          for (var i = 0; i < calendar.items.length; i++) {
            calendar.items[i].visible = calendar.visible
          }
          chrome.storage.local.set({
            'calendars': $scope.calendars
          })
        }

        $scope.remove = function (event) {
          console.log('CALENDAR: REMOVING EVENT: ' + event)
          var index = $scope.events.indexOf(event)
          if (index > -1) {
            $scope.events.splice(index, 1)
            Calendar.deleteEvent(oAuthToken, event.calendarId, event.id)
          }
        }

        function saveCalendars () {
          calendarsLoaded++
          if (calendarsLoaded === calendarCount) {
            // if ($scope.events !== tempEvents) {
            $scope.calendars = tempCalendars.slice()
            $scope.events = tempEvents.slice()
            chrome.storage.local.set({
              'calendars': $scope.calendars,
              'calLastSync': new Date()
                .getTime()
            })
            // }
          }
        }

        function getCalendarIdWithName (name) {
          name = name.toLowerCase()
          if (name.indexOf('-') > -1) {
            name = name.split('-').join(' ')
          }
          for (var i = 0; i < $scope.calendars.length; i++) {
            if ($scope.calendars[i].summary.toLowerCase() === name) {
              return $scope.calendars[i].id
            }
          }
        }
      }

    }
  })
