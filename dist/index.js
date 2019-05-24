'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var _classCallCheck = _interopDefault(require('@babel/runtime/helpers/classCallCheck'));
var _createClass = _interopDefault(require('@babel/runtime/helpers/createClass'));
var _toConsumableArray = _interopDefault(require('@babel/runtime/helpers/toConsumableArray'));
var _regeneratorRuntime = _interopDefault(require('@babel/runtime/regenerator'));
var _asyncToGenerator = _interopDefault(require('@babel/runtime/helpers/asyncToGenerator'));
var _objectSpread = _interopDefault(require('@babel/runtime/helpers/objectSpread'));
var _defineProperty = _interopDefault(require('@babel/runtime/helpers/defineProperty'));
var PeerData = require('peer-data');
var PeerData__default = _interopDefault(PeerData);

function getInstall() {
  return function install(event) {
    event.waitUntil(self.skipWaiting());
  };
}

function getActivate() {
  return function activate(event) {
    event.waitUntil(self.clients.claim());
  };
}

function getFetch(router) {
  return function (event) {
    try {
      var request = event.request.clone();
      var url = new URL(request.url);
      var handler = router.getHandler(request.method, url.pathname);

      if (handler) {
        return event.respondWith(handler(event));
      } // find out if other request are being handled by network not sw


      return event.respondWith(fetch(event.request));
    } catch (error) {
      // This catch() will handle exceptions thrown from the fetch() operation.
      // Note that a HTTP error response (e.g. 404) will NOT trigger an exception.
      // It will return a normal response object that has the appropriate error code set.
      throw error;
    }
  };
}

var Middleware =
/*#__PURE__*/
function () {
  function Middleware() {
    _classCallCheck(this, Middleware);

    this.applyFastest = this.applyFastest.bind(this);
    this.applyOrdered = this.applyOrdered.bind(this);
    this._composePlugins = this._composePlugins.bind(this);
    this._composeHandlers = this._composeHandlers.bind(this);
  } // Apply middleware fastest win


  _createClass(Middleware, [{
    key: "applyFastest",
    value: function applyFastest() {
      var _this = this;

      for (var _len = arguments.length, middleware = new Array(_len), _key = 0; _key < _len; _key++) {
        middleware[_key] = arguments[_key];
      }

      return (
        /*#__PURE__*/
        function () {
          var _ref = _asyncToGenerator(
          /*#__PURE__*/
          _regeneratorRuntime.mark(function _callee(request) {
            var puts, response;
            return _regeneratorRuntime.wrap(function _callee$(_context) {
              while (1) {
                switch (_context.prev = _context.next) {
                  case 0:
                    puts = [];
                    _context.next = 3;
                    return Promise.race(middleware.map(function (factory) {
                      var middleware = factory(request);
                      puts.push(middleware.put);
                      return middleware.get();
                    }));

                  case 3:
                    response = _context.sent;

                    _this._composeHandlers.apply(_this, puts)(response);

                    return _context.abrupt("return", response);

                  case 6:
                  case "end":
                    return _context.stop();
                }
              }
            }, _callee);
          }));

          return function (_x) {
            return _ref.apply(this, arguments);
          };
        }()
      );
    } // Apply middleware in order

  }, {
    key: "applyOrdered",
    value: function applyOrdered() {
      var _this2 = this;

      for (var _len2 = arguments.length, middleware = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        middleware[_key2] = arguments[_key2];
      }

      return (
        /*#__PURE__*/
        function () {
          var _ref2 = _asyncToGenerator(
          /*#__PURE__*/
          _regeneratorRuntime.mark(function _callee2(request) {
            var composed, response;
            return _regeneratorRuntime.wrap(function _callee2$(_context2) {
              while (1) {
                switch (_context2.prev = _context2.next) {
                  case 0:
                    _context2.next = 2;
                    return _this2._composePlugins(middleware)(request);

                  case 2:
                    composed = _context2.sent;
                    _context2.next = 5;
                    return composed.get();

                  case 5:
                    response = _context2.sent;
                    composed.put && composed.put(response);
                    return _context2.abrupt("return", response);

                  case 8:
                  case "end":
                    return _context2.stop();
                }
              }
            }, _callee2);
          }));

          return function (_x2) {
            return _ref2.apply(this, arguments);
          };
        }()
      );
    } // Composes middleware into single object
    // Automatically skips next calls when response is not null
    // Call put method for previous middleware with given response

  }, {
    key: "_composePlugins",
    value: function _composePlugins(funcs) {
      var _this3 = this;

      if (funcs.length === 0) {
        return function () {
          return {
            get: function get() {
              return null;
            }
          };
        };
      }

      return funcs.reduce(function (a, b) {
        return (
          /*#__PURE__*/
          function () {
            var _ref3 = _asyncToGenerator(
            /*#__PURE__*/
            _regeneratorRuntime.mark(function _callee3(request) {
              var x, response, y;
              return _regeneratorRuntime.wrap(function _callee3$(_context3) {
                while (1) {
                  switch (_context3.prev = _context3.next) {
                    case 0:
                      _context3.next = 2;
                      return a(request);

                    case 2:
                      x = _context3.sent;
                      _context3.next = 5;
                      return x.get();

                    case 5:
                      response = _context3.sent;

                      if (!response) {
                        _context3.next = 9;
                        break;
                      }

                      // pass response to put method
                      x.put && x.put(response);
                      return _context3.abrupt("return", {
                        get: function get() {
                          return response;
                        }
                      });

                    case 9:
                      _context3.next = 11;
                      return b(request);

                    case 11:
                      y = _context3.sent;
                      _context3.next = 14;
                      return y.get();

                    case 14:
                      response = _context3.sent;
                      return _context3.abrupt("return", {
                        get: function get() {
                          return response;
                        },
                        put: _this3._composeHandlers(y.put, x.put)
                      });

                    case 16:
                    case "end":
                      return _context3.stop();
                  }
                }
              }, _callee3);
            }));

            return function (_x3) {
              return _ref3.apply(this, arguments);
            };
          }()
        );
      });
    } // Composes handler methods for previous middleware into single one

  }, {
    key: "_composeHandlers",
    value: function _composeHandlers() {
      for (var _len3 = arguments.length, funcs = new Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
        funcs[_key3] = arguments[_key3];
      }

      // If handler is not a function, mock it
      funcs = funcs.map(function (func) {
        return function () {
          if (typeof func === "function") {
            func.apply(void 0, arguments);
          }
        };
      });
      return funcs.reduce(function (a, b) {
        return function () {
          a.apply(void 0, arguments);
          b.apply(void 0, arguments);
        };
      });
    }
  }]);

  return Middleware;
}();

var Route =
/*#__PURE__*/
function () {
  function Route(strategy) {
    _classCallCheck(this, Route);

    this.strategy = strategy || new Middleware().applyOrdered;
    this.middleware = [];
    this.addMiddleware = this.addMiddleware.bind(this);
  }

  _createClass(Route, [{
    key: "addMiddleware",
    value: function addMiddleware(middleware) {
      this.middleware = this.middleware.concat(middleware);
    }
  }]);

  return Route;
}();

var Node =
/*#__PURE__*/
function () {
  function Node(id) {
    var parent = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

    _classCallCheck(this, Node);

    this.id = id;
    this.parent = parent;
    this.regexp = null;
    this.children = [];
    this.route = null;
    this.isRoot = this.isRoot.bind(this);
    this.isLeaf = this.isLeaf.bind(this);
    this.addChild = this.addChild.bind(this);
    this.getChild = this.getChild.bind(this);
    this.getMiddleware = this.getMiddleware.bind(this);
    this._isMatch = this._isMatch.bind(this);
  }

  _createClass(Node, [{
    key: "isRoot",
    value: function isRoot() {
      return this.parent === null;
    }
  }, {
    key: "isLeaf",
    value: function isLeaf() {
      return this.children.lenngth === 0;
    }
  }, {
    key: "addChild",
    value: function addChild(path) {
      if (path === "") {
        return this;
      }

      var parts = path.split("/");

      for (var i in this.children) {
        var child = this.children[i];

        if (child._isMatch(parts[0])) {
          return child.addChild(parts.slice(1).join("/"));
        }
      }

      var node = new Node(parts[0], this);
      this.children.push(node);
      return node.addChild(parts.slice(1).join("/"));
    }
  }, {
    key: "getChild",
    value: function getChild(path) {
      if (path === "") {
        return this;
      }

      var parts = path.split("/");

      for (var i in this.children) {
        var child = this.children[i];

        if (child._isMatch(parts[0])) {
          return child.getChild(parts.slice(1).join("/"));
        }
      }

      return null;
    }
  }, {
    key: "getMiddleware",
    value: function getMiddleware() {
      var middleware = this.route.middleware.slice();
      var parentMiddleware = [];

      if (!this.isRoot) {
        parentMiddleware = this.parent.getMiddleware();
      }

      return parentMiddleware.concat(middleware);
    }
  }, {
    key: "_isMatch",
    value: function _isMatch(id) {
      if (this.id.startsWith(":")) {
        try {
          var regexp = new RegExp(this.id);
          return regexp.test(id);
        } catch (e) {
          return true;
        }
      }

      return this.id === id;
    }
  }]);

  return Node;
}();

var Tree =
/*#__PURE__*/
function () {
  function Tree() {
    _classCallCheck(this, Tree);

    this.root = new Node("root", null);
    this.find = this.find.bind(this);
    this.insert = this.insert.bind(this);
  }

  _createClass(Tree, [{
    key: "find",
    value: function find(path) {
      return this.root.getChild(path);
    }
  }, {
    key: "insert",
    value: function insert(path) {
      return this.root.addChild(path);
    }
  }]);

  return Tree;
}();

var Router =
/*#__PURE__*/
function () {
  function Router() {
    _classCallCheck(this, Router);

    this.tree = new Tree();
    this.use = this.use.bind(this);
    this.getHandler = this.getHandler.bind(this);
    this._trimSlash = this._trimSlash.bind(this);
  }

  _createClass(Router, [{
    key: "use",
    value: function use(method, pattern, strategy) {
      var path = this._trimSlash(method.toUpperCase() + "/" + this._trimSlash(pattern));

      var node = this.tree.insert(path);
      node.route = new Route(strategy);

      for (var _len = arguments.length, middleware = new Array(_len > 3 ? _len - 3 : 0), _key = 3; _key < _len; _key++) {
        middleware[_key - 3] = arguments[_key];
      }

      node.route.addMiddleware(middleware);
    }
  }, {
    key: "getHandler",
    value: function getHandler(method, path) {
      var _node$route;

      var node = this.tree.find(this._trimSlash(method.toUpperCase() + "/" + this._trimSlash(path)));

      if (!node) {
        node = this.tree.find(this._trimSlash(method.toUpperCase()));
      }

      if (!node || !node.route) {
        return null;
      }

      return (_node$route = node.route).strategy.apply(_node$route, _toConsumableArray(node.getMiddleware()));
    }
  }, {
    key: "_trimSlash",
    value: function _trimSlash(path) {
      return path.replace(/^\/+|\/+$/g, "");
    }
  }]);

  return Router;
}();

var PeerCDN =
/*#__PURE__*/
function () {
  // If at any point you want to force pages that use this service worker to start using a fresh
  // cache, then increment the cacheVersion value. It will kick off the service worker update
  // flow and the old cache(s) will be purged as part of the activate event handler when the
  // updated service worker is activated.
  function PeerCDN() {
    _classCallCheck(this, PeerCDN);

    this.router = new Router();
    this.register = this.register.bind(this);
    this.GET = this.GET.bind(this);
  } // Register middlewares for a all methods and given route path with one of stategies


  _createClass(PeerCDN, [{
    key: "GET",
    value: function GET(path, strategy) {
      var _this$router;

      for (var _len = arguments.length, middleware = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
        middleware[_key - 2] = arguments[_key];
      }

      (_this$router = this.router).use.apply(_this$router, ['GET', path, strategy].concat(middleware));
    } // Register handlers for given service worker instance

  }, {
    key: "register",
    value: function register() {
      [getInstall()].forEach(function (h) {
        return self.addEventListener("install", h);
      });
      [getActivate()].forEach(function (h) {
        return self.addEventListener("activate", h);
      }); // Register fetch events from array.
      // When an event occurs, they're invoked one at a time, in the order that they're registered.
      // As soon as one handler calls event.respondWith(), none of the other registered handlers will be run.

      [getFetch(this.router)].forEach(function (h) {
        return self.addEventListener("fetch", h);
      });
    }
  }]);

  return PeerCDN;
}();

var Cache =
/*#__PURE__*/
function () {
  function Cache(options) {
    _classCallCheck(this, Cache);

    // Overkill for this single cache example but this is a best practice
    this.names = {
      peerfetch: Cache.peerfetch
    };

    if (options) {
      var version = options.version,
          names = options.names;
      this.names = _objectSpread({
        peerfetch: Cache.peerfetch + version || ""
      }, names || {});
    }

    this.getMiddleware = this.getMiddleware.bind(this);
    this.clearOldCaches = this.clearOldCaches.bind(this);
  } // Middleware factory function for fetch event


  _createClass(Cache, [{
    key: "getMiddleware",
    value: function getMiddleware(event) {
      var _this = this;

      var request = event.request.clone();
      return {
        get: function () {
          var _get = _asyncToGenerator(
          /*#__PURE__*/
          _regeneratorRuntime.mark(function _callee() {
            var response;
            return _regeneratorRuntime.wrap(function _callee$(_context) {
              while (1) {
                switch (_context.prev = _context.next) {
                  case 0:
                    if (!request.headers.has("range")) {
                      _context.next = 2;
                      break;
                    }

                    return _context.abrupt("return", null);

                  case 2:
                    _context.prev = 2;
                    _context.next = 5;
                    return caches.match(request);

                  case 5:
                    response = _context.sent;

                    if (!response) {
                      _context.next = 8;
                      break;
                    }

                    return _context.abrupt("return", response);

                  case 8:
                    return _context.abrupt("return", null);

                  case 11:
                    _context.prev = 11;
                    _context.t0 = _context["catch"](2);
                    return _context.abrupt("return", null);

                  case 14:
                  case "end":
                    return _context.stop();
                }
              }
            }, _callee, null, [[2, 11]]);
          }));

          function get() {
            return _get.apply(this, arguments);
          }

          return get;
        }(),
        put: function put(response) {
          // do not cache ranged responses
          // https://github.com/vardius/peer-cdn/issues/7
          if (request.headers.has("range")) {
            return;
          } // IMPORTANT: Clone the response. A response is a stream
          // and because we want the browser to consume the response
          // as well as the cache consuming the response, we need
          // to clone it so we have two streams.


          var responseToCache = response.clone();
          caches.open(_this.names.peerfetch).then(function (cache) {
            cache.put(request, responseToCache);
          });
        }
      };
    } // Clears old cache, function used in activate event handler

  }, {
    key: "clearOldCaches",
    value: function clearOldCaches() {
      var _this2 = this;

      // Delete all caches that aren't named in CURRENT_CACHES.
      // While there is only one cache in this example, the same logic will handle the case where
      // there are multiple versioned caches.
      var expectedNames = Object.keys(this.names).map(function (key) {
        return _this2.names[key];
      });
      return caches.keys().then(function (cacheNames) {
        return Promise.all(cacheNames.map(function (cacheName) {
          if (expectedNames.indexOf(cacheName) === -1) {
            // If this cache name isn't present in the array of "expected" cache names, then delete it.
            return caches["delete"](cacheName);
          }
        }));
      });
    }
  }]);

  return Cache;
}();

_defineProperty(Cache, "peerfetch", "peerfetch-cache-v");

var MessageClient =
/*#__PURE__*/
function () {
  function MessageClient() {
    var timeoutAfter = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1500;

    _classCallCheck(this, MessageClient);

    this.timeoutAfter = timeoutAfter;
    this.sendMessageToClient = this.sendMessageToClient.bind(this);
    this.sendMessageToAllClients = this.sendMessageToAllClients.bind(this);
  }

  _createClass(MessageClient, [{
    key: "sendMessageToClient",
    value: function () {
      var _sendMessageToClient = _asyncToGenerator(
      /*#__PURE__*/
      _regeneratorRuntime.mark(function _callee(client, message) {
        var _this = this;

        return _regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                if (client) {
                  _context.next = 2;
                  break;
                }

                return _context.abrupt("return", null);

              case 2:
                _context.next = 4;
                return new Promise(function (resolve, reject) {
                  var messageChannel = new MessageChannel();

                  messageChannel.port1.onmessage = function (event) {
                    resolve(event.data || null);
                  };

                  messageChannel.port1.onmessageerror = function (event) {
                    reject(event);
                  }; // This sends the message data as well as transferring messageChannel.port2 to the client.
                  // The client can then use the transferred port to reply via postMessage(), which
                  // will in turn trigger the onmessage handler on messageChannel.port1.
                  // See https://html.spec.whatwg.org/multipage/workers.html#dom-worker-postmessage


                  client.postMessage(message, [messageChannel.port2]); // Set up the timeout

                  setTimeout(function () {
                    messageChannel.port1.close();
                    messageChannel.port2.close();
                    reject('Promise timed out after ' + _this.timeoutAfter + ' ms');
                  }, _this.timeoutAfter);
                });

              case 4:
                return _context.abrupt("return", _context.sent);

              case 5:
              case "end":
                return _context.stop();
            }
          }
        }, _callee);
      }));

      function sendMessageToClient(_x, _x2) {
        return _sendMessageToClient.apply(this, arguments);
      }

      return sendMessageToClient;
    }()
  }, {
    key: "sendMessageToAllClients",
    value: function () {
      var _sendMessageToAllClients = _asyncToGenerator(
      /*#__PURE__*/
      _regeneratorRuntime.mark(function _callee2(message) {
        var _this2 = this;

        var cs;
        return _regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                // eslint-disable-next-line
                cs = clients.matchAll();
                return _context2.abrupt("return", Promise.all(cs.forEach(function (client) {
                  return _this2.sendMessageToclient(client, message);
                })));

              case 2:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2);
      }));

      function sendMessageToAllClients(_x3) {
        return _sendMessageToAllClients.apply(this, arguments);
      }

      return sendMessageToAllClients;
    }()
  }]);

  return MessageClient;
}();

var Delegate =
/*#__PURE__*/
function () {
  function Delegate(options) {
    _classCallCheck(this, Delegate);

    this.timeoutAfter = undefined;

    if (options) {
      var timeoutAfter = options.timeoutAfter;
      this.timeoutAfter = timeoutAfter;
    }

    this.getMiddleware = this.getMiddleware.bind(this);
  } // Middleware factory function for fetch event


  _createClass(Delegate, [{
    key: "getMiddleware",
    value: function getMiddleware(event) {
      var _this = this;

      var request = event.request.clone();
      return {
        get: function () {
          var _get = _asyncToGenerator(
          /*#__PURE__*/
          _regeneratorRuntime.mark(function _callee() {
            var client, msgClient, response;
            return _regeneratorRuntime.wrap(function _callee$(_context) {
              while (1) {
                switch (_context.prev = _context.next) {
                  case 0:
                    if (!request.headers.has("range")) {
                      _context.next = 2;
                      break;
                    }

                    return _context.abrupt("return", null);

                  case 2:
                    if (event.clientId) {
                      _context.next = 4;
                      break;
                    }

                    return _context.abrupt("return", null);

                  case 4:
                    _context.next = 6;
                    return clients.get(event.clientId);

                  case 6:
                    client = _context.sent;
                    msgClient = new MessageClient(_this.timeoutAfter);
                    _context.prev = 8;
                    _context.next = 11;
                    return msgClient.sendMessageToClient(client, {
                      url: request.url
                    });

                  case 11:
                    response = _context.sent;

                    if (!response) {
                      _context.next = 14;
                      break;
                    }

                    return _context.abrupt("return", response);

                  case 14:
                    return _context.abrupt("return", null);

                  case 17:
                    _context.prev = 17;
                    _context.t0 = _context["catch"](8);
                    return _context.abrupt("return", null);

                  case 20:
                  case "end":
                    return _context.stop();
                }
              }
            }, _callee, null, [[8, 17]]);
          }));

          function get() {
            return _get.apply(this, arguments);
          }

          return get;
        }()
      };
    }
  }]);

  return Delegate;
}();

var defaults = {
  servers: {
    iceServers: [{
      // url: "stun:stun.1.google.com:19302"
      url: "stun:74.125.142.127:19302"
    }]
  },
  constraints: {
    ordered: true
  },
  socket: {
    jsonp: false
  }
};
var PeerEventType = {
  PEER: "PEER"
};

var PeerClient =
/*#__PURE__*/
function () {
  function PeerClient() {
    var servers = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : defaults.servers;
    var constraints = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : defaults.constraints;
    var socket = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : defaults.socket;
    var timeoutAfter = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 1500;

    _classCallCheck(this, PeerClient);

    // Timeout after 1500 ms by default
    this.timeoutAfter = timeoutAfter;
    this.match = this.match.bind(this);
    this.sendToRoom = this.sendToRoom.bind(this);
    this.createRoomId = this.createRoomId.bind(this); // setup peer client

    this.peerData = new PeerData__default(servers, constraints); // setup signaling channel

    this.signaling = new PeerData.SocketChannel(socket);
  }

  _createClass(PeerClient, [{
    key: "match",
    value: function match(request) {
      var _this = this;

      return new Promise(function (resolve, reject) {
        var roomId = _this.createRoomId();

        var room = _this.peerData.connect(roomId);

        room.on("participant", function (peer) {
          peer.on("message", function (message) {
            if (!message) {
              return;
            } // todo: handle chunk request
            // https://github.com/vardius/peer-cdn/issues/7


            room.disconnect();
            resolve(message);
          }); // renegotiate if there was an error

          peer.on("error", function () {
            peer.renegotiate();
          });
        });
        var url = new URL(request.url);
        PeerData.EventDispatcher.getInstance().dispatch("send", {
          type: PeerEventType.PEER,
          caller: null,
          callee: null,
          room: {
            id: roomId
          },
          data: url.pathname
        }); // Set up the timeout

        setTimeout(function () {
          room.disconnect();
          reject("Promise timed out after " + _this.timeoutAfter + " ms");
        }, _this.timeoutAfter);
      });
    }
  }, {
    key: "sendToRoom",
    value: function sendToRoom(roomId, response) {
      // signaling server needs us to seed
      // we will connected to a given room
      var room = this.peerData.connect(roomId);
      room.on("participant", function (participant) {
        return participant.then(function (peer) {
          //this peer disconnected from room
          peer.on("disconnected", function () {
            room.disconnect();
          }); // send the response

          peer.send(response);
        });
      });
    }
  }, {
    key: "createRoomId",
    value: function createRoomId() {
      var dt = new Date().getTime();
      var uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
        var r = (dt + Math.random() * 16) % 16 | 0;
        dt = Math.floor(dt / 16);
        return (c == "x" ? r : r & 0x3 | 0x8).toString(16);
      });
      return uuid;
    }
  }]);

  return PeerClient;
}();

var Peer =
/*#__PURE__*/
function () {
  function Peer(options) {
    _classCallCheck(this, Peer);

    if (!options) {
      throw new Error('cacheName option is required');
    }

    var cacheName = options.cacheName,
        servers = options.servers,
        constraints = options.constraints,
        socket = options.socket,
        timeoutAfter = options.timeoutAfter; // cache name to get the response from

    this.cacheName = cacheName;
    this.client = new PeerClient(servers, constraints, socket, timeoutAfter);
    this.getMiddleware = this.getMiddleware.bind(this);
    PeerData.EventDispatcher.getInstance().register(PeerEventType.PEER, this._onPeerRequest.bind(this));
  } // Middleware factory function for fetch event


  _createClass(Peer, [{
    key: "getMiddleware",
    value: function getMiddleware(event) {
      var _this = this;

      var request = event.request.clone();
      return {
        get: function () {
          var _get = _asyncToGenerator(
          /*#__PURE__*/
          _regeneratorRuntime.mark(function _callee() {
            var response;
            return _regeneratorRuntime.wrap(function _callee$(_context) {
              while (1) {
                switch (_context.prev = _context.next) {
                  case 0:
                    if (!request.headers.has("range")) {
                      _context.next = 2;
                      break;
                    }

                    return _context.abrupt("return", null);

                  case 2:
                    _context.prev = 2;
                    _context.next = 5;
                    return _this.client.match(request);

                  case 5:
                    response = _context.sent;

                    if (!response) {
                      _context.next = 8;
                      break;
                    }

                    return _context.abrupt("return", response);

                  case 8:
                    return _context.abrupt("return", null);

                  case 11:
                    _context.prev = 11;
                    _context.t0 = _context["catch"](2);
                    return _context.abrupt("return", null);

                  case 14:
                  case "end":
                    return _context.stop();
                }
              }
            }, _callee, null, [[2, 11]]);
          }));

          function get() {
            return _get.apply(this, arguments);
          }

          return get;
        }()
      };
    }
  }, {
    key: "_onPeerRequest",
    value: function _onPeerRequest(e) {
      var _this2 = this;

      // caches.match() will look for a cache entry in all of the caches available to the service worker.
      caches.open(this.cacheName).then(function (cache) {
        cache.match(e.data).then(function (response) {
          if (response) {
            _this2.client.sendToRoom(e.room.id, response);
          }
        });
      });
    }
  }]);

  return Peer;
}();

var Network =
/*#__PURE__*/
function () {
  function Network() {
    _classCallCheck(this, Network);

    this.getMiddleware = this.getMiddleware.bind(this);
  } // Middleware factory function for fetch event


  _createClass(Network, [{
    key: "getMiddleware",
    value: function getMiddleware(event) {
      var request = event.request.clone();
      return {
        get: function () {
          var _get = _asyncToGenerator(
          /*#__PURE__*/
          _regeneratorRuntime.mark(function _callee() {
            return _regeneratorRuntime.wrap(function _callee$(_context) {
              while (1) {
                switch (_context.prev = _context.next) {
                  case 0:
                    _context.next = 2;
                    return fetch(request);

                  case 2:
                    return _context.abrupt("return", _context.sent);

                  case 3:
                  case "end":
                    return _context.stop();
                }
              }
            }, _callee);
          }));

          function get() {
            return _get.apply(this, arguments);
          }

          return get;
        }()
      };
    }
  }]);

  return Network;
}();

var middleware = new Middleware();
var STRATEGIES = {
  fastest: middleware.applyFastest,
  ordered: middleware.applyOrdered
};
self.PeerCDN = PeerCDN;
self.STRATEGIES = STRATEGIES;
self.CachePlugin = Cache;
self.PeerPlugin = Peer;
self.DelegatePlugin = Delegate;
self.NetworkPlugin = Network;

exports.CachePlugin = Cache;
exports.DelegatePlugin = Delegate;
exports.NetworkPlugin = Network;
exports.PeerPlugin = Peer;
exports.STRATEGIES = STRATEGIES;
exports.default = PeerCDN;
