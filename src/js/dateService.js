'use strict'
angular.module('endo').factory('DateService', function DateFactory ($filter) {
  var now = new Date().getTime()
  var isTimeless = function (date) {
    date = new Date(date)
    if (
      (date.getHours() === 0 && date.getMinutes() === 0) ||
      (date.getHours() === 23 && date.getMinutes() === 59)
    ) {
      return true
    }

    return false
  }
  return {
    rfc3339FromDate: function (date) {
      // 2011-06-03T10:00:00-07:00, 2011-06-03T10:00:00Z
      var month = (date.getMonth() + 1).toString() // getMonth() is zero-based
      var day = date.getDate().toString()
      var hour = date.getHours().toString()
      var minute = date.getMinutes().toString()
      var second = date.getSeconds().toString()
      var timezoneOffsetInHours = (function () {
        var hoursOffset = date.getTimezoneOffset() / 60
        var sign = Math.sign(hoursOffset) === -1 ? '-' : ''
        return sign + new Array(hoursOffset.size)
          .concat([Math.abs(hoursOffset)])
          .join('0').slice(-hoursOffset.size) + ':00'
      })()
      return [date.getFullYear(),
        '-',
        month.padStart(2, '0'),
        '-',
        day.padStart(2, '0'),
        'T',
        hour.padStart(2, '0'),
        ':',
        minute.padStart(2, '0'),
        ':',
        second.padStart(2, '0'),
        timezoneOffsetInHours
      ].join('')
    },
    parse: function (date, isEvent, isTimed) {
      var parsedDate = new Date(date).getTime()
      if (parsedDate > now) {
        var endOfDay = new Date()
        endOfDay.setHours(23, 59, 59, 999)

        var endOfTomorrow = new Date()
        endOfTomorrow.setDate(endOfTomorrow.getDate() + 1)
        endOfTomorrow.setHours(23, 59, 59, 999)

        var format = (function () {
          if (parsedDate < endOfDay.getTime()) {
            if (isTimeless(parsedDate) || (isEvent && !isTimed)) {
              return "'Today'"
            } else {
              return 'h:mm a'
            }
          } else if (parsedDate < endOfTomorrow.getTime()) {
            if (isTimeless(parsedDate) || (isEvent && !isTimed)) {
              return "'Tomorrow'"
            } else {
              return "'Tomorrow' h:mm a"
            }
          } else {
            return 'EEE, MMM d'
          }
        })()
        return $filter('date')(parsedDate, format)
      } else {
        if (isTimed) {
          var dateString = $filter('timeAgo')(date)
          return dateString.charAt(0).toUpperCase() + dateString.slice(1)
        } else {
          return 'Today'
        }
      }
    },
    getFullDate: function (date) {
      return $filter('date')(date, 'yyyy MMMM EEEE d')
    }
  }
})
