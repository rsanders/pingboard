/**
 * This is a simple Ping.FM API Client for Javascript, 
 * extracted from the Pingboard
 *
 *
 * Author: Robert Sanders <rsanders+pingfm@gmail.com>
 * Homepage:  http://code.google.com/p/pingboard
 * Reference: http://groups.google.com/group/pingfm-developers/web/api-documentation
 *
 * Version: 0.3.1
 */

var PingFMAPI = function(api_key) {
    this.api_key = api_key;
};

PingFMAPI.prototype = {
   // the base URL for the Ping.FM API
   baseurl: "http://api.ping.fm/v1/",
   
   // whether to omit the cache-buster; should usually be true
   allowCache: true,
   
   // API key for this app; shared for all users
   api_key: null,
   
   // per-user application key
   user_app_key: null,
   
   // whether to pass the debug flag to Ping.FM (simulates posting)
   debug: 0,
   
   // default method if not specified
   post_method: 'default',
   
   // should be a view object with showError, showResult, showNotice, log
   view: null,

   // system services information
   system_servicexml: null,
   system_serviceinfo: [],

   // user services information
   servicexml: null,
   serviceinfo: [],

   // custom trigger information
   triggerxml: null,
   triggerinfo: [],
   
   // use ajax queue
   usequeue: false,
   
   // time of last post
   lastpost: 0,
   
   // wait this many milliseconds between user.post and user.latest - fixes race in ping.fm's API
   post_post_delay: 6000,
   
   proxy_rewriter: null,
   
   initialize: function() {
     this.downloadServiceData();
   },
   
   downloadServiceData: function() {
     this.log("downloading initial system data...");
     this.getSystemServices(function(data) {
            this.serviceinfo = data;
        }
      );
   },
   
   getBaseArgs: function() {
     return { 
         api_key: this.api_key, 
         user_app_key: this.user_app_key,
         debug: this.debug
     };
   },
   
   validateUser: function() {
     var args = this.getBaseArgs();
     var me = this;
     this.doRequest('user.validate', args, 
            function(data) {
                me.log("Success on user.validate");
                jQuery('#back_test_output').val("User is valid: " + jQuery('message', data).text());
            },
            function(data, error) {
                me.log("Failure on user.validate: " + error);
                jQuery('#back_test_output').val( error);
            }
        );
   },
   
   // split a body into a body and title if there are any newlines,
   // return an object with body and title properties
   _getTitle: function(body) {
     if (!body) return {body: null, title: null};
     var lines = body.split("\n");
     if (lines.length > 1) {
        return {body: lines.slice(1).join("\n"), title: lines[0]};
     } else {
        return {body: body, title: null};
     }
   },
   
   // expects # prefix for custom triggers
   _getPostType: function(name) {
     if (name[0] == '#') {
        name = name.substring(1);
        var info = this.triggerinfo[name];
        if (info) {
            return info.method;
        } else {
            // XXX - can we determine this?
            return "status";
        }
     } else {
        return name;
     }
   },
   
   postMessage: function(body, method, title, success, failure, exclude) {
     var args = this.getBaseArgs();
     args.body = body;
     
     // default
     if (! method) method = this.post_method;
     
     // list of services to exclude
     if (exclude && exclude.length > 0) {
        args.exclude = exclude.join(",");
     }

     // default posting API call; use user.tpost for custom triggers
     var apimethod = 'user.post';

     // should always return "status", "blog", or "microblog" 
     var post_type = this._getPostType(method);

     // custom trigger
     if (this.post_method[0] == '#') {
        args.trigger = this.post_method.substring(1);
        apimethod = 'user.tpost';
     }
     else if (this.post_method[0] == '@') {
        args.service = this.post_method.substring(1);
        apimethod = 'user.post';

        // use first defined method, default to microblog
        args.post_method = this.serviceinfo[args.service].methods.length > 0 ? 
                   this.serviceinfo[args.service].methods[0] :
                   "microblog";

        if (args.post_method == 'blog') post_type = 'blog';
     } else {
        args.post_method = this.post_method;
        apimethod = 'user.post';
     }
     
     if (post_type == 'blog' && !title) {
        var parts = this._getTitle(args.body);
        if (! parts.title) {
            parts.title = "Blog Post from Ping.FM";
        }
        args.body = parts.body;
        args.title = parts.title;
     }

     var me = this;

     // record time of last post
     this.lastpost = new Date().getTime();

     this.doRequest(apimethod, args, 
            function(data) {
                me.log("Success on user.post");
                if (success)  {
                    success(data);
                }
                else {
                    me.showResult("Posting succeeded: " + jQuery('message', data).text());
                }
            },
            function(data, err, exception) {
                me.log("Failure on user.post");
                if (failure) {
                    me.log(err);
                    failure(data, err);
                } else {
                    me.showError(err);
                }
            }
        );
   },
   
   log: function(msg) {
     if (this.view && this.view.log) {
        this.view.log(msg);
     } else if (this.debug) {
        console.log(msg);
     }
   },
   
   showError: function(error) {
     if (!error) error = "Unknown error";
     if (this.debug) 
        console.log(error);
     if (this.view && this.view.showError) this.view.showError(error);
   },

   showResult: function(msg) {
     if (this.debug) 
        console.log(msg);
     if (this.view && this.view.showResult) this.view.showResult(msg);
   },

   getTriggerInfo: function() {
     return this.triggerinfo;
   },

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

   getTriggers: function(success, failure) {
     var args = this.getBaseArgs();

     var me = this;
     this.doRequest('user.triggers', args, 
            function(data) {
                me.triggerxml = data;
                var triggerinfo = [];
                if (data) {
                    jQuery('trigger', data).each( function(i) {
                            var id = jQuery(this).attr('id');
                            var method = jQuery(this).attr('method');
                            var services = [];
                            jQuery('service', this).each(function(i) { services.push(jQuery(this).attr('id')); } );
                            triggerinfo[id] = {id: id, method: method, services: services};
                        }
                    );
                }
                me.triggerinfo = triggerinfo;
                me.log("Success on user.triggers");
                if (success) {
                    success( triggerinfo );
                }
            },
            function(data, error) {
                me.log("Failure on user.triggers");
                if (failure) {
                    failure(data, error);
                }
            }
        );
   },

   getServiceInfo: function() {
     return this.serviceinfo;
   },

   /**
    * Return an array of service objects for a given trigger/method, 
    * expressed with the usual bare (post type), '@' (service), or
    * '#' (trigger) format.
    *
    */
   getServicesFor: function(type) {
     if (! type || type.length == 0) return [];
     var sigil = type[0];
     var services = [];
     var svcnamelist = [];
     if (sigil == '@') {
        svcnamelist.push(type.substring(1));
     } else if (sigil == '#') {
        var tmp = this.triggerinfo[type.substring(1)].services;
        svcnamelist = svcnamelist.concat(this.triggerinfo[type.substring(1)].services);
     } else {
         var svcname;
         for (svcname in this.serviceinfo) {
            var svc = this.serviceinfo[ svcname ];
            if (typeof svc == 'function') continue;

            // check that the method is supported for this service
            if (jQuery.grep(svc.methods, function(o){return o == type;}).length > 0) {
                svcnamelist.push(svc.id);
            }
         } 
     }
     
     var idx;
     for (idx = 0; idx < svcnamelist.length; idx++) {
        services.push( this.serviceinfo[ svcnamelist[idx] ] );
     }

      
     return services;
   },

    /*
        <?xml version="1.0"?>
        <rsp status="OK">
          <transaction>12345</transaction>
          <method>user.services</method>
          <services>
            <service id="twitter" name="Twitter">
              <methods>microblog,status</methods>
            </service>
            <service id="facebook" name="Facebook">
              <methods>status</methods>
            </service>
            ...
          </services>
        </rsp>
    */

   getServices: function(success, failure) {
     var args = this.getBaseArgs();

     var me = this;
     this.doRequest('user.services', args, 
            function(data) {
                me.servicexml = data;
                var serviceinfo = [];
                if (data) {
                  serviceinfo = me._parseServices(jQuery('services', data));
                }
                me.serviceinfo = serviceinfo;
                me.log("Success on user.services");
                if (success) {
                    success( serviceinfo );
                }
            },
            function(data, error) {
                me.log("Failure on user.services");
                if (failure) {
                    failure(data, error);
                }
            }
        );
   },


  /*
  <messages>
    <message id="12345" method="blog">
      <date rfc="Tue, 15 Apr 2008 13:56:18 -0500" unix="1234567890" />
      <services>
        <service id="blogger" name="Blogger"/>
      </services>
      <content>
        <title>SnVzdCBoYW5naW4nIG91dCE=</title>
        <body>R29pbmcgdG8gdGhlIHN0b3JlLg==</body>
      </content>
    </message>
    <message id="12345" method="microblog">
      <date rfc="Tue, 15 Apr 2008 13:56:18 -0500" unix="1234567890" />
      <services>
        <service id="twitter" name="Twitter"/>
      </services>
      <content>
        <body>R29pbmcgdG8gdGhlIHN0b3JlLg==</body>
      </content>
    </message>
    <message id="12345" method="status">
      <date rfc="Tue, 15 Apr 2008 13:56:18 -0500" unix="1234567890" />
      <services>
        <service id="twitter" name="Twitter"/>
        <service id="facebook" name="Facebook"/>
      </services>
      <content>
        <body>aXMgdGVzdGluZyBQaW5nLmZtIQ==</body>
      </content>
    </message>
    ...
  </messages>
  */
  
   _parseServices: function(list) {
      var services = [];
      jQuery('service', list).each(function(i) { 
          var id = jQuery(this).attr('id');
          var name = jQuery(this).attr('name');
          var methods = [];
          var methodtext = jQuery('methods', this).text();
          if (methodtext && methodtext.length > 0) {
            methods = methodtext.split(',');
          }
          services[id] = { id: id, name: name, methods: methods };
       } );
      return services;
   },
  
   /**
    * Returns an array of items that are objects containing these properties:
    * 
    * id, method, date, services, body
    *
    */
   getLatest: function(limit, order, success, failure) {
     var args = this.getBaseArgs();

     if (!limit) limit = 25;
     args.limit = limit;

     if (order) args.order = 'DESC';

     var me = this;
     var executable = function() {
       me.doRequest('user.latest', args, 
            function(xml) {
                me.latestxml = xml;
                var parsed = [];
                if (xml) {
                    jQuery('message', xml).each( function(i) {
                            var entry = {
                                 id:      jQuery(this).attr('id'),
                                 method:  jQuery(this).attr('method'),
                              };
                            entry.date = new Date();
                            entry.date.setTime( parseInt(jQuery('date', this).attr('unix') || "0") * 1000 );
                            entry.services = me._parseServices(jQuery('services', this));
                            entry.body = Base64.decode(jQuery('body', this).text());
                            parsed.push( entry );
                        }
                    );
                }
                me.latestinfo = parsed;
                me.log("Success on user.latest");
                if (success) {
                    success( parsed, xml );
                }
            },
            function(data, error) {
                me.log("Failure on user.latest");
                if (failure) {
                    failure(data, error);
                }
            }
        );
      };
      
      // wait 5 seconds from last post to get latest list
      var timesincepost = new Date().getTime() - this.lastpost;
      if (timesincepost < this.post_post_delay)
      {
        me.log("Sleeping " + (this.post_post_delay - timesincepost) + " ms");
        setTimeout(executable, this.post_post_delay - timesincepost);
      } else {
        executable();
      }
   },

    /**
        <rsp status="OK">
          <transaction>48a87626afa41</transaction>
          <method>system.services</method>
          <services>
            <service id="bebo" name="Bebo">
              <trigger>@be</trigger>
              <url>http://www.bebo.com/</url>
              <icon>http://p.ping.fm/static/icons/bebo.png</icon>
            </service>
            <service id="blogger" name="Blogger">
              <trigger>@bl</trigger>
              <url>http://www.blogger.com/</url>
              <icon>http://p.ping.fm/static/icons/blogger.png</icon>
            </service>
          </services>
        </rsp>
     */
    /*

        var obj = { name: elt[0], id: elt[1], trigger: elt[2],
                    service_url: elt[3], icon_url: elt[4] };
    } 
    */

   _parseSystemServices: function(list) {
      var services = [];
      jQuery('service', list).each(function(i) { 
          var id = jQuery(this).attr('id');
          var name = jQuery(this).attr('name');
          var trigger = jQuery('trigger', this).text();
          var icon_url = jQuery('icon', this).text();
          var service_url = jQuery('url', this).text();

          // in current API, 'methods' is not provided for system svcs
          var methods = [];
          var methodtext = jQuery('methods', this).text();
          if (methodtext && methodtext.length > 0) {
            methods = methodtext.split(',');
          }
          services[id] = { id: id, name: name, methods: methods,
                           trigger: trigger, icon_url: icon_url,
                           service_url: service_url
                         };
       } );
      return services;
   },

   getSystemServices: function(success, failure) {
     var args = this.getBaseArgs();

     var me = this;
     this.doRequest('system.services', args, 
            function(data) {
                me.system_servicexml = data;
                var system_serviceinfo = [];
                if (data) {
                  system_serviceinfo = me._parseSystemServices(jQuery('services', data));
                }
                me.system_serviceinfo = system_serviceinfo;
                me.log("Success on system.services");
                if (success) {
                    success( system_serviceinfo );
                }
            },
            function(data, error) {
                me.log("Failure on system.services");
                if (failure) {
                    failure(data, error);
                }
            }
        );
   },

    /************************** plumbing ********************************/

      doRequest: function(method, args, success, failure, httpmethod, usequeue) {
        if (! httpmethod) {
          httpmethod = 'post';
        }

        var ajax;
        if ( (usequeue || this.usequeue) && jQuery.ajaxQueue) {
            ajax = jQuery.ajaxQueue;
        } else {
            ajax = jQuery.ajax;
        }

        var me = this;
        var url = me.baseurl + method;
        var ajaxargs = {
          url: url,
          type: httpmethod,
          data: args,
          global: true,
          cache: me.allowCache,
          success: this._makejQuerySuccessHandler(success, failure),
          error: this._makejQueryFailureHandler(failure)
        };
        
        if (this.proxy_rewriter) {
            ajaxargs = this.proxy_rewriter(ajaxargs);
        }
        
        var request = ajax(ajaxargs);
      },

  /**** Utility functions ****/

  _makejQuerySuccessHandler: function(success, failure) {
    var api = this;
    var me = this;
    return function (data, status) {
      if (jQuery('rsp', data).attr('status') != 'OK')
      {
        me.log("status is bad");
        if (failure) {
          var errorText = jQuery('message', data).text();
          failure({ responseXML: data, responseText: "<error>" + errorText + "</error>" },
                  errorText, null);

        }
      }
      else
      {
        me.log("status is good");
        if (success) {
          success(data, status);
        }
      }
    };
  },

  _makejQueryFailureHandler: function(callback) {
    var me = this;
    return function (response, status, error) {
      me.log("in hard failure");
      if (! status || status.length == 0) {
        status = "Unknown error";
      }
      if (callback) {
        callback(response, "Hard failure: " + status, error);
      }
    };
  },

  /**
   * return all services supported by Ping.fm as of 8/2008
   */
  configSupportedServices: function() {
  
    if (this.system_serviceinfo) {
        // this.log("configSupportedServices using system_serviceinfo");
        return this.system_serviceinfo;
    }
  
    // name, id, trigger, service_url, icon_url, capability_string
    //    in capability_string: 'b' for blog, 'm' for micro, 's' for status - this is UNRELIABLE
    var list = [
            ['Bebo', 'bebo', '@be', 'http://www.Bebo.com', 'svcicons/bebo.png', 'bs'],
            ['Blogger', 'blogger', '@bl', 'http://www.Blogger.com', 'svcicons/blogger.png', 'bms'],
            ['Brightkite', 'brightkite', '@bk', 'http://www.Brightkite.com', 'svcicons/brightkite.png', 'ms'],
            ['Custom URL', 'custom', '@cu', 'http://ping.fm/dashboard', 'svcicons/custom.png', 'bms'],
            ['Facebook', 'facebook', '@fb', 'http://www.Facebook.com', 'svcicons/facebook.png', 's'],
            ['FriendFeed', 'friendFeed', '@ff', 'http://www.FriendFeed.com', 'svcicons/friendfeed.png', 'bms'],
            ['hi5', 'hi5', '@hi', 'http://www.hi5.com', 'svcicons/hi5.png', 'bs'],
            ['Identi.ca', 'identi.ca', '@id', 'http://www.Identi.ca', 'svcicons/identi.ca.png', 'ms'],
            ['Jaiku', 'jaiku', '@jk', 'http://www.Jaiku.com', 'svcicons/jaiku.png', 'ms'],
            ['kwippy', 'kwippy', '@kw', 'http://www.kwippy.com', 'svcicons/kwippy.png', 'bms'],
            ['LinkedIn', 'linkedin', '@li', 'http://www.LinkedIn.com', 'svcicons/linkedin.png', 's'],
            ['LiveJournal', 'livejournal', '@lj', 'http://www.LiveJournal.com', 'svcicons/livejournal.png', 'bms'],
            ['Mashable', 'mashable', '@ma', 'http://www.Mashable.com', 'svcicons/mashable.png', 'ms'],
            ['MySpace', 'myspace', '@my', 'http://www.MySpace.com', 'svcicons/myspace.png', 'bms'],
            ['Plaxo', 'plaxo', '@px', 'http://pulse.Plaxo.com', 'svcicons/plaxo.png', 'ms'],
            ['Plurk', 'plurk', '@pl', 'http://www.Plurk.com', 'svcicons/plurk.png', 'ms'],
            ['Pownce', 'pownce', '@pn', 'http://www.Pownce.com', 'svcicons/pownce.png', 'ms'],
            ['Rejaw', 'rejaw', '@re', 'http://www.rejaw.com', 'svcicons/rejaw.png', 'ms'],
            ['Tumblr', 'tumblr', '@tr', 'http://www.Tumblr.com', 'svcicons/tumblr.png', 'bms'],
            ['Twitter', 'twitter', '@tt', 'http://www.Twitter.com', 'svcicons/twitter.png', 'ms'],
            ['WordPress', 'wordpress', '@wp', 'http://www.WordPress.com', 'svcicons/wordpress.png', 'bms'],
            ['Xanga', 'xanga', '@xa', 'http://www.Xanga.com', 'svcicons/xanga.png', 'bms'],
            ['Zooomr', 'zooomr', '@zo', 'http://www.Zooomr.com', 'svcicons/zooomr.png', 'bms']
        ];
    var services = [];
    var idx;
    for (idx = 0; idx < list.length; idx++) {
        var elt = list[idx];
        var obj = { name: elt[0], id: elt[1], trigger: elt[2],
                    service_url: elt[3], icon_url: elt[4] };

        services[obj.id] = obj;
    }
    
    return services;
  },
  
  /**
   * Get the description object for a given service by api name,
   * or any other property name
   */
  getSupportedService: function(value, property) {
    if (!property)  property = 'id';
    var idx;
    var supported;

    if (this.system_serviceinfo && value.toLowerCase() != 'custom') {
      // console.log("using system.services output");
      supported = this.system_serviceinfo;
    } else {
      supported = this.configSupportedServices();
    }

    for (idx in supported) {
        var elt = supported[idx];
        if (typeof elt == 'function') continue;
        
        if (elt[property] && elt[property] == value)
            return elt;
    }
    return null;
  },

  version: '0.5'
};

PingFMAPI.prototype.FlexProxyRewriter = function(ajaxargs) {
    ajaxargs.url = url.replace(/^https?:\/\//, "http://flexproxy.eng.vitrue.com/");
    
    return ajaxargs;
};
