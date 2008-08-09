/*
 * JavaScript Pretty Date
 * Copyright (c) 2008 John Resig (jquery.com)
 * Licensed under the MIT license.
 */

// 2008-01-28T20:24:17Z
function dateToIso(date)
{
    var pad = function(int, digits) {
         var str = int + "";
         while (str.length < digits) str = "0" + str;
         return str;
      };
    return date.getUTCFullYear() + '-' + pad(date.getUTCMonth()+1, 2) + '-' + pad(date.getUTCDate(), 2) + 
           'T' +
           pad(date.getUTCHours(),2) + ':' + pad(date.getUTCMinutes(),2) + ':' + pad(date.getUTCSeconds(),2) + 'Z';
}


// Takes an ISO time and returns a string representing how
// long ago the date represents.
function prettyDate(time)
{
    var pluralize = function(word,num) { return ("" + word + (num > 1 ? "s" : "")); };

    var date;
    if (typeof time == 'object') 
    {
        date = time;
    } else {
        //time = dateToIso(time);

	    date = new Date((time || "").replace(/-/g,"/").replace(/[TZ]/g," ")),
    }
    var diff = (((new Date()).getTime() - date.getTime()) / 1000),
	var day_diff = Math.floor(diff / 86400);			
	if ( isNaN(day_diff) || day_diff < 0 || day_diff >= 31 )
		return "unknown";
			
	return day_diff == 0 && (
			diff < 60 && "just now" ||
			diff < 120 && "1 minute ago" ||
			diff < 3600 && Math.floor( diff / 60 ) + " " + pluralize("minute", diff/60) + " ago" ||
			diff < 7200 && "1 hour ago" ||
			diff < 86400 && Math.floor( diff / 3600 ) + " " + pluralize("hour", diff/3600) + " ago ") ||
		day_diff == 1 && "Yesterday" ||
		day_diff < 7 && day_diff + " " + pluralize("day", day_diff) + " ago" ||
		day_diff < 31 && Math.ceil( day_diff / 7 ) + " " + pluralize("week", day_diff/7) + " ago";
}

// If jQuery is included in the page, adds a jQuery plugin to handle it as well
if ( typeof jQuery != "undefined" )
	jQuery.fn.prettyDate = function(){
		return this.each(function(){
			var date = prettyDate(this.title);
			if ( date )
				jQuery(this).text( date );
		});
	};
