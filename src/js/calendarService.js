'use strict'
angular.module('endo')
  .factory('Calendar', function CalendarFactory($http) {
    return {
      authenticate: function(callback) {
        var clientID = "723413737382-r7prh8e4qcqng9j0bkqi9lagm14q3h13.apps.googleusercontent.com"
        var authURL = "https://accounts.google.com/o/oauth2/auth"
        authURL += "?client_id=" + clientID
        authURL += "&response_type=token"
        authURL += "&redirect_uri=" + chrome.identity.getRedirectURL()
        authURL += "&scope=https://www.googleapis.com/auth/calendar"
        chrome.identity.launchWebAuthFlow({
          url: authURL,
          interactive: true
        }, function(responseURL) {
          callback(responseURL.match(/\#(?:access_token)\=([\S\s]*?)\&/)[1])
        })
      },
      listCalendars: function(token) {
        return $http.get('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
          headers: {
            'Authorization': 'OAuth ' + token,
            'Content-Type': 'application/json'
          }
        })
      },
      listEvents: function(token, id, startTime, endTime) {
        return $http.get('https://www.googleapis.com/calendar/v3/calendars/' + encodeURIComponent(id) + '/events', {
          params: {
            'timeMin': startTime,
            'timeMax': endTime,
            'singleEvents': true,
            'orderBy': 'startTime',
            'maxAtendees': 0
          },
          headers: {
            'Authorization': 'OAuth ' + token,
            'Content-Type': 'application/json'
          }
        })
      },
      addEvent: function(token, calendarId, text) {
        if (!calendarId) {
          calendarId = 'primary'
        }
        var url = 'https://www.googleapis.com/calendar/v3/calendars/' + encodeURIComponent(calendarId) + '/events/quickAdd?text=' + text.split(' ').join('+')
        return $http({
          method: 'POST',
          url: url,
          headers: {
            'Content-Type': 'application/json; charset=UTF-8',
            'Authorization': 'Bearer ' + token
          }
        })
      },
      deleteEvent: function(token, calendarId, eventId) {
        var url = 'https://www.googleapis.com/calendar/v3/calendars/' + encodeURIComponent(calendarId) + '/events/' + encodeURIComponent(eventId)
        return $http({
          method: 'DELETE',
          url: url,
          headers: {
            'Content-Type': 'application/json; charset=UTF-8',
            'Authorization': 'Bearer ' + token
          }
        })
      }
    }
  })