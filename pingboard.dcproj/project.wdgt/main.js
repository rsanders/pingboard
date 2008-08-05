/* 
 This file was generated by Dashcode.  
 You may edit this file to customize your widget or web page 
 according to the license.txt file included in the project.
 */

//
// Function: load()
// Called by HTML body element's onload event when the widget is ready to start
//
function load()
{
    dashcode.setupParts();
    
    setupPingFM();

    setupUI();
    
    pingdb.initialize();
}

//
// Function: remove()
// Called when the widget has been removed from the Dashboard
//
function remove()
{
    // Stop any timers to prevent CPU usage
    // Remove any preferences as needed
    // widget.setPreferenceForKey(null, dashcode.createInstancePreferenceKey("your-key"));
}

//
// Function: hide()
// Called when the widget has been hidden
//
function hide()
{
    // Stop any timers to prevent CPU usage
}

//
// Function: show()
// Called when the widget has been shown
//
function show()
{
    // Restart any timers that were stopped on hide
}

//
// Function: sync()
// Called when the widget has been synchronized with .Mac
//
function sync()
{
    // Retrieve any preference values that you need to be synchronized here
    // Use this for an instance key's value:
    // instancePreferenceValue = widget.preferenceForKey(null, dashcode.createInstancePreferenceKey("your-key"));
    //
    // Or this for global key's value:
    // globalPreferenceValue = widget.preferenceForKey(null, "your-key");
}

//
// Function: showBack(event)
// Called when the info button is clicked to show the back of the widget
//
// event: onClick event from the info button
//
function showBack(event)
{
    var front = document.getElementById("front");
    var back = document.getElementById("back");
    var error = document.getElementById("error_pane");
    if (window.widget) {
        widget.prepareForTransition("ToBack");
    }

    front.style.display = "none";
    error.style.display= "none";
    back.style.display = "block";


    if (window.widget) {
        setTimeout('widget.performTransition();', 0);
    }
}

//
// Function: showFront(event)
// Called when the done button is clicked from the back of the widget
//
// event: onClick event from the done button
//
function showFront(event)
{
    var front = document.getElementById("front");
    var back = document.getElementById("back");
    var error = document.getElementById("error_pane");

    if (window.widget) {
        widget.prepareForTransition("ToFront");
    }

    front.style.display="block";
    back.style.display="none";
    error.style.display="none";

    if (window.widget) {
        setTimeout('widget.performTransition();', 0);
    }
}

function showError(message)
{
    var front = document.getElementById("front");
    var back = document.getElementById("back");
    var error = document.getElementById("error_pane");

    if (window.widget) {
        widget.prepareForTransition("ToBack");
    }

    jQuery('#error_text').val(message);

    front.style.display="none";
    back.style.display="none";
    error_pane.style.display="block";

    if (window.widget) {
        setTimeout('widget.performTransition();', 0);
    }
}

if (window.widget) {
    widget.onremove = remove;
    widget.onhide = hide;
    widget.onshow = show;
    widget.onsync = sync;
}


function openPingFM(event)
{
    widget.openURL("http://ping.fm/");
}


function openAppKeyPage(event)
{
    widget.openURL("http://ping.fm/key/");
}


function postTextChange()
{
    var count = jQuery('#post_text').val().length;
    jQuery('#character_count').text(String(count));
}

var pingprefs = {
    setPref: function(key, value) {
        widget.setPreferenceForKey(value, key);
    },
    
    getPref: function(key, defval) {
        var res = widget.preferenceForKey(key);
        if (res == undefined) {
            return defval;
        } else {
            return res;
        }
    },
}

function setAppKey(value)
{
    pingprefs.setPref("pingfm_appkey", value);
}

function getAppKey()
{
    return pingprefs.setPref("pingfm_appkey");
}

function savePrefs()
{
    pingprefs.setPref("pingfm_appkey", pingview.getAppKey());
    pingprefs.setPref("debug", pingview.getDebug());
}

function configDone(event)
{
    savePrefs();
    setupPingFM();

    return showFront(event);
}


function populatePrefs()
{
    pingview.setAppKey(pingprefs.getPref("pingfm_appkey"));
    pingview.setDebug(pingprefs.getPref("debug"));
}

function doShowBack(event)
{
    populatePrefs();
    showBack(event);
}


function validateUser(event)
{
    // need to save prefs and setup Ping.FM first so we have the latest key
    savePrefs();
    setupPingFM();

    pingfm.validateUser();
}

var pingfm = {
   baseurl: "http://api.ping.fm/v1/",
   allowCache: true,
   api_key: null,
   user_app_key: null,
   debug: 0,
   post_method: 'default',
   
   getBaseArgs: function() {
     return { 
         api_key: this.api_key, 
         user_app_key: this.user_app_key,
         debug: this.debug
     };
   },
   
   validateUser: function() {
     var args = this.getBaseArgs();
     this.doRequest('user.validate', args, 
            function(data) {
                console.log("Success on user.validate");
                jQuery('#back_test_output').val("User is valid: " + jQuery('message', data).text());
            },
            function(data, error) {
                console.log("Failure on user.validate");
                jQuery('#back_test_output').val( error);
            }
        );
   },
   
   postMessage: function() {
     var args = this.getBaseArgs();
     args.post_method = this.post_method;
     args.body = jQuery('#post_text').val();

     // default posting method
     var apimethod = 'user.post';

     // custom trigger
     if (this.post_method[0] == '#') {
        args.trigger = this.post_method.substring(1);
        apimethod = 'user.tpost';
     } else {
        args.post_method = this.post_method;
        apimethod = 'user.post';
     }
     
     if (args.post_method == 'blog') {
        args.title = 'Blog Post from Pingboard';
     }

     // keep history
     pingdb.addPing(args.body, args.post_method);

     this.doRequest(apimethod, args, 
            function(data) {
                console.log("Success on user.post");
                jQuery('#back_test_output').val("Posting succeeded: " + jQuery('message', data).text());
            },
            function(data, error) {
                console.log("Failure on user.post");
                jQuery('#back_test_output').val( error);
                showError(error);
            }
        );
   },
   
   getTriggers: function(success, failure) {
     var args = this.getBaseArgs();

     this.doRequest('user.triggers', args, 
            function(data) {
                console.log("Success on user.triggers");
                success( jQuery('triggers', data).get(0) );
            },
            function(data, error) {
                console.log("Failure on user.triggers");
                jQuery('#back_test_output').val( error);
                showError(error);
                if (failure) {
                    failure(data, error);
                }
            }
        );
   },
   

      doRequest: function(method, args, success, failure, httpmethod) {
        if (! httpmethod) {
          httpmethod = 'post';
        }

        var me = this;
        var request = jQuery.ajax({
          url: me.baseurl + method,
          type: httpmethod,
          data: args,
          global: true,
          cache: me.allowCache,
          success: this._makejQuerySuccessHandler(success, failure),
          error: this._makejQueryFailureHandler(failure)
        });
      },

  /**** Utility functions ****/

  _makejQuerySuccessHandler: function(success, failure) {
    var api = this;
    return function (data, status) {
      if (jQuery('rsp', data).attr('status') != 'OK')
      {
        console.log("status is bad");
        if (failure) {
          var errorText = jQuery('message', data).text();
          failure({ responseXML: data, responseText: "<error>" + errorText + "</error>" },
                  errorText, null);

        }
      }
      else
      {
        console.log("status is good");
        if (success) {
          success(data, status);
        }
      }
    };
  },

  _makejQueryFailureHandler: function(callback) {
    return function (response, status, error) {
      console.log("in hard failure");
      if (callback) {
        callback(response, "Hard failure: " + status, error);
      }
    };
  },
   
   foo: 'bar'
};

function setupPingFM()
{
    pingfm.api_key = '62efb891fc6ae7200a2699c566503735';
    pingfm.user_app_key = pingprefs.getPref('pingfm_appkey');
    pingfm.debug = pingprefs.getPref('debug', false) ? '1' : '0';
}


function doPost(event)
{
    pingfm.postMessage();
    pingview.resetPost();
}


// this is not a saved pref
function setPostType(event)
{
    pingfm.post_method = event.target.value;
}

var pingview = {
  historyNum: -1,

  showPrevHistory: function() {
    this.showHistory(Math.min(this.historyNum+1, pingdb.countPings()));
  },
  
  showNextHistory: function() {
    this.showHistory(Math.max(-1, this.historyNum-1));
  },
  
  showHistory: function(num) {
    var ping;
    if (num == -1) {
        ping = {message:'', destination: 'default'};
        showNum = '';
    }
    else {
        ping = pingdb.getPing(num);
        showNum = String(num+1);
    }
    
    this.historyNum = num;

    if (ping) {
        this.setPostBody(ping.message);
        this.setPostMethod(ping.destination);
        jQuery('#historyNum').text(showNum);
    }
  },

  getPostMethod: function() {
    return jQuery('select', jQuery('#post_type')).val();
  },
  
  setPostMethod: function(val) {
    jQuery('select', jQuery('#post_type')).val(val).change();
  },
  
  getPostBody: function() {
    return jQuery('#post_text').val();
  },
  
  setPostBody: function(val) {
    jQuery('#post_text').val(val).change();
    // postTextChange();
  },
  
  getDebug: function() {
    return jQuery('#debug_button').get(0).checked;
  },
  
  setDebug: function(val) {
    jQuery('#debug_button').get(0).checked = val;
    jQuery('#debug_button').change();
  },

  getAppKey: function() {
    return jQuery('#app_key').val();
  },
  
  setAppKey: function(val) {
    jQuery('#app_key').val(val);
  },
  
  resetPost: function(val) {
      this.setPostBody('');
      this.showHistory(-1);
  },
  
  version: '0.1',
};

/**
 *
 *
 * See http://webkit.org/misc/DatabaseExample.html
 */ 
var pingdb = {
    db: null,
    
    initialized: false,
    
    available: true,
    
    initialize: function() {
        if (this.initialized)
            return true;

        this.db = [];

        this.initialized = true;
        return true;
    },
    
    clear: function() {
        this.db = [];
    },
    
    addPing: function(message, destination) {
        if (! destination) { destination = 'default' };
        this.db.unshift( {message: message, destination: destination, when: new Date()} );
    },
    
    listPings: function(count) {
        if (! count) count = 10;
        return this.db;
    },
    
    getPing: function(num) {
        if (this.db.length <= num)
            return null;
        else
            return this.db[num];
    },
    
    countPings: function() {
        return this.db.length;
    },
    
    version: '0.1'
}

function doDebugClick(event)
{
    pingfm.debug = pingview.getDebug() ? '1' : '0';
}

/*
  <triggers>
    <trigger id="twt" method="microblog">
      <services>
        <service id="twitter" name="Twitter"/>
      </services>
    </trigger>
    <trigger id="fb" method="status">
      <services>
        <service id="facebook" name="Facebook"/>
      </services>
    </trigger>
    ...
  </triggers>
*/

function handleTriggers(triggers)
{
    var options = [
            ['Default', 'default', true],
            ['Status', 'status'],
            ['Micro-blog', 'microblog'],
            ['Blog', 'blog']
        ];
    
    jQuery('trigger', triggers).each( function(i) {
            var id = jQuery(this).attr('id');
            var method = jQuery(this).attr('method');
            
            options.push([id + " [" + method + "]", "#" + id]);
        }
    );
    
    jQuery('#post_type').get(0).object.setOptions(options, false);
    jQuery('#post_type').change();
}

function setupUI()
{
    pingfm.getTriggers(handleTriggers);
}

function showPrevHistory()
{
    pingview.showPrevHistory();
}

function showNextHistory()
{
    pingview.showNextHistory();
}