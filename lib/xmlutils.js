/**
 *
 * Some misc XML utilities 
 *
 * rsanders+oss@gmail.com
 *
 */

var rdsxmlutils = {
  /**
   * Converts a DOM Node to a JS object.
   *
   * @param {DOMNode} a DOM Element or Document node
   * @returns {Object} object with properties corresponding to tags
   */
  convertNodeToObject: function(node) {
    var object = {};
    if (node === null || ! node.childNodes) {
      return object;
    }
    
    var nodes = node.childNodes;

    for (var idx = 0; idx < nodes.length; idx++)
    {
      var n = nodes[idx];
      
      // element type
      if (n.nodeType == 1) {
        // single child node of type "text"
        if (n.childNodes.length == 1 && n.firstChild.nodeType == 3)
        {
          var text = this.getElementText(n);
          res = text;
        }
        else
        {
          res = this.convertNodeToObject(n);
        }
        if (res !== null && !(typeof res == 'object' && this._isEmpty(res)))
        {
          if (! object[n.tagName]) {
            object[n.tagName] = res;
          } else {
            object[n.tagName] = this._forceArray(object[n.tagName]);
            object[n.tagName].push(res);
          }
        } else {
          // alert("skipping null res for " + n.tagName);
        }
      }  
      // attribute
      else if (n.nodeType == 2) {
      }
      else if (n.nodeType == 3) {
        var text = "";
        if (object['$']) text = object['$'];
        text = text + n.nodeValue;
        if (text.strip() != "") {
          object['$'] = text;
        }
      }
    }
    return object;
  },
 

  // retrieve text of an XML document element, including
  // elements using namespaces
  getElementTextNS: function(prefix, local, parentElem, index) {
      var result = "";
      if (prefix && isIE) {
          // IE/Windows way of handling namespaces
          result = parentElem.getElementsByTagName(prefix + ":" + local)[index];
      } else {
          // the namespace versions of this method 
          // (getElementsByTagNameNS()) operate
          // differently in Safari and Mozilla, but both
          // return value with just local name, provided 
          // there aren't conflicts with non-namespace element
          // names
          result = parentElem.getElementsByTagName(local)[index];
      }
      if (result) {
          // get text, accounting for possible
          // whitespace (carriage return) text nodes 
          if (result.childNodes.length > 1) {
              return result.childNodes[1].nodeValue;
          } else {
              return result.firstChild.nodeValue;    		
          }
      } else {
          return "n/a";
      }
  },

  
  _forceArray: function(object) {
    if (object === null) {
      return [];
    }
    else if (object instanceof Array) {
      return object;
    }
    else {
      return [object];
    }
  },
  
  _typeOf: function(value) {
      var s = typeof value;
      if (s === 'object') {
          if (value) {
              if (typeof value.length === 'number' &&
                      !(value.propertyIsEnumerable('length')) &&
                      typeof value.splice === 'function') {
                  s = 'array';
              }
          } else {
              s = 'null';
          }
      }
      return s;
  },
  
  _isEmpty: function(o) {
      var i, v;
      if (this._typeOf(o) === 'object') {
          for (i in o) {
              v = o[i];
              if (v !== undefined && this._typeOf(v) !== 'function') {
                  return false;
              }
          }
      }
      return true;
  },
  
  
  version: '0.1'
 
};
  