(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = global || self, factory(global['peer-cdn'] = {}));
}(this, (function (exports) { 'use strict';

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  var classCallCheck = _classCallCheck;

  function _defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    return Constructor;
  }

  var createClass = _createClass;

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

  function _arrayLikeToArray(arr, len) {
    if (len == null || len > arr.length) len = arr.length;

    for (var i = 0, arr2 = new Array(len); i < len; i++) {
      arr2[i] = arr[i];
    }

    return arr2;
  }

  var arrayLikeToArray = _arrayLikeToArray;

  function _arrayWithoutHoles(arr) {
    if (Array.isArray(arr)) return arrayLikeToArray(arr);
  }

  var arrayWithoutHoles = _arrayWithoutHoles;

  function _iterableToArray(iter) {
    if (typeof Symbol !== "undefined" && Symbol.iterator in Object(iter)) return Array.from(iter);
  }

  var iterableToArray = _iterableToArray;

  function _unsupportedIterableToArray(o, minLen) {
    if (!o) return;
    if (typeof o === "string") return arrayLikeToArray(o, minLen);
    var n = Object.prototype.toString.call(o).slice(8, -1);
    if (n === "Object" && o.constructor) n = o.constructor.name;
    if (n === "Map" || n === "Set") return Array.from(o);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return arrayLikeToArray(o, minLen);
  }

  var unsupportedIterableToArray = _unsupportedIterableToArray;

  function _nonIterableSpread() {
    throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }

  var nonIterableSpread = _nonIterableSpread;

  function _toConsumableArray(arr) {
    return arrayWithoutHoles(arr) || iterableToArray(arr) || unsupportedIterableToArray(arr) || nonIterableSpread();
  }

  var toConsumableArray = _toConsumableArray;

  function createCommonjsModule(fn, module) {
  	return module = { exports: {} }, fn(module, module.exports), module.exports;
  }

  var runtime_1 = createCommonjsModule(function (module) {
  /**
   * Copyright (c) 2014-present, Facebook, Inc.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   */

  var runtime = (function (exports) {

    var Op = Object.prototype;
    var hasOwn = Op.hasOwnProperty;
    var undefined$1; // More compressible than void 0.
    var $Symbol = typeof Symbol === "function" ? Symbol : {};
    var iteratorSymbol = $Symbol.iterator || "@@iterator";
    var asyncIteratorSymbol = $Symbol.asyncIterator || "@@asyncIterator";
    var toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag";

    function wrap(innerFn, outerFn, self, tryLocsList) {
      // If outerFn provided and outerFn.prototype is a Generator, then outerFn.prototype instanceof Generator.
      var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator;
      var generator = Object.create(protoGenerator.prototype);
      var context = new Context(tryLocsList || []);

      // The ._invoke method unifies the implementations of the .next,
      // .throw, and .return methods.
      generator._invoke = makeInvokeMethod(innerFn, self, context);

      return generator;
    }
    exports.wrap = wrap;

    // Try/catch helper to minimize deoptimizations. Returns a completion
    // record like context.tryEntries[i].completion. This interface could
    // have been (and was previously) designed to take a closure to be
    // invoked without arguments, but in all the cases we care about we
    // already have an existing method we want to call, so there's no need
    // to create a new function object. We can even get away with assuming
    // the method takes exactly one argument, since that happens to be true
    // in every case, so we don't have to touch the arguments object. The
    // only additional allocation required is the completion record, which
    // has a stable shape and so hopefully should be cheap to allocate.
    function tryCatch(fn, obj, arg) {
      try {
        return { type: "normal", arg: fn.call(obj, arg) };
      } catch (err) {
        return { type: "throw", arg: err };
      }
    }

    var GenStateSuspendedStart = "suspendedStart";
    var GenStateSuspendedYield = "suspendedYield";
    var GenStateExecuting = "executing";
    var GenStateCompleted = "completed";

    // Returning this object from the innerFn has the same effect as
    // breaking out of the dispatch switch statement.
    var ContinueSentinel = {};

    // Dummy constructor functions that we use as the .constructor and
    // .constructor.prototype properties for functions that return Generator
    // objects. For full spec compliance, you may wish to configure your
    // minifier not to mangle the names of these two functions.
    function Generator() {}
    function GeneratorFunction() {}
    function GeneratorFunctionPrototype() {}

    // This is a polyfill for %IteratorPrototype% for environments that
    // don't natively support it.
    var IteratorPrototype = {};
    IteratorPrototype[iteratorSymbol] = function () {
      return this;
    };

    var getProto = Object.getPrototypeOf;
    var NativeIteratorPrototype = getProto && getProto(getProto(values([])));
    if (NativeIteratorPrototype &&
        NativeIteratorPrototype !== Op &&
        hasOwn.call(NativeIteratorPrototype, iteratorSymbol)) {
      // This environment has a native %IteratorPrototype%; use it instead
      // of the polyfill.
      IteratorPrototype = NativeIteratorPrototype;
    }

    var Gp = GeneratorFunctionPrototype.prototype =
      Generator.prototype = Object.create(IteratorPrototype);
    GeneratorFunction.prototype = Gp.constructor = GeneratorFunctionPrototype;
    GeneratorFunctionPrototype.constructor = GeneratorFunction;
    GeneratorFunctionPrototype[toStringTagSymbol] =
      GeneratorFunction.displayName = "GeneratorFunction";

    // Helper for defining the .next, .throw, and .return methods of the
    // Iterator interface in terms of a single ._invoke method.
    function defineIteratorMethods(prototype) {
      ["next", "throw", "return"].forEach(function(method) {
        prototype[method] = function(arg) {
          return this._invoke(method, arg);
        };
      });
    }

    exports.isGeneratorFunction = function(genFun) {
      var ctor = typeof genFun === "function" && genFun.constructor;
      return ctor
        ? ctor === GeneratorFunction ||
          // For the native GeneratorFunction constructor, the best we can
          // do is to check its .name property.
          (ctor.displayName || ctor.name) === "GeneratorFunction"
        : false;
    };

    exports.mark = function(genFun) {
      if (Object.setPrototypeOf) {
        Object.setPrototypeOf(genFun, GeneratorFunctionPrototype);
      } else {
        genFun.__proto__ = GeneratorFunctionPrototype;
        if (!(toStringTagSymbol in genFun)) {
          genFun[toStringTagSymbol] = "GeneratorFunction";
        }
      }
      genFun.prototype = Object.create(Gp);
      return genFun;
    };

    // Within the body of any async function, `await x` is transformed to
    // `yield regeneratorRuntime.awrap(x)`, so that the runtime can test
    // `hasOwn.call(value, "__await")` to determine if the yielded value is
    // meant to be awaited.
    exports.awrap = function(arg) {
      return { __await: arg };
    };

    function AsyncIterator(generator, PromiseImpl) {
      function invoke(method, arg, resolve, reject) {
        var record = tryCatch(generator[method], generator, arg);
        if (record.type === "throw") {
          reject(record.arg);
        } else {
          var result = record.arg;
          var value = result.value;
          if (value &&
              typeof value === "object" &&
              hasOwn.call(value, "__await")) {
            return PromiseImpl.resolve(value.__await).then(function(value) {
              invoke("next", value, resolve, reject);
            }, function(err) {
              invoke("throw", err, resolve, reject);
            });
          }

          return PromiseImpl.resolve(value).then(function(unwrapped) {
            // When a yielded Promise is resolved, its final value becomes
            // the .value of the Promise<{value,done}> result for the
            // current iteration.
            result.value = unwrapped;
            resolve(result);
          }, function(error) {
            // If a rejected Promise was yielded, throw the rejection back
            // into the async generator function so it can be handled there.
            return invoke("throw", error, resolve, reject);
          });
        }
      }

      var previousPromise;

      function enqueue(method, arg) {
        function callInvokeWithMethodAndArg() {
          return new PromiseImpl(function(resolve, reject) {
            invoke(method, arg, resolve, reject);
          });
        }

        return previousPromise =
          // If enqueue has been called before, then we want to wait until
          // all previous Promises have been resolved before calling invoke,
          // so that results are always delivered in the correct order. If
          // enqueue has not been called before, then it is important to
          // call invoke immediately, without waiting on a callback to fire,
          // so that the async generator function has the opportunity to do
          // any necessary setup in a predictable way. This predictability
          // is why the Promise constructor synchronously invokes its
          // executor callback, and why async functions synchronously
          // execute code before the first await. Since we implement simple
          // async functions in terms of async generators, it is especially
          // important to get this right, even though it requires care.
          previousPromise ? previousPromise.then(
            callInvokeWithMethodAndArg,
            // Avoid propagating failures to Promises returned by later
            // invocations of the iterator.
            callInvokeWithMethodAndArg
          ) : callInvokeWithMethodAndArg();
      }

      // Define the unified helper method that is used to implement .next,
      // .throw, and .return (see defineIteratorMethods).
      this._invoke = enqueue;
    }

    defineIteratorMethods(AsyncIterator.prototype);
    AsyncIterator.prototype[asyncIteratorSymbol] = function () {
      return this;
    };
    exports.AsyncIterator = AsyncIterator;

    // Note that simple async functions are implemented on top of
    // AsyncIterator objects; they just return a Promise for the value of
    // the final result produced by the iterator.
    exports.async = function(innerFn, outerFn, self, tryLocsList, PromiseImpl) {
      if (PromiseImpl === void 0) PromiseImpl = Promise;

      var iter = new AsyncIterator(
        wrap(innerFn, outerFn, self, tryLocsList),
        PromiseImpl
      );

      return exports.isGeneratorFunction(outerFn)
        ? iter // If outerFn is a generator, return the full iterator.
        : iter.next().then(function(result) {
            return result.done ? result.value : iter.next();
          });
    };

    function makeInvokeMethod(innerFn, self, context) {
      var state = GenStateSuspendedStart;

      return function invoke(method, arg) {
        if (state === GenStateExecuting) {
          throw new Error("Generator is already running");
        }

        if (state === GenStateCompleted) {
          if (method === "throw") {
            throw arg;
          }

          // Be forgiving, per 25.3.3.3.3 of the spec:
          // https://people.mozilla.org/~jorendorff/es6-draft.html#sec-generatorresume
          return doneResult();
        }

        context.method = method;
        context.arg = arg;

        while (true) {
          var delegate = context.delegate;
          if (delegate) {
            var delegateResult = maybeInvokeDelegate(delegate, context);
            if (delegateResult) {
              if (delegateResult === ContinueSentinel) continue;
              return delegateResult;
            }
          }

          if (context.method === "next") {
            // Setting context._sent for legacy support of Babel's
            // function.sent implementation.
            context.sent = context._sent = context.arg;

          } else if (context.method === "throw") {
            if (state === GenStateSuspendedStart) {
              state = GenStateCompleted;
              throw context.arg;
            }

            context.dispatchException(context.arg);

          } else if (context.method === "return") {
            context.abrupt("return", context.arg);
          }

          state = GenStateExecuting;

          var record = tryCatch(innerFn, self, context);
          if (record.type === "normal") {
            // If an exception is thrown from innerFn, we leave state ===
            // GenStateExecuting and loop back for another invocation.
            state = context.done
              ? GenStateCompleted
              : GenStateSuspendedYield;

            if (record.arg === ContinueSentinel) {
              continue;
            }

            return {
              value: record.arg,
              done: context.done
            };

          } else if (record.type === "throw") {
            state = GenStateCompleted;
            // Dispatch the exception by looping back around to the
            // context.dispatchException(context.arg) call above.
            context.method = "throw";
            context.arg = record.arg;
          }
        }
      };
    }

    // Call delegate.iterator[context.method](context.arg) and handle the
    // result, either by returning a { value, done } result from the
    // delegate iterator, or by modifying context.method and context.arg,
    // setting context.delegate to null, and returning the ContinueSentinel.
    function maybeInvokeDelegate(delegate, context) {
      var method = delegate.iterator[context.method];
      if (method === undefined$1) {
        // A .throw or .return when the delegate iterator has no .throw
        // method always terminates the yield* loop.
        context.delegate = null;

        if (context.method === "throw") {
          // Note: ["return"] must be used for ES3 parsing compatibility.
          if (delegate.iterator["return"]) {
            // If the delegate iterator has a return method, give it a
            // chance to clean up.
            context.method = "return";
            context.arg = undefined$1;
            maybeInvokeDelegate(delegate, context);

            if (context.method === "throw") {
              // If maybeInvokeDelegate(context) changed context.method from
              // "return" to "throw", let that override the TypeError below.
              return ContinueSentinel;
            }
          }

          context.method = "throw";
          context.arg = new TypeError(
            "The iterator does not provide a 'throw' method");
        }

        return ContinueSentinel;
      }

      var record = tryCatch(method, delegate.iterator, context.arg);

      if (record.type === "throw") {
        context.method = "throw";
        context.arg = record.arg;
        context.delegate = null;
        return ContinueSentinel;
      }

      var info = record.arg;

      if (! info) {
        context.method = "throw";
        context.arg = new TypeError("iterator result is not an object");
        context.delegate = null;
        return ContinueSentinel;
      }

      if (info.done) {
        // Assign the result of the finished delegate to the temporary
        // variable specified by delegate.resultName (see delegateYield).
        context[delegate.resultName] = info.value;

        // Resume execution at the desired location (see delegateYield).
        context.next = delegate.nextLoc;

        // If context.method was "throw" but the delegate handled the
        // exception, let the outer generator proceed normally. If
        // context.method was "next", forget context.arg since it has been
        // "consumed" by the delegate iterator. If context.method was
        // "return", allow the original .return call to continue in the
        // outer generator.
        if (context.method !== "return") {
          context.method = "next";
          context.arg = undefined$1;
        }

      } else {
        // Re-yield the result returned by the delegate method.
        return info;
      }

      // The delegate iterator is finished, so forget it and continue with
      // the outer generator.
      context.delegate = null;
      return ContinueSentinel;
    }

    // Define Generator.prototype.{next,throw,return} in terms of the
    // unified ._invoke helper method.
    defineIteratorMethods(Gp);

    Gp[toStringTagSymbol] = "Generator";

    // A Generator should always return itself as the iterator object when the
    // @@iterator function is called on it. Some browsers' implementations of the
    // iterator prototype chain incorrectly implement this, causing the Generator
    // object to not be returned from this call. This ensures that doesn't happen.
    // See https://github.com/facebook/regenerator/issues/274 for more details.
    Gp[iteratorSymbol] = function() {
      return this;
    };

    Gp.toString = function() {
      return "[object Generator]";
    };

    function pushTryEntry(locs) {
      var entry = { tryLoc: locs[0] };

      if (1 in locs) {
        entry.catchLoc = locs[1];
      }

      if (2 in locs) {
        entry.finallyLoc = locs[2];
        entry.afterLoc = locs[3];
      }

      this.tryEntries.push(entry);
    }

    function resetTryEntry(entry) {
      var record = entry.completion || {};
      record.type = "normal";
      delete record.arg;
      entry.completion = record;
    }

    function Context(tryLocsList) {
      // The root entry object (effectively a try statement without a catch
      // or a finally block) gives us a place to store values thrown from
      // locations where there is no enclosing try statement.
      this.tryEntries = [{ tryLoc: "root" }];
      tryLocsList.forEach(pushTryEntry, this);
      this.reset(true);
    }

    exports.keys = function(object) {
      var keys = [];
      for (var key in object) {
        keys.push(key);
      }
      keys.reverse();

      // Rather than returning an object with a next method, we keep
      // things simple and return the next function itself.
      return function next() {
        while (keys.length) {
          var key = keys.pop();
          if (key in object) {
            next.value = key;
            next.done = false;
            return next;
          }
        }

        // To avoid creating an additional object, we just hang the .value
        // and .done properties off the next function object itself. This
        // also ensures that the minifier will not anonymize the function.
        next.done = true;
        return next;
      };
    };

    function values(iterable) {
      if (iterable) {
        var iteratorMethod = iterable[iteratorSymbol];
        if (iteratorMethod) {
          return iteratorMethod.call(iterable);
        }

        if (typeof iterable.next === "function") {
          return iterable;
        }

        if (!isNaN(iterable.length)) {
          var i = -1, next = function next() {
            while (++i < iterable.length) {
              if (hasOwn.call(iterable, i)) {
                next.value = iterable[i];
                next.done = false;
                return next;
              }
            }

            next.value = undefined$1;
            next.done = true;

            return next;
          };

          return next.next = next;
        }
      }

      // Return an iterator with no values.
      return { next: doneResult };
    }
    exports.values = values;

    function doneResult() {
      return { value: undefined$1, done: true };
    }

    Context.prototype = {
      constructor: Context,

      reset: function(skipTempReset) {
        this.prev = 0;
        this.next = 0;
        // Resetting context._sent for legacy support of Babel's
        // function.sent implementation.
        this.sent = this._sent = undefined$1;
        this.done = false;
        this.delegate = null;

        this.method = "next";
        this.arg = undefined$1;

        this.tryEntries.forEach(resetTryEntry);

        if (!skipTempReset) {
          for (var name in this) {
            // Not sure about the optimal order of these conditions:
            if (name.charAt(0) === "t" &&
                hasOwn.call(this, name) &&
                !isNaN(+name.slice(1))) {
              this[name] = undefined$1;
            }
          }
        }
      },

      stop: function() {
        this.done = true;

        var rootEntry = this.tryEntries[0];
        var rootRecord = rootEntry.completion;
        if (rootRecord.type === "throw") {
          throw rootRecord.arg;
        }

        return this.rval;
      },

      dispatchException: function(exception) {
        if (this.done) {
          throw exception;
        }

        var context = this;
        function handle(loc, caught) {
          record.type = "throw";
          record.arg = exception;
          context.next = loc;

          if (caught) {
            // If the dispatched exception was caught by a catch block,
            // then let that catch block handle the exception normally.
            context.method = "next";
            context.arg = undefined$1;
          }

          return !! caught;
        }

        for (var i = this.tryEntries.length - 1; i >= 0; --i) {
          var entry = this.tryEntries[i];
          var record = entry.completion;

          if (entry.tryLoc === "root") {
            // Exception thrown outside of any try block that could handle
            // it, so set the completion value of the entire function to
            // throw the exception.
            return handle("end");
          }

          if (entry.tryLoc <= this.prev) {
            var hasCatch = hasOwn.call(entry, "catchLoc");
            var hasFinally = hasOwn.call(entry, "finallyLoc");

            if (hasCatch && hasFinally) {
              if (this.prev < entry.catchLoc) {
                return handle(entry.catchLoc, true);
              } else if (this.prev < entry.finallyLoc) {
                return handle(entry.finallyLoc);
              }

            } else if (hasCatch) {
              if (this.prev < entry.catchLoc) {
                return handle(entry.catchLoc, true);
              }

            } else if (hasFinally) {
              if (this.prev < entry.finallyLoc) {
                return handle(entry.finallyLoc);
              }

            } else {
              throw new Error("try statement without catch or finally");
            }
          }
        }
      },

      abrupt: function(type, arg) {
        for (var i = this.tryEntries.length - 1; i >= 0; --i) {
          var entry = this.tryEntries[i];
          if (entry.tryLoc <= this.prev &&
              hasOwn.call(entry, "finallyLoc") &&
              this.prev < entry.finallyLoc) {
            var finallyEntry = entry;
            break;
          }
        }

        if (finallyEntry &&
            (type === "break" ||
             type === "continue") &&
            finallyEntry.tryLoc <= arg &&
            arg <= finallyEntry.finallyLoc) {
          // Ignore the finally entry if control is not jumping to a
          // location outside the try/catch block.
          finallyEntry = null;
        }

        var record = finallyEntry ? finallyEntry.completion : {};
        record.type = type;
        record.arg = arg;

        if (finallyEntry) {
          this.method = "next";
          this.next = finallyEntry.finallyLoc;
          return ContinueSentinel;
        }

        return this.complete(record);
      },

      complete: function(record, afterLoc) {
        if (record.type === "throw") {
          throw record.arg;
        }

        if (record.type === "break" ||
            record.type === "continue") {
          this.next = record.arg;
        } else if (record.type === "return") {
          this.rval = this.arg = record.arg;
          this.method = "return";
          this.next = "end";
        } else if (record.type === "normal" && afterLoc) {
          this.next = afterLoc;
        }

        return ContinueSentinel;
      },

      finish: function(finallyLoc) {
        for (var i = this.tryEntries.length - 1; i >= 0; --i) {
          var entry = this.tryEntries[i];
          if (entry.finallyLoc === finallyLoc) {
            this.complete(entry.completion, entry.afterLoc);
            resetTryEntry(entry);
            return ContinueSentinel;
          }
        }
      },

      "catch": function(tryLoc) {
        for (var i = this.tryEntries.length - 1; i >= 0; --i) {
          var entry = this.tryEntries[i];
          if (entry.tryLoc === tryLoc) {
            var record = entry.completion;
            if (record.type === "throw") {
              var thrown = record.arg;
              resetTryEntry(entry);
            }
            return thrown;
          }
        }

        // The context.catch method must only be called with a location
        // argument that corresponds to a known catch block.
        throw new Error("illegal catch attempt");
      },

      delegateYield: function(iterable, resultName, nextLoc) {
        this.delegate = {
          iterator: values(iterable),
          resultName: resultName,
          nextLoc: nextLoc
        };

        if (this.method === "next") {
          // Deliberately forget the last sent value so that we don't
          // accidentally pass it on to the delegate.
          this.arg = undefined$1;
        }

        return ContinueSentinel;
      }
    };

    // Regardless of whether this script is executing as a CommonJS module
    // or not, return the runtime object so that we can declare the variable
    // regeneratorRuntime in the outer scope, which allows this module to be
    // injected easily by `bin/regenerator --include-runtime script.js`.
    return exports;

  }(
    // If this script is executing as a CommonJS module, use module.exports
    // as the regeneratorRuntime namespace. Otherwise create a new empty
    // object. Either way, the resulting object will be used to initialize
    // the regeneratorRuntime variable at the top of this file.
     module.exports 
  ));

  try {
    regeneratorRuntime = runtime;
  } catch (accidentalStrictMode) {
    // This module should not be running in strict mode, so the above
    // assignment should always work unless something is misconfigured. Just
    // in case runtime.js accidentally runs in strict mode, we can escape
    // strict mode using a global Function call. This could conceivably fail
    // if a Content Security Policy forbids using Function, but in that case
    // the proper solution is to fix the accidental strict mode problem. If
    // you've misconfigured your bundler to force strict mode and applied a
    // CSP to forbid Function, and you're not willing to fix either of those
    // problems, please detail your unique predicament in a GitHub issue.
    Function("r", "regeneratorRuntime = r")(runtime);
  }
  });

  var regenerator = runtime_1;

  function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
    try {
      var info = gen[key](arg);
      var value = info.value;
    } catch (error) {
      reject(error);
      return;
    }

    if (info.done) {
      resolve(value);
    } else {
      Promise.resolve(value).then(_next, _throw);
    }
  }

  function _asyncToGenerator(fn) {
    return function () {
      var self = this,
          args = arguments;
      return new Promise(function (resolve, reject) {
        var gen = fn.apply(self, args);

        function _next(value) {
          asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);
        }

        function _throw(err) {
          asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);
        }

        _next(undefined);
      });
    };
  }

  var asyncToGenerator = _asyncToGenerator;

  var Middleware = /*#__PURE__*/function () {
    function Middleware() {
      classCallCheck(this, Middleware);

      this.applyFastest = this.applyFastest.bind(this);
      this.applyOrdered = this.applyOrdered.bind(this);
      this._composePlugins = this._composePlugins.bind(this);
      this._composeHandlers = this._composeHandlers.bind(this);
    } // Apply middleware fastest win


    createClass(Middleware, [{
      key: "applyFastest",
      value: function applyFastest() {
        var _this = this;

        for (var _len = arguments.length, middleware = new Array(_len), _key = 0; _key < _len; _key++) {
          middleware[_key] = arguments[_key];
        }

        return /*#__PURE__*/function () {
          var _ref = asyncToGenerator( /*#__PURE__*/regenerator.mark(function _callee(request) {
            var puts, response;
            return regenerator.wrap(function _callee$(_context) {
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
        }();
      } // Apply middleware in order

    }, {
      key: "applyOrdered",
      value: function applyOrdered() {
        var _this2 = this;

        for (var _len2 = arguments.length, middleware = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
          middleware[_key2] = arguments[_key2];
        }

        return /*#__PURE__*/function () {
          var _ref2 = asyncToGenerator( /*#__PURE__*/regenerator.mark(function _callee2(request) {
            var composed, response;
            return regenerator.wrap(function _callee2$(_context2) {
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

                    if (!composed.put) {
                      _context2.next = 9;
                      break;
                    }

                    _context2.next = 9;
                    return composed.put(response);

                  case 9:
                    return _context2.abrupt("return", response);

                  case 10:
                  case "end":
                    return _context2.stop();
                }
              }
            }, _callee2);
          }));

          return function (_x2) {
            return _ref2.apply(this, arguments);
          };
        }();
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
          return /*#__PURE__*/function () {
            var _ref3 = asyncToGenerator( /*#__PURE__*/regenerator.mark(function _callee3(request) {
              var x, response, y;
              return regenerator.wrap(function _callee3$(_context3) {
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
                        _context3.next = 11;
                        break;
                      }

                      if (!x.put) {
                        _context3.next = 10;
                        break;
                      }

                      _context3.next = 10;
                      return x.put(response);

                    case 10:
                      return _context3.abrupt("return", {
                        get: function get() {
                          return response;
                        }
                      });

                    case 11:
                      _context3.next = 13;
                      return b(request);

                    case 13:
                      y = _context3.sent;
                      _context3.next = 16;
                      return y.get();

                    case 16:
                      response = _context3.sent;
                      return _context3.abrupt("return", {
                        get: function get() {
                          return response;
                        },
                        put: _this3._composeHandlers(y.put, x.put)
                      });

                    case 18:
                    case "end":
                      return _context3.stop();
                  }
                }
              }, _callee3);
            }));

            return function (_x3) {
              return _ref3.apply(this, arguments);
            };
          }();
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
          return /*#__PURE__*/asyncToGenerator( /*#__PURE__*/regenerator.mark(function _callee4() {
            var _args4 = arguments;
            return regenerator.wrap(function _callee4$(_context4) {
              while (1) {
                switch (_context4.prev = _context4.next) {
                  case 0:
                    if (!(typeof func === "function")) {
                      _context4.next = 3;
                      break;
                    }

                    _context4.next = 3;
                    return func.apply(void 0, _args4);

                  case 3:
                  case "end":
                    return _context4.stop();
                }
              }
            }, _callee4);
          }));
        });
        return funcs.reduce(function (a, b) {
          return /*#__PURE__*/asyncToGenerator( /*#__PURE__*/regenerator.mark(function _callee5() {
            var _args5 = arguments;
            return regenerator.wrap(function _callee5$(_context5) {
              while (1) {
                switch (_context5.prev = _context5.next) {
                  case 0:
                    _context5.next = 2;
                    return a.apply(void 0, _args5);

                  case 2:
                    _context5.next = 4;
                    return b.apply(void 0, _args5);

                  case 4:
                  case "end":
                    return _context5.stop();
                }
              }
            }, _callee5);
          }));
        });
      }
    }]);

    return Middleware;
  }();

  var Route = /*#__PURE__*/function () {
    function Route(strategy) {
      classCallCheck(this, Route);

      this.strategy = strategy || new Middleware().applyOrdered;
      this.middleware = [];
      this.addMiddleware = this.addMiddleware.bind(this);
    }

    createClass(Route, [{
      key: "addMiddleware",
      value: function addMiddleware(middleware) {
        this.middleware = this.middleware.concat(middleware);
      }
    }]);

    return Route;
  }();

  var Node = /*#__PURE__*/function () {
    function Node(id) {
      var parent = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

      classCallCheck(this, Node);

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

    createClass(Node, [{
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

  var Tree = /*#__PURE__*/function () {
    function Tree() {
      classCallCheck(this, Tree);

      this.root = new Node("root", null);
      this.find = this.find.bind(this);
      this.insert = this.insert.bind(this);
    }

    createClass(Tree, [{
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

  var Router = /*#__PURE__*/function () {
    function Router() {
      classCallCheck(this, Router);

      this.tree = new Tree();
      this.use = this.use.bind(this);
      this.getHandler = this.getHandler.bind(this);
      this._trimSlash = this._trimSlash.bind(this);
    }

    createClass(Router, [{
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

        return (_node$route = node.route).strategy.apply(_node$route, toConsumableArray(node.getMiddleware()));
      }
    }, {
      key: "_trimSlash",
      value: function _trimSlash(path) {
        return path.replace(/^\/+|\/+$/g, "");
      }
    }]);

    return Router;
  }();

  var PeerCDN = /*#__PURE__*/function () {
    // If at any point you want to force pages that use this service worker to start using a fresh
    // cache, then increment the cacheVersion value. It will kick off the service worker update
    // flow and the old cache(s) will be purged as part of the activate event handler when the
    // updated service worker is activated.
    function PeerCDN() {
      classCallCheck(this, PeerCDN);

      this.router = new Router();
      this.register = this.register.bind(this);
      this.GET = this.GET.bind(this);
    } // Register middleware for a GET method and given route path with one of strategies


    createClass(PeerCDN, [{
      key: "GET",
      value: function GET(path, strategy) {
        var _this$router;

        for (var _len = arguments.length, middleware = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
          middleware[_key - 2] = arguments[_key];
        }

        (_this$router = this.router).use.apply(_this$router, ["GET", path, strategy].concat(middleware));
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

  function _defineProperty(obj, key, value) {
    if (key in obj) {
      Object.defineProperty(obj, key, {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
      });
    } else {
      obj[key] = value;
    }

    return obj;
  }

  var defineProperty = _defineProperty;

  function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

  function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

  var Cache = /*#__PURE__*/function () {
    function Cache(options) {
      classCallCheck(this, Cache);

      // Overkill for this single cache example but this is a best practice
      this.names = {
        peerFetch: Cache.peerFetch
      };

      if (options) {
        var version = options.version,
            names = options.names;
        this.names = _objectSpread({
          peerFetch: Cache.peerFetch + version || ""
        }, names || {});
      }

      this.getMiddleware = this.getMiddleware.bind(this);
      this.clearOldCaches = this.clearOldCaches.bind(this);
      this._createPartialResponse = this._createPartialResponse.bind(this);
      this._parseRangeHeader = this._parseRangeHeader.bind(this);
      this._calculateEffectiveBoundaries = this._calculateEffectiveBoundaries.bind(this);
    } // Middleware factory function for fetch event


    createClass(Cache, [{
      key: "getMiddleware",
      value: function getMiddleware(event) {
        var _this = this;

        var request = event.request.clone();
        return {
          get: function () {
            var _get = asyncToGenerator( /*#__PURE__*/regenerator.mark(function _callee() {
              var response;
              return regenerator.wrap(function _callee$(_context) {
                while (1) {
                  switch (_context.prev = _context.next) {
                    case 0:
                      _context.prev = 0;
                      _context.next = 3;
                      return caches.match(request);

                    case 3:
                      response = _context.sent;

                      if (response) {
                        _context.next = 8;
                        break;
                      }

                      _context.next = 7;
                      return caches.match(request.url);

                    case 7:
                      response = _context.sent;

                    case 8:
                      if (!response) {
                        _context.next = 12;
                        break;
                      }

                      if (!request.headers.has("range")) {
                        _context.next = 11;
                        break;
                      }

                      return _context.abrupt("return", _this._createPartialResponse(request, response));

                    case 11:
                      return _context.abrupt("return", response);

                    case 12:
                      return _context.abrupt("return", null);

                    case 15:
                      _context.prev = 15;
                      _context.t0 = _context["catch"](0);

                      return _context.abrupt("return", null);

                    case 19:
                    case "end":
                      return _context.stop();
                  }
                }
              }, _callee, null, [[0, 15]]);
            }));

            function get() {
              return _get.apply(this, arguments);
            }

            return get;
          }(),
          put: function () {
            var _put = asyncToGenerator( /*#__PURE__*/regenerator.mark(function _callee2(response) {
              var cache, responseToCache;
              return regenerator.wrap(function _callee2$(_context2) {
                while (1) {
                  switch (_context2.prev = _context2.next) {
                    case 0:
                      _context2.prev = 0;
                      _context2.next = 3;
                      return caches.open(_this.names.peerFetch);

                    case 3:
                      cache = _context2.sent;
                      // IMPORTANT: Clone the response. A response is a stream
                      // and because we want the browser to consume the response
                      // as well as the cache consuming the response, we need
                      // to clone it so we have two streams.
                      responseToCache = response.clone();
                      cache.put(request, responseToCache);
                      _context2.next = 11;
                      break;

                    case 8:
                      _context2.prev = 8;
                      _context2.t0 = _context2["catch"](0);

                    case 11:
                    case "end":
                      return _context2.stop();
                  }
                }
              }, _callee2, null, [[0, 8]]);
            }));

            function put(_x) {
              return _put.apply(this, arguments);
            }

            return put;
          }()
        };
      } // Clears old cache, function used in activate event handler

    }, {
      key: "clearOldCaches",
      value: function () {
        var _clearOldCaches = asyncToGenerator( /*#__PURE__*/regenerator.mark(function _callee3() {
          var _this2 = this;

          var expectedNames, cacheNames;
          return regenerator.wrap(function _callee3$(_context3) {
            while (1) {
              switch (_context3.prev = _context3.next) {
                case 0:
                  // Delete all caches that aren't named in CURRENT_CACHES.
                  // While there is only one cache in this example, the same logic will handle the case where
                  // there are multiple versioned caches.
                  expectedNames = Object.keys(this.names).map(function (key) {
                    return _this2.names[key];
                  });
                  _context3.next = 3;
                  return caches.keys();

                case 3:
                  cacheNames = _context3.sent;
                  return _context3.abrupt("return", Promise.all(cacheNames.map(function (cacheName) {
                    if (expectedNames.indexOf(cacheName) === -1) {
                      // If this cache name isn't present in the array of "expected" cache names, then delete it.
                      return caches["delete"](cacheName);
                    }
                  })));

                case 5:
                case "end":
                  return _context3.stop();
              }
            }
          }, _callee3, this);
        }));

        function clearOldCaches() {
          return _clearOldCaches.apply(this, arguments);
        }

        return clearOldCaches;
      }()
    }, {
      key: "_createPartialResponse",
      value: function () {
        var _createPartialResponse2 = asyncToGenerator( /*#__PURE__*/regenerator.mark(function _callee4(request, originalResponse) {
          var rangeHeader, boundaries, originalBlob, effectiveBoundaries, slicedBlob, slicedBlobSize, slicedResponse;
          return regenerator.wrap(function _callee4$(_context4) {
            while (1) {
              switch (_context4.prev = _context4.next) {
                case 0:
                  if (!(originalResponse.status === 206)) {
                    _context4.next = 2;
                    break;
                  }

                  return _context4.abrupt("return", originalResponse);

                case 2:
                  rangeHeader = request.headers.get('range');

                  if (rangeHeader) {
                    _context4.next = 5;
                    break;
                  }

                  throw new Error('no-range-header');

                case 5:
                  boundaries = this._parseRangeHeader(rangeHeader);
                  _context4.next = 8;
                  return originalResponse.blob();

                case 8:
                  originalBlob = _context4.sent;
                  effectiveBoundaries = this._calculateEffectiveBoundaries(originalBlob, boundaries.start, boundaries.end);
                  slicedBlob = originalBlob.slice(effectiveBoundaries.start, effectiveBoundaries.end);
                  slicedBlobSize = slicedBlob.size;
                  slicedResponse = new Response(slicedBlob, {
                    // Status code 206 is for a Partial Content response.
                    // See https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/206
                    status: 206,
                    statusText: 'Partial Content',
                    headers: originalResponse.headers
                  });
                  slicedResponse.headers.set('Content-Length', String(slicedBlobSize));
                  slicedResponse.headers.set('Content-Range', "bytes ".concat(effectiveBoundaries.start, "-").concat(effectiveBoundaries.end - 1, "/") + originalBlob.size);
                  return _context4.abrupt("return", slicedResponse);

                case 16:
                case "end":
                  return _context4.stop();
              }
            }
          }, _callee4, this);
        }));

        function _createPartialResponse(_x2, _x3) {
          return _createPartialResponse2.apply(this, arguments);
        }

        return _createPartialResponse;
      }()
    }, {
      key: "_parseRangeHeader",
      value: function _parseRangeHeader(rangeHeader) {
        var normalizedRangeHeader = rangeHeader.trim().toLowerCase();

        if (!normalizedRangeHeader.startsWith('bytes=')) {
          throw new Error('unit-must-be-bytes', {
            normalizedRangeHeader: normalizedRangeHeader
          });
        } // Specifying multiple ranges separate by commas is valid syntax, but this
        // library only attempts to handle a single, contiguous sequence of bytes.
        // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Range#Syntax


        if (normalizedRangeHeader.includes(',')) {
          throw new Error('single-range-only', {
            normalizedRangeHeader: normalizedRangeHeader
          });
        }

        var rangeParts = /(\d*)-(\d*)/.exec(normalizedRangeHeader); // We need either at least one of the start or end values.

        if (!rangeParts || !(rangeParts[1] || rangeParts[2])) {
          throw new Error('invalid-range-values', {
            normalizedRangeHeader: normalizedRangeHeader
          });
        }

        return {
          start: rangeParts[1] === '' ? undefined : Number(rangeParts[1]),
          end: rangeParts[2] === '' ? undefined : Number(rangeParts[2])
        };
      }
    }, {
      key: "_calculateEffectiveBoundaries",
      value: function _calculateEffectiveBoundaries(blob, start, end) {
        var blobSize = blob.size;

        if (end && end > blobSize || start && start < 0) {
          throw new Error('range-not-satisfiable', {
            size: blobSize,
            end: end,
            start: start
          });
        }

        var effectiveStart;
        var effectiveEnd;

        if (start !== undefined && end !== undefined) {
          effectiveStart = start; // Range values are inclusive, so add 1 to the value.

          effectiveEnd = end + 1;
        } else if (start !== undefined && end === undefined) {
          effectiveStart = start;
          effectiveEnd = blobSize;
        } else if (end !== undefined && start === undefined) {
          effectiveStart = blobSize - end;
          effectiveEnd = blobSize;
        }

        return {
          start: effectiveStart,
          end: effectiveEnd
        };
      }
    }]);

    return Cache;
  }();

  defineProperty(Cache, "peerFetch", "peerfetch-cache-v");

  var MessageClient = /*#__PURE__*/function () {
    function MessageClient() {
      var timeoutAfter = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1500;

      classCallCheck(this, MessageClient);

      this.timeoutAfter = timeoutAfter;
      this.sendMessageToClient = this.sendMessageToClient.bind(this);
      this.sendMessageToAllClients = this.sendMessageToAllClients.bind(this);
    }

    createClass(MessageClient, [{
      key: "sendMessageToClient",
      value: function () {
        var _sendMessageToClient = asyncToGenerator( /*#__PURE__*/regenerator.mark(function _callee(client, message) {
          var _this = this;

          return regenerator.wrap(function _callee$(_context) {
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
        var _sendMessageToAllClients = asyncToGenerator( /*#__PURE__*/regenerator.mark(function _callee2(message) {
          var _this2 = this;

          var cs;
          return regenerator.wrap(function _callee2$(_context2) {
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

  var Delegate = /*#__PURE__*/function () {
    function Delegate(options) {
      classCallCheck(this, Delegate);

      this.timeoutAfter = undefined;

      if (options) {
        var timeoutAfter = options.timeoutAfter;
        this.timeoutAfter = timeoutAfter;
      }

      this.getMiddleware = this.getMiddleware.bind(this);
    } // Middleware factory function for fetch event


    createClass(Delegate, [{
      key: "getMiddleware",
      value: function getMiddleware(event) {
        var _this = this;

        var request = event.request.clone();
        return {
          get: function () {
            var _get = asyncToGenerator( /*#__PURE__*/regenerator.mark(function _callee() {
              var client, msgClient, response;
              return regenerator.wrap(function _callee$(_context) {
                while (1) {
                  switch (_context.prev = _context.next) {
                    case 0:
                      if (event.clientId) {
                        _context.next = 2;
                        break;
                      }

                      return _context.abrupt("return", null);

                    case 2:
                      _context.next = 4;
                      return clients.get(event.clientId);

                    case 4:
                      client = _context.sent;
                      msgClient = new MessageClient(_this.timeoutAfter);
                      _context.prev = 6;
                      _context.next = 9;
                      return msgClient.sendMessageToClient(client, {
                        url: request.url
                      });

                    case 9:
                      response = _context.sent;

                      if (!response) {
                        _context.next = 12;
                        break;
                      }

                      return _context.abrupt("return", response);

                    case 12:
                      return _context.abrupt("return", null);

                    case 15:
                      _context.prev = 15;
                      _context.t0 = _context["catch"](6);

                      return _context.abrupt("return", null);

                    case 19:
                    case "end":
                      return _context.stop();
                  }
                }
              }, _callee, null, [[6, 15]]);
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

  var SignalingEventType;
  (function (SignalingEventType) {
      SignalingEventType["CONNECT"] = "CONNECT";
      SignalingEventType["DISCONNECT"] = "DISCONNECT";
      SignalingEventType["CANDIDATE"] = "CANDIDATE";
      SignalingEventType["OFFER"] = "OFFER";
      SignalingEventType["ANSWER"] = "ANSWER";
      SignalingEventType["ERROR"] = "ERROR";
  })(SignalingEventType || (SignalingEventType = {}));

  var Configuration = /** @class */ (function () {
      function Configuration() {
          var _this = this;
          this.servers = {};
          this.setServers = function (servers) {
              _this.servers = servers;
          };
          this.getServers = function () { return _this.servers; };
          this.setDataConstraints = function (dataConstraints) {
              _this.dataConstraints = dataConstraints;
          };
          this.getDataConstraints = function () { return _this.dataConstraints; };
      }
      return Configuration;
  }());

  // Unique ID creation requires a high quality random # generator. In the browser we therefore
  // require the crypto API and do not support built-in fallback to lower quality random number
  // generators (like Math.random()).
  // getRandomValues needs to be invoked in a context where "this" is a Crypto implementation. Also,
  // find the complete implementation of crypto (msCrypto) on IE11.
  var getRandomValues = typeof crypto !== 'undefined' && crypto.getRandomValues && crypto.getRandomValues.bind(crypto) || typeof msCrypto !== 'undefined' && typeof msCrypto.getRandomValues === 'function' && msCrypto.getRandomValues.bind(msCrypto);
  var rnds8 = new Uint8Array(16);
  function rng() {
    if (!getRandomValues) {
      throw new Error('crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported');
    }

    return getRandomValues(rnds8);
  }

  /**
   * Convert array of 16 byte values to UUID string format of the form:
   * XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
   */
  var byteToHex = [];

  for (var i = 0; i < 256; ++i) {
    byteToHex.push((i + 0x100).toString(16).substr(1));
  }

  function bytesToUuid(buf, offset) {
    var i = offset || 0;
    var bth = byteToHex; // Note: Be careful editing this code!  It's been tuned for performance
    // and works in ways you may not expect. See https://github.com/uuidjs/uuid/pull/434

    return (bth[buf[i + 0]] + bth[buf[i + 1]] + bth[buf[i + 2]] + bth[buf[i + 3]] + '-' + bth[buf[i + 4]] + bth[buf[i + 5]] + '-' + bth[buf[i + 6]] + bth[buf[i + 7]] + '-' + bth[buf[i + 8]] + bth[buf[i + 9]] + '-' + bth[buf[i + 10]] + bth[buf[i + 11]] + bth[buf[i + 12]] + bth[buf[i + 13]] + bth[buf[i + 14]] + bth[buf[i + 15]]).toLowerCase();
  }

  function v4(options, buf, offset) {
    if (typeof options === 'string') {
      buf = options === 'binary' ? new Uint8Array(16) : null;
      options = null;
    }

    options = options || {};
    var rnds = options.random || (options.rng || rng)(); // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`

    rnds[6] = rnds[6] & 0x0f | 0x40;
    rnds[8] = rnds[8] & 0x3f | 0x80; // Copy bytes to buffer, if provided

    if (buf) {
      var start = offset || 0;

      for (var i = 0; i < 16; ++i) {
        buf[start + i] = rnds[i];
      }

      return buf;
    }

    return bytesToUuid(rnds);
  }

  var EventDispatcher = /** @class */ (function () {
      function EventDispatcher() {
          var _this = this;
          this.handlers = {};
          this.register = function (type, callback) {
              if (!_this.handlers[type]) {
                  _this.handlers[type] = [];
              }
              _this.handlers[type].push(callback);
          };
          this.unregister = function (type, callback) {
              if (_this.handlers[type]) {
                  var index = _this.handlers[type].indexOf(callback);
                  if (index !== -1) {
                      delete _this.handlers[type][index];
                  }
              }
          };
          this.dispatch = function (type) {
              var args = [];
              for (var _i = 1; _i < arguments.length; _i++) {
                  args[_i - 1] = arguments[_i];
              }
              if (_this.handlers[type]) {
                  _this.handlers[type].forEach(function (h) { return h.apply(void 0, args); });
              }
          };
      }
      return EventDispatcher;
  }());

  /*! *****************************************************************************
  Copyright (c) Microsoft Corporation. All rights reserved.
  Licensed under the Apache License, Version 2.0 (the "License"); you may not use
  this file except in compliance with the License. You may obtain a copy of the
  License at http://www.apache.org/licenses/LICENSE-2.0

  THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
  KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
  WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
  MERCHANTABLITY OR NON-INFRINGEMENT.

  See the Apache Version 2.0 License for specific language governing permissions
  and limitations under the License.
  ***************************************************************************** */

  function __awaiter(thisArg, _arguments, P, generator) {
      return new (P || (P = Promise))(function (resolve, reject) {
          function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
          function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
          function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
          step((generator = generator.apply(thisArg, _arguments || [])).next());
      });
  }

  function __generator(thisArg, body) {
      var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
      return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
      function verb(n) { return function (v) { return step([n, v]); }; }
      function step(op) {
          if (f) throw new TypeError("Generator is already executing.");
          while (_) try {
              if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
              if (y = 0, t) op = [op[0] & 2, t.value];
              switch (op[0]) {
                  case 0: case 1: t = op; break;
                  case 4: _.label++; return { value: op[1], done: false };
                  case 5: _.label++; y = op[1]; op = [0]; continue;
                  case 7: op = _.ops.pop(); _.trys.pop(); continue;
                  default:
                      if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                      if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                      if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                      if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                      if (t[2]) _.ops.pop();
                      _.trys.pop(); continue;
              }
              op = body.call(thisArg, _);
          } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
          if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
      }
  }

  var Participant = /** @class */ (function () {
      function Participant(id, room) {
          var _this = this;
          this.dispatcher = new EventDispatcher();
          this.getId = function () { return _this.id; };
          this.on = function (event, callback) {
              _this.dispatcher.register(event, callback);
              return _this;
          };
          this.send = function (payload) {
              if (!_this.channel || _this.channel.readyState !== 'open') {
                  return _this;
              }
              _this.channel.send(payload);
              return _this;
          };
          this.close = function () {
              if (_this.channel) {
                  _this.channel.close();
              }
              _this.peer.close();
              _this.dispatcher.dispatch('disconnected');
              return _this;
          };
          this.addStream = function (stream) {
              stream.getTracks().map(function (track) { return _this.peer.addTrack(track, stream); });
              return _this;
          };
          this.onSignalingEvent = function (event) {
              if (!event.caller || _this.id !== event.caller.id) {
                  return _this;
              }
              switch (event.type) {
                  case SignalingEventType.ANSWER:
                      _this.onAnswer(event);
                      break;
                  case SignalingEventType.CANDIDATE:
                      _this.onCandidate(event);
                      break;
              }
              return _this;
          };
          this.renegotiate = function (remoteDesc) { return __awaiter(_this, void 0, void 0, function () {
              var promises;
              var _this = this;
              return __generator(this, function (_a) {
                  promises = [];
                  if (remoteDesc) {
                      if (remoteDesc.type === 'offer' && this.peer.signalingState !== 'stable') {
                          promises.push(this.peer.setLocalDescription({ type: 'rollback' }));
                      }
                      promises.push(this.peer.setRemoteDescription(remoteDesc));
                      if (remoteDesc.type === 'offer') {
                          promises.push(this.peer
                              .createAnswer(this.offerAnswerOptions)
                              .then(function (desc) { return _this.peer.setLocalDescription(desc); })
                              .then(function () { return _this.room.getEventDispatcher().dispatch('send', {
                              type: SignalingEventType.ANSWER,
                              caller: { id: _this.room.getParticipantId() },
                              callee: { id: _this.id },
                              room: { id: _this.room.getId() },
                              payload: _this.peer.localDescription,
                          }); }));
                      }
                  }
                  else {
                      this.channel = this.newDataChannel(this.room.getConfiguration().getDataConstraints());
                      this.channel.onmessage = this.onMessage;
                      promises.push(this.peer
                          .createOffer(this.offerAnswerOptions)
                          .then(function (desc) {
                          // prevent race condition if another side send us offer at the time
                          // when we were in process of createOffer
                          if (_this.peer.signalingState === 'stable') {
                              return _this.peer
                                  .setLocalDescription(desc)
                                  .then(function () { return _this.room.getEventDispatcher().dispatch('send', {
                                  type: SignalingEventType.OFFER,
                                  caller: { id: _this.room.getParticipantId() },
                                  callee: { id: _this.id },
                                  room: { id: _this.room.getId() },
                                  payload: _this.peer.localDescription,
                              }); });
                          }
                          return Promise.resolve();
                      }));
                  }
                  return [2 /*return*/, Promise
                          .all(promises)
                          .then(function () { return _this; })];
              });
          }); };
          this.newDataChannel = function (dataConstraints) {
              var label = Math.floor((1 + Math.random()) * 1e16)
                  .toString(16)
                  .substring(1);
              return _this.peer.createDataChannel(label, dataConstraints);
          };
          this.onAnswer = function (event) {
              _this
                  .renegotiate(new RTCSessionDescription(event.payload))
                  .catch(function (evnt) { return _this.dispatcher.dispatch('error', evnt); });
          };
          this.onCandidate = function (event) {
              _this.peer
                  .addIceCandidate(new RTCIceCandidate(event.payload))
                  .catch(function (evnt) { return _this.dispatcher.dispatch('error', evnt); });
          };
          this.onIceCandidate = function (iceEvent) {
              if (iceEvent.candidate) {
                  _this.room.getEventDispatcher().dispatch('send', {
                      type: SignalingEventType.CANDIDATE,
                      caller: { id: _this.room.getParticipantId() },
                      callee: { id: _this.id },
                      room: { id: _this.room.getId() },
                      payload: iceEvent.candidate,
                  });
              }
          };
          this.onConnectionStateChange = function () {
              switch (_this.peer.connectionState) {
                  case 'connected':
                      // The connection has become fully connected
                      break;
                  case 'disconnected':
                  case 'failed':
                  // One or more transports has terminated unexpectedly or in an error
                  case 'closed':
                      _this.dispatcher.dispatch('disconnected');
                      // The connection has been closed
                      break;
              }
          };
          this.onIceConnectionStateChange = function () {
              switch (_this.peer.iceConnectionState) {
                  case 'disconnected':
                  case 'failed':
                  case 'closed':
                      _this.dispatcher.dispatch('disconnected');
                      break;
              }
          };
          this.onNegotiationNeeded = function () {
              _this
                  .renegotiate()
                  .catch(function (evnt) { return _this.dispatcher.dispatch('error', evnt); });
          };
          this.onDataChannel = function (event) {
              _this.channel = event.channel;
              _this.channel.onmessage = _this.onMessage;
          };
          this.onMessage = function (event) {
              _this.dispatcher.dispatch('message', event.data);
          };
          this.dispatchRemoteStream = function (event) {
              _this.dispatcher.dispatch('track', event);
          };
          this.id = id;
          this.room = room;
          this.offerAnswerOptions = {
              offerToReceiveAudio: true,
              offerToReceiveVideo: true,
          };
          this.peer = new RTCPeerConnection(this.room.getConfiguration().getServers());
          var stream = this.room.getStream();
          if (stream instanceof MediaStream) {
              this.addStream(stream);
          }
          this.peer.onicecandidate = this.onIceCandidate;
          this.peer.onconnectionstatechange = this.onConnectionStateChange;
          this.peer.oniceconnectionstatechange = this.onIceConnectionStateChange;
          this.peer.onnegotiationneeded = this.onNegotiationNeeded;
          this.peer.ondatachannel = this.onDataChannel;
          this.peer.ontrack = this.dispatchRemoteStream;
      }
      return Participant;
  }());

  var Room = /** @class */ (function () {
      function Room(id, configuration, appDispatcher, stream) {
          var _this = this;
          this.participants = new Map();
          this.dispatcher = new EventDispatcher();
          this.getId = function () { return _this.id; };
          this.getParticipantId = function () { return _this.participantId; };
          this.getEventDispatcher = function () { return _this.appDispatcher; };
          this.getConfiguration = function () { return _this.configuration; };
          this.getStream = function () { return _this.stream; };
          this.on = function (event, callback) {
              _this.dispatcher.register(event, callback);
              return _this;
          };
          this.send = function (payload) {
              _this.participants.forEach(function (participant) { return participant.send(payload); });
              return _this;
          };
          this.disconnect = function () {
              _this.appDispatcher.dispatch('send', {
                  type: SignalingEventType.DISCONNECT,
                  caller: { id: _this.participantId },
                  callee: null,
                  room: { id: _this.id },
                  payload: null,
              });
              var keys = Array.from(_this.participants.keys());
              for (var _i = 0, keys_1 = keys; _i < keys_1.length; _i++) {
                  var key = keys_1[_i];
                  var participant = _this.participants.get(key);
                  _this.participants.delete(key);
                  participant.close();
              }
              return _this;
          };
          this.onSignalingEvent = function (event) {
              if (_this.id !== event.room.id) {
                  return _this;
              }
              switch (event.type) {
                  case SignalingEventType.CONNECT:
                      _this.onConnect(event);
                      break;
                  case SignalingEventType.OFFER:
                      _this.onOffer(event);
                      break;
                  case SignalingEventType.DISCONNECT:
                      _this.onDisconnect(event);
                      break;
                  case SignalingEventType.ANSWER:
                  case SignalingEventType.CANDIDATE:
                      var caller = event.caller;
                      if (_this.participants.has(caller.id)) {
                          _this.participants.get(caller.id).onSignalingEvent(event);
                      }
                      break;
              }
              return _this;
          };
          this.onOffer = function (event) {
              var desc = new RTCSessionDescription(event.payload);
              var caller = event.caller;
              if (_this.participants.has(caller.id)) {
                  _this.participants.get(caller.id)
                      .renegotiate(desc)
                      .catch(function (evnt) { return _this.dispatcher.dispatch('error', evnt); });
              }
              else {
                  var participant = new Participant(caller.id, _this);
                  _this.participants.set(participant.getId(), participant);
                  _this.dispatcher.dispatch('participant', participant);
                  participant
                      .renegotiate(desc)
                      .catch(function (evnt) { return _this.dispatcher.dispatch('error', evnt); });
              }
          };
          this.onConnect = function (event) {
              var caller = event.caller;
              if (!_this.participants.has(caller.id)) {
                  var participant = new Participant(caller.id, _this);
                  _this.participants.set(participant.getId(), participant);
                  _this.dispatcher.dispatch('participant', participant);
              }
          };
          this.onDisconnect = function (event) {
              var caller = event.caller;
              if (_this.participants.has(caller.id)) {
                  var participant = _this.participants.get(caller.id);
                  _this.participants.delete(caller.id);
                  participant.close();
              }
          };
          this.id = id;
          this.stream = stream;
          this.participantId = v4();
          this.configuration = configuration;
          this.appDispatcher = appDispatcher;
          this.appDispatcher.dispatch('send', {
              type: SignalingEventType.CONNECT,
              caller: { id: this.participantId },
              callee: null,
              room: { id: this.id },
              payload: null,
          });
      }
      return Room;
  }());

  var App = /** @class */ (function () {
      function App(dispatcher, servers, dataConstraints) {
          var _this = this;
          if (servers === void 0) { servers = {}; }
          this.configuration = new Configuration();
          this.rooms = new Map();
          this.getEventDispatcher = function () { return _this.dispatcher; };
          this.getConfiguration = function () { return _this.configuration; };
          this.connect = function (id, stream) {
              if (_this.rooms.has(id)) {
                  return _this.rooms.get(id);
              }
              var room = new Room(id, _this.configuration, _this.dispatcher, stream);
              _this.rooms.set(id, room);
              return room;
          };
          this.onEvent = function (event) {
              if (_this.rooms.has(event.room.id)) {
                  _this.rooms.get(event.room.id).onSignalingEvent(event);
              }
              return _this;
          };
          this.onDisconnected = function (event) {
              if (event.type === SignalingEventType.DISCONNECT) {
                  _this.rooms.delete(event.room.id);
              }
          };
          this.dispatcher = dispatcher;
          this.configuration.setServers(servers);
          if (dataConstraints) {
              this.configuration.setDataConstraints(dataConstraints);
          }
          this.dispatcher.register(SignalingEventType.CONNECT, this.onEvent);
          this.dispatcher.register(SignalingEventType.OFFER, this.onEvent);
          this.dispatcher.register(SignalingEventType.DISCONNECT, this.onEvent);
          this.dispatcher.register(SignalingEventType.ANSWER, this.onEvent);
          this.dispatcher.register(SignalingEventType.CANDIDATE, this.onEvent);
          this.dispatcher.register('send', this.onDisconnected);
      }
      return App;
  }());

  var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

  function createCommonjsModule$1(fn, module) {
  	return module = { exports: {} }, fn(module, module.exports), module.exports;
  }

  function getCjsExportFromNamespace (n) {
  	return n && n['default'] || n;
  }

  /**
   * Parses an URI
   *
   * @author Steven Levithan <stevenlevithan.com> (MIT license)
   * @api private
   */

  var re = /^(?:(?![^:@]+:[^:@\/]*@)(http|https|ws|wss):\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?((?:[a-f0-9]{0,4}:){2,7}[a-f0-9]{0,4}|[^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/;

  var parts = [
      'source', 'protocol', 'authority', 'userInfo', 'user', 'password', 'host', 'port', 'relative', 'path', 'directory', 'file', 'query', 'anchor'
  ];

  var parseuri = function parseuri(str) {
      var src = str,
          b = str.indexOf('['),
          e = str.indexOf(']');

      if (b != -1 && e != -1) {
          str = str.substring(0, b) + str.substring(b, e).replace(/:/g, ';') + str.substring(e, str.length);
      }

      var m = re.exec(str || ''),
          uri = {},
          i = 14;

      while (i--) {
          uri[parts[i]] = m[i] || '';
      }

      if (b != -1 && e != -1) {
          uri.source = src;
          uri.host = uri.host.substring(1, uri.host.length - 1).replace(/;/g, ':');
          uri.authority = uri.authority.replace('[', '').replace(']', '').replace(/;/g, ':');
          uri.ipv6uri = true;
      }

      return uri;
  };

  /**
   * Helpers.
   */

  var s = 1000;
  var m = s * 60;
  var h = m * 60;
  var d = h * 24;
  var w = d * 7;
  var y = d * 365.25;

  /**
   * Parse or format the given `val`.
   *
   * Options:
   *
   *  - `long` verbose formatting [false]
   *
   * @param {String|Number} val
   * @param {Object} [options]
   * @throws {Error} throw an error if val is not a non-empty string or a number
   * @return {String|Number}
   * @api public
   */

  var ms = function(val, options) {
    options = options || {};
    var type = typeof val;
    if (type === 'string' && val.length > 0) {
      return parse(val);
    } else if (type === 'number' && isNaN(val) === false) {
      return options.long ? fmtLong(val) : fmtShort(val);
    }
    throw new Error(
      'val is not a non-empty string or a valid number. val=' +
        JSON.stringify(val)
    );
  };

  /**
   * Parse the given `str` and return milliseconds.
   *
   * @param {String} str
   * @return {Number}
   * @api private
   */

  function parse(str) {
    str = String(str);
    if (str.length > 100) {
      return;
    }
    var match = /^((?:\d+)?\-?\d?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
      str
    );
    if (!match) {
      return;
    }
    var n = parseFloat(match[1]);
    var type = (match[2] || 'ms').toLowerCase();
    switch (type) {
      case 'years':
      case 'year':
      case 'yrs':
      case 'yr':
      case 'y':
        return n * y;
      case 'weeks':
      case 'week':
      case 'w':
        return n * w;
      case 'days':
      case 'day':
      case 'd':
        return n * d;
      case 'hours':
      case 'hour':
      case 'hrs':
      case 'hr':
      case 'h':
        return n * h;
      case 'minutes':
      case 'minute':
      case 'mins':
      case 'min':
      case 'm':
        return n * m;
      case 'seconds':
      case 'second':
      case 'secs':
      case 'sec':
      case 's':
        return n * s;
      case 'milliseconds':
      case 'millisecond':
      case 'msecs':
      case 'msec':
      case 'ms':
        return n;
      default:
        return undefined;
    }
  }

  /**
   * Short format for `ms`.
   *
   * @param {Number} ms
   * @return {String}
   * @api private
   */

  function fmtShort(ms) {
    var msAbs = Math.abs(ms);
    if (msAbs >= d) {
      return Math.round(ms / d) + 'd';
    }
    if (msAbs >= h) {
      return Math.round(ms / h) + 'h';
    }
    if (msAbs >= m) {
      return Math.round(ms / m) + 'm';
    }
    if (msAbs >= s) {
      return Math.round(ms / s) + 's';
    }
    return ms + 'ms';
  }

  /**
   * Long format for `ms`.
   *
   * @param {Number} ms
   * @return {String}
   * @api private
   */

  function fmtLong(ms) {
    var msAbs = Math.abs(ms);
    if (msAbs >= d) {
      return plural(ms, msAbs, d, 'day');
    }
    if (msAbs >= h) {
      return plural(ms, msAbs, h, 'hour');
    }
    if (msAbs >= m) {
      return plural(ms, msAbs, m, 'minute');
    }
    if (msAbs >= s) {
      return plural(ms, msAbs, s, 'second');
    }
    return ms + ' ms';
  }

  /**
   * Pluralization helper.
   */

  function plural(ms, msAbs, n, name) {
    var isPlural = msAbs >= n * 1.5;
    return Math.round(ms / n) + ' ' + name + (isPlural ? 's' : '');
  }

  /**
   * This is the common logic for both the Node.js and web browser
   * implementations of `debug()`.
   */

  function setup(env) {
  	createDebug.debug = createDebug;
  	createDebug.default = createDebug;
  	createDebug.coerce = coerce;
  	createDebug.disable = disable;
  	createDebug.enable = enable;
  	createDebug.enabled = enabled;
  	createDebug.humanize = ms;

  	Object.keys(env).forEach(key => {
  		createDebug[key] = env[key];
  	});

  	/**
  	* Active `debug` instances.
  	*/
  	createDebug.instances = [];

  	/**
  	* The currently active debug mode names, and names to skip.
  	*/

  	createDebug.names = [];
  	createDebug.skips = [];

  	/**
  	* Map of special "%n" handling functions, for the debug "format" argument.
  	*
  	* Valid key names are a single, lower or upper-case letter, i.e. "n" and "N".
  	*/
  	createDebug.formatters = {};

  	/**
  	* Selects a color for a debug namespace
  	* @param {String} namespace The namespace string for the for the debug instance to be colored
  	* @return {Number|String} An ANSI color code for the given namespace
  	* @api private
  	*/
  	function selectColor(namespace) {
  		let hash = 0;

  		for (let i = 0; i < namespace.length; i++) {
  			hash = ((hash << 5) - hash) + namespace.charCodeAt(i);
  			hash |= 0; // Convert to 32bit integer
  		}

  		return createDebug.colors[Math.abs(hash) % createDebug.colors.length];
  	}
  	createDebug.selectColor = selectColor;

  	/**
  	* Create a debugger with the given `namespace`.
  	*
  	* @param {String} namespace
  	* @return {Function}
  	* @api public
  	*/
  	function createDebug(namespace) {
  		let prevTime;

  		function debug(...args) {
  			// Disabled?
  			if (!debug.enabled) {
  				return;
  			}

  			const self = debug;

  			// Set `diff` timestamp
  			const curr = Number(new Date());
  			const ms = curr - (prevTime || curr);
  			self.diff = ms;
  			self.prev = prevTime;
  			self.curr = curr;
  			prevTime = curr;

  			args[0] = createDebug.coerce(args[0]);

  			if (typeof args[0] !== 'string') {
  				// Anything else let's inspect with %O
  				args.unshift('%O');
  			}

  			// Apply any `formatters` transformations
  			let index = 0;
  			args[0] = args[0].replace(/%([a-zA-Z%])/g, (match, format) => {
  				// If we encounter an escaped % then don't increase the array index
  				if (match === '%%') {
  					return match;
  				}
  				index++;
  				const formatter = createDebug.formatters[format];
  				if (typeof formatter === 'function') {
  					const val = args[index];
  					match = formatter.call(self, val);

  					// Now we need to remove `args[index]` since it's inlined in the `format`
  					args.splice(index, 1);
  					index--;
  				}
  				return match;
  			});

  			// Apply env-specific formatting (colors, etc.)
  			createDebug.formatArgs.call(self, args);

  			const logFn = self.log || createDebug.log;
  			logFn.apply(self, args);
  		}

  		debug.namespace = namespace;
  		debug.enabled = createDebug.enabled(namespace);
  		debug.useColors = createDebug.useColors();
  		debug.color = selectColor(namespace);
  		debug.destroy = destroy;
  		debug.extend = extend;
  		// Debug.formatArgs = formatArgs;
  		// debug.rawLog = rawLog;

  		// env-specific initialization logic for debug instances
  		if (typeof createDebug.init === 'function') {
  			createDebug.init(debug);
  		}

  		createDebug.instances.push(debug);

  		return debug;
  	}

  	function destroy() {
  		const index = createDebug.instances.indexOf(this);
  		if (index !== -1) {
  			createDebug.instances.splice(index, 1);
  			return true;
  		}
  		return false;
  	}

  	function extend(namespace, delimiter) {
  		const newDebug = createDebug(this.namespace + (typeof delimiter === 'undefined' ? ':' : delimiter) + namespace);
  		newDebug.log = this.log;
  		return newDebug;
  	}

  	/**
  	* Enables a debug mode by namespaces. This can include modes
  	* separated by a colon and wildcards.
  	*
  	* @param {String} namespaces
  	* @api public
  	*/
  	function enable(namespaces) {
  		createDebug.save(namespaces);

  		createDebug.names = [];
  		createDebug.skips = [];

  		let i;
  		const split = (typeof namespaces === 'string' ? namespaces : '').split(/[\s,]+/);
  		const len = split.length;

  		for (i = 0; i < len; i++) {
  			if (!split[i]) {
  				// ignore empty strings
  				continue;
  			}

  			namespaces = split[i].replace(/\*/g, '.*?');

  			if (namespaces[0] === '-') {
  				createDebug.skips.push(new RegExp('^' + namespaces.substr(1) + '$'));
  			} else {
  				createDebug.names.push(new RegExp('^' + namespaces + '$'));
  			}
  		}

  		for (i = 0; i < createDebug.instances.length; i++) {
  			const instance = createDebug.instances[i];
  			instance.enabled = createDebug.enabled(instance.namespace);
  		}
  	}

  	/**
  	* Disable debug output.
  	*
  	* @return {String} namespaces
  	* @api public
  	*/
  	function disable() {
  		const namespaces = [
  			...createDebug.names.map(toNamespace),
  			...createDebug.skips.map(toNamespace).map(namespace => '-' + namespace)
  		].join(',');
  		createDebug.enable('');
  		return namespaces;
  	}

  	/**
  	* Returns true if the given mode name is enabled, false otherwise.
  	*
  	* @param {String} name
  	* @return {Boolean}
  	* @api public
  	*/
  	function enabled(name) {
  		if (name[name.length - 1] === '*') {
  			return true;
  		}

  		let i;
  		let len;

  		for (i = 0, len = createDebug.skips.length; i < len; i++) {
  			if (createDebug.skips[i].test(name)) {
  				return false;
  			}
  		}

  		for (i = 0, len = createDebug.names.length; i < len; i++) {
  			if (createDebug.names[i].test(name)) {
  				return true;
  			}
  		}

  		return false;
  	}

  	/**
  	* Convert regexp to namespace
  	*
  	* @param {RegExp} regxep
  	* @return {String} namespace
  	* @api private
  	*/
  	function toNamespace(regexp) {
  		return regexp.toString()
  			.substring(2, regexp.toString().length - 2)
  			.replace(/\.\*\?$/, '*');
  	}

  	/**
  	* Coerce `val`.
  	*
  	* @param {Mixed} val
  	* @return {Mixed}
  	* @api private
  	*/
  	function coerce(val) {
  		if (val instanceof Error) {
  			return val.stack || val.message;
  		}
  		return val;
  	}

  	createDebug.enable(createDebug.load());

  	return createDebug;
  }

  var common = setup;

  var browser = createCommonjsModule$1(function (module, exports) {
  /* eslint-env browser */

  /**
   * This is the web browser implementation of `debug()`.
   */

  exports.log = log;
  exports.formatArgs = formatArgs;
  exports.save = save;
  exports.load = load;
  exports.useColors = useColors;
  exports.storage = localstorage();

  /**
   * Colors.
   */

  exports.colors = [
  	'#0000CC',
  	'#0000FF',
  	'#0033CC',
  	'#0033FF',
  	'#0066CC',
  	'#0066FF',
  	'#0099CC',
  	'#0099FF',
  	'#00CC00',
  	'#00CC33',
  	'#00CC66',
  	'#00CC99',
  	'#00CCCC',
  	'#00CCFF',
  	'#3300CC',
  	'#3300FF',
  	'#3333CC',
  	'#3333FF',
  	'#3366CC',
  	'#3366FF',
  	'#3399CC',
  	'#3399FF',
  	'#33CC00',
  	'#33CC33',
  	'#33CC66',
  	'#33CC99',
  	'#33CCCC',
  	'#33CCFF',
  	'#6600CC',
  	'#6600FF',
  	'#6633CC',
  	'#6633FF',
  	'#66CC00',
  	'#66CC33',
  	'#9900CC',
  	'#9900FF',
  	'#9933CC',
  	'#9933FF',
  	'#99CC00',
  	'#99CC33',
  	'#CC0000',
  	'#CC0033',
  	'#CC0066',
  	'#CC0099',
  	'#CC00CC',
  	'#CC00FF',
  	'#CC3300',
  	'#CC3333',
  	'#CC3366',
  	'#CC3399',
  	'#CC33CC',
  	'#CC33FF',
  	'#CC6600',
  	'#CC6633',
  	'#CC9900',
  	'#CC9933',
  	'#CCCC00',
  	'#CCCC33',
  	'#FF0000',
  	'#FF0033',
  	'#FF0066',
  	'#FF0099',
  	'#FF00CC',
  	'#FF00FF',
  	'#FF3300',
  	'#FF3333',
  	'#FF3366',
  	'#FF3399',
  	'#FF33CC',
  	'#FF33FF',
  	'#FF6600',
  	'#FF6633',
  	'#FF9900',
  	'#FF9933',
  	'#FFCC00',
  	'#FFCC33'
  ];

  /**
   * Currently only WebKit-based Web Inspectors, Firefox >= v31,
   * and the Firebug extension (any Firefox version) are known
   * to support "%c" CSS customizations.
   *
   * TODO: add a `localStorage` variable to explicitly enable/disable colors
   */

  // eslint-disable-next-line complexity
  function useColors() {
  	// NB: In an Electron preload script, document will be defined but not fully
  	// initialized. Since we know we're in Chrome, we'll just detect this case
  	// explicitly
  	if (typeof window !== 'undefined' && window.process && (window.process.type === 'renderer' || window.process.__nwjs)) {
  		return true;
  	}

  	// Internet Explorer and Edge do not support colors.
  	if (typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)) {
  		return false;
  	}

  	// Is webkit? http://stackoverflow.com/a/16459606/376773
  	// document is undefined in react-native: https://github.com/facebook/react-native/pull/1632
  	return (typeof document !== 'undefined' && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance) ||
  		// Is firebug? http://stackoverflow.com/a/398120/376773
  		(typeof window !== 'undefined' && window.console && (window.console.firebug || (window.console.exception && window.console.table))) ||
  		// Is firefox >= v31?
  		// https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
  		(typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31) ||
  		// Double check webkit in userAgent just in case we are in a worker
  		(typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/));
  }

  /**
   * Colorize log arguments if enabled.
   *
   * @api public
   */

  function formatArgs(args) {
  	args[0] = (this.useColors ? '%c' : '') +
  		this.namespace +
  		(this.useColors ? ' %c' : ' ') +
  		args[0] +
  		(this.useColors ? '%c ' : ' ') +
  		'+' + module.exports.humanize(this.diff);

  	if (!this.useColors) {
  		return;
  	}

  	const c = 'color: ' + this.color;
  	args.splice(1, 0, c, 'color: inherit');

  	// The final "%c" is somewhat tricky, because there could be other
  	// arguments passed either before or after the %c, so we need to
  	// figure out the correct index to insert the CSS into
  	let index = 0;
  	let lastC = 0;
  	args[0].replace(/%[a-zA-Z%]/g, match => {
  		if (match === '%%') {
  			return;
  		}
  		index++;
  		if (match === '%c') {
  			// We only are interested in the *last* %c
  			// (the user may have provided their own)
  			lastC = index;
  		}
  	});

  	args.splice(lastC, 0, c);
  }

  /**
   * Invokes `console.log()` when available.
   * No-op when `console.log` is not a "function".
   *
   * @api public
   */
  function log(...args) {
  	// This hackery is required for IE8/9, where
  	// the `console.log` function doesn't have 'apply'
  	return typeof console === 'object' &&
  		console.log &&
  		console.log(...args);
  }

  /**
   * Save `namespaces`.
   *
   * @param {String} namespaces
   * @api private
   */
  function save(namespaces) {
  	try {
  		if (namespaces) {
  			exports.storage.setItem('debug', namespaces);
  		} else {
  			exports.storage.removeItem('debug');
  		}
  	} catch (error) {
  		// Swallow
  		// XXX (@Qix-) should we be logging these?
  	}
  }

  /**
   * Load `namespaces`.
   *
   * @return {String} returns the previously persisted debug modes
   * @api private
   */
  function load() {
  	let r;
  	try {
  		r = exports.storage.getItem('debug');
  	} catch (error) {
  		// Swallow
  		// XXX (@Qix-) should we be logging these?
  	}

  	// If debug isn't set in LS, and we're in Electron, try to load $DEBUG
  	if (!r && typeof process !== 'undefined' && 'env' in process) {
  		r = process.env.DEBUG;
  	}

  	return r;
  }

  /**
   * Localstorage attempts to return the localstorage.
   *
   * This is necessary because safari throws
   * when a user disables cookies/localstorage
   * and you attempt to access it.
   *
   * @return {LocalStorage}
   * @api private
   */

  function localstorage() {
  	try {
  		// TVMLKit (Apple TV JS Runtime) does not have a window object, just localStorage in the global context
  		// The Browser also has localStorage in the global context.
  		return localStorage;
  	} catch (error) {
  		// Swallow
  		// XXX (@Qix-) should we be logging these?
  	}
  }

  module.exports = common(exports);

  const {formatters} = module.exports;

  /**
   * Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
   */

  formatters.j = function (v) {
  	try {
  		return JSON.stringify(v);
  	} catch (error) {
  		return '[UnexpectedJSONParseError]: ' + error.message;
  	}
  };
  });
  var browser_1 = browser.log;
  var browser_2 = browser.formatArgs;
  var browser_3 = browser.save;
  var browser_4 = browser.load;
  var browser_5 = browser.useColors;
  var browser_6 = browser.storage;
  var browser_7 = browser.colors;

  /**
   * Module dependencies.
   */


  var debug = browser('socket.io-client:url');

  /**
   * Module exports.
   */

  var url_1 = url;

  /**
   * URL parser.
   *
   * @param {String} url
   * @param {Object} An object meant to mimic window.location.
   *                 Defaults to window.location.
   * @api public
   */

  function url (uri, loc) {
    var obj = uri;

    // default to window.location
    loc = loc || (typeof location !== 'undefined' && location);
    if (null == uri) uri = loc.protocol + '//' + loc.host;

    // relative path support
    if ('string' === typeof uri) {
      if ('/' === uri.charAt(0)) {
        if ('/' === uri.charAt(1)) {
          uri = loc.protocol + uri;
        } else {
          uri = loc.host + uri;
        }
      }

      if (!/^(https?|wss?):\/\//.test(uri)) {
        debug('protocol-less url %s', uri);
        if ('undefined' !== typeof loc) {
          uri = loc.protocol + '//' + uri;
        } else {
          uri = 'https://' + uri;
        }
      }

      // parse
      debug('parse %s', uri);
      obj = parseuri(uri);
    }

    // make sure we treat `localhost:80` and `localhost` equally
    if (!obj.port) {
      if (/^(http|ws)$/.test(obj.protocol)) {
        obj.port = '80';
      } else if (/^(http|ws)s$/.test(obj.protocol)) {
        obj.port = '443';
      }
    }

    obj.path = obj.path || '/';

    var ipv6 = obj.host.indexOf(':') !== -1;
    var host = ipv6 ? '[' + obj.host + ']' : obj.host;

    // define unique id
    obj.id = obj.protocol + '://' + host + ':' + obj.port;
    // define href
    obj.href = obj.protocol + '://' + host + (loc && loc.port === obj.port ? '' : (':' + obj.port));

    return obj;
  }

  /**
   * Helpers.
   */

  var s$1 = 1000;
  var m$1 = s$1 * 60;
  var h$1 = m$1 * 60;
  var d$1 = h$1 * 24;
  var y$1 = d$1 * 365.25;

  /**
   * Parse or format the given `val`.
   *
   * Options:
   *
   *  - `long` verbose formatting [false]
   *
   * @param {String|Number} val
   * @param {Object} [options]
   * @throws {Error} throw an error if val is not a non-empty string or a number
   * @return {String|Number}
   * @api public
   */

  var ms$1 = function(val, options) {
    options = options || {};
    var type = typeof val;
    if (type === 'string' && val.length > 0) {
      return parse$1(val);
    } else if (type === 'number' && isNaN(val) === false) {
      return options.long ? fmtLong$1(val) : fmtShort$1(val);
    }
    throw new Error(
      'val is not a non-empty string or a valid number. val=' +
        JSON.stringify(val)
    );
  };

  /**
   * Parse the given `str` and return milliseconds.
   *
   * @param {String} str
   * @return {Number}
   * @api private
   */

  function parse$1(str) {
    str = String(str);
    if (str.length > 100) {
      return;
    }
    var match = /^((?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|years?|yrs?|y)?$/i.exec(
      str
    );
    if (!match) {
      return;
    }
    var n = parseFloat(match[1]);
    var type = (match[2] || 'ms').toLowerCase();
    switch (type) {
      case 'years':
      case 'year':
      case 'yrs':
      case 'yr':
      case 'y':
        return n * y$1;
      case 'days':
      case 'day':
      case 'd':
        return n * d$1;
      case 'hours':
      case 'hour':
      case 'hrs':
      case 'hr':
      case 'h':
        return n * h$1;
      case 'minutes':
      case 'minute':
      case 'mins':
      case 'min':
      case 'm':
        return n * m$1;
      case 'seconds':
      case 'second':
      case 'secs':
      case 'sec':
      case 's':
        return n * s$1;
      case 'milliseconds':
      case 'millisecond':
      case 'msecs':
      case 'msec':
      case 'ms':
        return n;
      default:
        return undefined;
    }
  }

  /**
   * Short format for `ms`.
   *
   * @param {Number} ms
   * @return {String}
   * @api private
   */

  function fmtShort$1(ms) {
    if (ms >= d$1) {
      return Math.round(ms / d$1) + 'd';
    }
    if (ms >= h$1) {
      return Math.round(ms / h$1) + 'h';
    }
    if (ms >= m$1) {
      return Math.round(ms / m$1) + 'm';
    }
    if (ms >= s$1) {
      return Math.round(ms / s$1) + 's';
    }
    return ms + 'ms';
  }

  /**
   * Long format for `ms`.
   *
   * @param {Number} ms
   * @return {String}
   * @api private
   */

  function fmtLong$1(ms) {
    return plural$1(ms, d$1, 'day') ||
      plural$1(ms, h$1, 'hour') ||
      plural$1(ms, m$1, 'minute') ||
      plural$1(ms, s$1, 'second') ||
      ms + ' ms';
  }

  /**
   * Pluralization helper.
   */

  function plural$1(ms, n, name) {
    if (ms < n) {
      return;
    }
    if (ms < n * 1.5) {
      return Math.floor(ms / n) + ' ' + name;
    }
    return Math.ceil(ms / n) + ' ' + name + 's';
  }

  var debug$1 = createCommonjsModule$1(function (module, exports) {
  /**
   * This is the common logic for both the Node.js and web browser
   * implementations of `debug()`.
   *
   * Expose `debug()` as the module.
   */

  exports = module.exports = createDebug.debug = createDebug['default'] = createDebug;
  exports.coerce = coerce;
  exports.disable = disable;
  exports.enable = enable;
  exports.enabled = enabled;
  exports.humanize = ms$1;

  /**
   * Active `debug` instances.
   */
  exports.instances = [];

  /**
   * The currently active debug mode names, and names to skip.
   */

  exports.names = [];
  exports.skips = [];

  /**
   * Map of special "%n" handling functions, for the debug "format" argument.
   *
   * Valid key names are a single, lower or upper-case letter, i.e. "n" and "N".
   */

  exports.formatters = {};

  /**
   * Select a color.
   * @param {String} namespace
   * @return {Number}
   * @api private
   */

  function selectColor(namespace) {
    var hash = 0, i;

    for (i in namespace) {
      hash  = ((hash << 5) - hash) + namespace.charCodeAt(i);
      hash |= 0; // Convert to 32bit integer
    }

    return exports.colors[Math.abs(hash) % exports.colors.length];
  }

  /**
   * Create a debugger with the given `namespace`.
   *
   * @param {String} namespace
   * @return {Function}
   * @api public
   */

  function createDebug(namespace) {

    var prevTime;

    function debug() {
      // disabled?
      if (!debug.enabled) return;

      var self = debug;

      // set `diff` timestamp
      var curr = +new Date();
      var ms = curr - (prevTime || curr);
      self.diff = ms;
      self.prev = prevTime;
      self.curr = curr;
      prevTime = curr;

      // turn the `arguments` into a proper Array
      var args = new Array(arguments.length);
      for (var i = 0; i < args.length; i++) {
        args[i] = arguments[i];
      }

      args[0] = exports.coerce(args[0]);

      if ('string' !== typeof args[0]) {
        // anything else let's inspect with %O
        args.unshift('%O');
      }

      // apply any `formatters` transformations
      var index = 0;
      args[0] = args[0].replace(/%([a-zA-Z%])/g, function(match, format) {
        // if we encounter an escaped % then don't increase the array index
        if (match === '%%') return match;
        index++;
        var formatter = exports.formatters[format];
        if ('function' === typeof formatter) {
          var val = args[index];
          match = formatter.call(self, val);

          // now we need to remove `args[index]` since it's inlined in the `format`
          args.splice(index, 1);
          index--;
        }
        return match;
      });

      // apply env-specific formatting (colors, etc.)
      exports.formatArgs.call(self, args);

      var logFn = debug.log || exports.log || console.log.bind(console);
      logFn.apply(self, args);
    }

    debug.namespace = namespace;
    debug.enabled = exports.enabled(namespace);
    debug.useColors = exports.useColors();
    debug.color = selectColor(namespace);
    debug.destroy = destroy;

    // env-specific initialization logic for debug instances
    if ('function' === typeof exports.init) {
      exports.init(debug);
    }

    exports.instances.push(debug);

    return debug;
  }

  function destroy () {
    var index = exports.instances.indexOf(this);
    if (index !== -1) {
      exports.instances.splice(index, 1);
      return true;
    } else {
      return false;
    }
  }

  /**
   * Enables a debug mode by namespaces. This can include modes
   * separated by a colon and wildcards.
   *
   * @param {String} namespaces
   * @api public
   */

  function enable(namespaces) {
    exports.save(namespaces);

    exports.names = [];
    exports.skips = [];

    var i;
    var split = (typeof namespaces === 'string' ? namespaces : '').split(/[\s,]+/);
    var len = split.length;

    for (i = 0; i < len; i++) {
      if (!split[i]) continue; // ignore empty strings
      namespaces = split[i].replace(/\*/g, '.*?');
      if (namespaces[0] === '-') {
        exports.skips.push(new RegExp('^' + namespaces.substr(1) + '$'));
      } else {
        exports.names.push(new RegExp('^' + namespaces + '$'));
      }
    }

    for (i = 0; i < exports.instances.length; i++) {
      var instance = exports.instances[i];
      instance.enabled = exports.enabled(instance.namespace);
    }
  }

  /**
   * Disable debug output.
   *
   * @api public
   */

  function disable() {
    exports.enable('');
  }

  /**
   * Returns true if the given mode name is enabled, false otherwise.
   *
   * @param {String} name
   * @return {Boolean}
   * @api public
   */

  function enabled(name) {
    if (name[name.length - 1] === '*') {
      return true;
    }
    var i, len;
    for (i = 0, len = exports.skips.length; i < len; i++) {
      if (exports.skips[i].test(name)) {
        return false;
      }
    }
    for (i = 0, len = exports.names.length; i < len; i++) {
      if (exports.names[i].test(name)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Coerce `val`.
   *
   * @param {Mixed} val
   * @return {Mixed}
   * @api private
   */

  function coerce(val) {
    if (val instanceof Error) return val.stack || val.message;
    return val;
  }
  });
  var debug_1 = debug$1.coerce;
  var debug_2 = debug$1.disable;
  var debug_3 = debug$1.enable;
  var debug_4 = debug$1.enabled;
  var debug_5 = debug$1.humanize;
  var debug_6 = debug$1.instances;
  var debug_7 = debug$1.names;
  var debug_8 = debug$1.skips;
  var debug_9 = debug$1.formatters;

  var browser$1 = createCommonjsModule$1(function (module, exports) {
  /**
   * This is the web browser implementation of `debug()`.
   *
   * Expose `debug()` as the module.
   */

  exports = module.exports = debug$1;
  exports.log = log;
  exports.formatArgs = formatArgs;
  exports.save = save;
  exports.load = load;
  exports.useColors = useColors;
  exports.storage = 'undefined' != typeof chrome
                 && 'undefined' != typeof chrome.storage
                    ? chrome.storage.local
                    : localstorage();

  /**
   * Colors.
   */

  exports.colors = [
    '#0000CC', '#0000FF', '#0033CC', '#0033FF', '#0066CC', '#0066FF', '#0099CC',
    '#0099FF', '#00CC00', '#00CC33', '#00CC66', '#00CC99', '#00CCCC', '#00CCFF',
    '#3300CC', '#3300FF', '#3333CC', '#3333FF', '#3366CC', '#3366FF', '#3399CC',
    '#3399FF', '#33CC00', '#33CC33', '#33CC66', '#33CC99', '#33CCCC', '#33CCFF',
    '#6600CC', '#6600FF', '#6633CC', '#6633FF', '#66CC00', '#66CC33', '#9900CC',
    '#9900FF', '#9933CC', '#9933FF', '#99CC00', '#99CC33', '#CC0000', '#CC0033',
    '#CC0066', '#CC0099', '#CC00CC', '#CC00FF', '#CC3300', '#CC3333', '#CC3366',
    '#CC3399', '#CC33CC', '#CC33FF', '#CC6600', '#CC6633', '#CC9900', '#CC9933',
    '#CCCC00', '#CCCC33', '#FF0000', '#FF0033', '#FF0066', '#FF0099', '#FF00CC',
    '#FF00FF', '#FF3300', '#FF3333', '#FF3366', '#FF3399', '#FF33CC', '#FF33FF',
    '#FF6600', '#FF6633', '#FF9900', '#FF9933', '#FFCC00', '#FFCC33'
  ];

  /**
   * Currently only WebKit-based Web Inspectors, Firefox >= v31,
   * and the Firebug extension (any Firefox version) are known
   * to support "%c" CSS customizations.
   *
   * TODO: add a `localStorage` variable to explicitly enable/disable colors
   */

  function useColors() {
    // NB: In an Electron preload script, document will be defined but not fully
    // initialized. Since we know we're in Chrome, we'll just detect this case
    // explicitly
    if (typeof window !== 'undefined' && window.process && window.process.type === 'renderer') {
      return true;
    }

    // Internet Explorer and Edge do not support colors.
    if (typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)) {
      return false;
    }

    // is webkit? http://stackoverflow.com/a/16459606/376773
    // document is undefined in react-native: https://github.com/facebook/react-native/pull/1632
    return (typeof document !== 'undefined' && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance) ||
      // is firebug? http://stackoverflow.com/a/398120/376773
      (typeof window !== 'undefined' && window.console && (window.console.firebug || (window.console.exception && window.console.table))) ||
      // is firefox >= v31?
      // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
      (typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31) ||
      // double check webkit in userAgent just in case we are in a worker
      (typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/));
  }

  /**
   * Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
   */

  exports.formatters.j = function(v) {
    try {
      return JSON.stringify(v);
    } catch (err) {
      return '[UnexpectedJSONParseError]: ' + err.message;
    }
  };


  /**
   * Colorize log arguments if enabled.
   *
   * @api public
   */

  function formatArgs(args) {
    var useColors = this.useColors;

    args[0] = (useColors ? '%c' : '')
      + this.namespace
      + (useColors ? ' %c' : ' ')
      + args[0]
      + (useColors ? '%c ' : ' ')
      + '+' + exports.humanize(this.diff);

    if (!useColors) return;

    var c = 'color: ' + this.color;
    args.splice(1, 0, c, 'color: inherit');

    // the final "%c" is somewhat tricky, because there could be other
    // arguments passed either before or after the %c, so we need to
    // figure out the correct index to insert the CSS into
    var index = 0;
    var lastC = 0;
    args[0].replace(/%[a-zA-Z%]/g, function(match) {
      if ('%%' === match) return;
      index++;
      if ('%c' === match) {
        // we only are interested in the *last* %c
        // (the user may have provided their own)
        lastC = index;
      }
    });

    args.splice(lastC, 0, c);
  }

  /**
   * Invokes `console.log()` when available.
   * No-op when `console.log` is not a "function".
   *
   * @api public
   */

  function log() {
    // this hackery is required for IE8/9, where
    // the `console.log` function doesn't have 'apply'
    return 'object' === typeof console
      && console.log
      && Function.prototype.apply.call(console.log, console, arguments);
  }

  /**
   * Save `namespaces`.
   *
   * @param {String} namespaces
   * @api private
   */

  function save(namespaces) {
    try {
      if (null == namespaces) {
        exports.storage.removeItem('debug');
      } else {
        exports.storage.debug = namespaces;
      }
    } catch(e) {}
  }

  /**
   * Load `namespaces`.
   *
   * @return {String} returns the previously persisted debug modes
   * @api private
   */

  function load() {
    var r;
    try {
      r = exports.storage.debug;
    } catch(e) {}

    // If debug isn't set in LS, and we're in Electron, try to load $DEBUG
    if (!r && typeof process !== 'undefined' && 'env' in process) {
      r = process.env.DEBUG;
    }

    return r;
  }

  /**
   * Enable namespaces listed in `localStorage.debug` initially.
   */

  exports.enable(load());

  /**
   * Localstorage attempts to return the localstorage.
   *
   * This is necessary because safari throws
   * when a user disables cookies/localstorage
   * and you attempt to access it.
   *
   * @return {LocalStorage}
   * @api private
   */

  function localstorage() {
    try {
      return window.localStorage;
    } catch (e) {}
  }
  });
  var browser_1$1 = browser$1.log;
  var browser_2$1 = browser$1.formatArgs;
  var browser_3$1 = browser$1.save;
  var browser_4$1 = browser$1.load;
  var browser_5$1 = browser$1.useColors;
  var browser_6$1 = browser$1.storage;
  var browser_7$1 = browser$1.colors;

  var componentEmitter = createCommonjsModule$1(function (module) {
  /**
   * Expose `Emitter`.
   */

  {
    module.exports = Emitter;
  }

  /**
   * Initialize a new `Emitter`.
   *
   * @api public
   */

  function Emitter(obj) {
    if (obj) return mixin(obj);
  }
  /**
   * Mixin the emitter properties.
   *
   * @param {Object} obj
   * @return {Object}
   * @api private
   */

  function mixin(obj) {
    for (var key in Emitter.prototype) {
      obj[key] = Emitter.prototype[key];
    }
    return obj;
  }

  /**
   * Listen on the given `event` with `fn`.
   *
   * @param {String} event
   * @param {Function} fn
   * @return {Emitter}
   * @api public
   */

  Emitter.prototype.on =
  Emitter.prototype.addEventListener = function(event, fn){
    this._callbacks = this._callbacks || {};
    (this._callbacks['$' + event] = this._callbacks['$' + event] || [])
      .push(fn);
    return this;
  };

  /**
   * Adds an `event` listener that will be invoked a single
   * time then automatically removed.
   *
   * @param {String} event
   * @param {Function} fn
   * @return {Emitter}
   * @api public
   */

  Emitter.prototype.once = function(event, fn){
    function on() {
      this.off(event, on);
      fn.apply(this, arguments);
    }

    on.fn = fn;
    this.on(event, on);
    return this;
  };

  /**
   * Remove the given callback for `event` or all
   * registered callbacks.
   *
   * @param {String} event
   * @param {Function} fn
   * @return {Emitter}
   * @api public
   */

  Emitter.prototype.off =
  Emitter.prototype.removeListener =
  Emitter.prototype.removeAllListeners =
  Emitter.prototype.removeEventListener = function(event, fn){
    this._callbacks = this._callbacks || {};

    // all
    if (0 == arguments.length) {
      this._callbacks = {};
      return this;
    }

    // specific event
    var callbacks = this._callbacks['$' + event];
    if (!callbacks) return this;

    // remove all handlers
    if (1 == arguments.length) {
      delete this._callbacks['$' + event];
      return this;
    }

    // remove specific handler
    var cb;
    for (var i = 0; i < callbacks.length; i++) {
      cb = callbacks[i];
      if (cb === fn || cb.fn === fn) {
        callbacks.splice(i, 1);
        break;
      }
    }
    return this;
  };

  /**
   * Emit `event` with the given args.
   *
   * @param {String} event
   * @param {Mixed} ...
   * @return {Emitter}
   */

  Emitter.prototype.emit = function(event){
    this._callbacks = this._callbacks || {};
    var args = [].slice.call(arguments, 1)
      , callbacks = this._callbacks['$' + event];

    if (callbacks) {
      callbacks = callbacks.slice(0);
      for (var i = 0, len = callbacks.length; i < len; ++i) {
        callbacks[i].apply(this, args);
      }
    }

    return this;
  };

  /**
   * Return array of callbacks for `event`.
   *
   * @param {String} event
   * @return {Array}
   * @api public
   */

  Emitter.prototype.listeners = function(event){
    this._callbacks = this._callbacks || {};
    return this._callbacks['$' + event] || [];
  };

  /**
   * Check if this emitter has `event` handlers.
   *
   * @param {String} event
   * @return {Boolean}
   * @api public
   */

  Emitter.prototype.hasListeners = function(event){
    return !! this.listeners(event).length;
  };
  });

  var toString = {}.toString;

  var isarray = Array.isArray || function (arr) {
    return toString.call(arr) == '[object Array]';
  };

  var isBuffer = isBuf;

  var withNativeBuffer = typeof Buffer === 'function' && typeof Buffer.isBuffer === 'function';
  var withNativeArrayBuffer = typeof ArrayBuffer === 'function';

  var isView = function (obj) {
    return typeof ArrayBuffer.isView === 'function' ? ArrayBuffer.isView(obj) : (obj.buffer instanceof ArrayBuffer);
  };

  /**
   * Returns true if obj is a buffer or an arraybuffer.
   *
   * @api private
   */

  function isBuf(obj) {
    return (withNativeBuffer && Buffer.isBuffer(obj)) ||
            (withNativeArrayBuffer && (obj instanceof ArrayBuffer || isView(obj)));
  }

  /*global Blob,File*/

  /**
   * Module requirements
   */



  var toString$1 = Object.prototype.toString;
  var withNativeBlob = typeof Blob === 'function' || (typeof Blob !== 'undefined' && toString$1.call(Blob) === '[object BlobConstructor]');
  var withNativeFile = typeof File === 'function' || (typeof File !== 'undefined' && toString$1.call(File) === '[object FileConstructor]');

  /**
   * Replaces every Buffer | ArrayBuffer in packet with a numbered placeholder.
   * Anything with blobs or files should be fed through removeBlobs before coming
   * here.
   *
   * @param {Object} packet - socket.io event packet
   * @return {Object} with deconstructed packet and list of buffers
   * @api public
   */

  var deconstructPacket = function(packet) {
    var buffers = [];
    var packetData = packet.data;
    var pack = packet;
    pack.data = _deconstructPacket(packetData, buffers);
    pack.attachments = buffers.length; // number of binary 'attachments'
    return {packet: pack, buffers: buffers};
  };

  function _deconstructPacket(data, buffers) {
    if (!data) return data;

    if (isBuffer(data)) {
      var placeholder = { _placeholder: true, num: buffers.length };
      buffers.push(data);
      return placeholder;
    } else if (isarray(data)) {
      var newData = new Array(data.length);
      for (var i = 0; i < data.length; i++) {
        newData[i] = _deconstructPacket(data[i], buffers);
      }
      return newData;
    } else if (typeof data === 'object' && !(data instanceof Date)) {
      var newData = {};
      for (var key in data) {
        newData[key] = _deconstructPacket(data[key], buffers);
      }
      return newData;
    }
    return data;
  }

  /**
   * Reconstructs a binary packet from its placeholder packet and buffers
   *
   * @param {Object} packet - event packet with placeholders
   * @param {Array} buffers - binary buffers to put in placeholder positions
   * @return {Object} reconstructed packet
   * @api public
   */

  var reconstructPacket = function(packet, buffers) {
    packet.data = _reconstructPacket(packet.data, buffers);
    packet.attachments = undefined; // no longer useful
    return packet;
  };

  function _reconstructPacket(data, buffers) {
    if (!data) return data;

    if (data && data._placeholder) {
      return buffers[data.num]; // appropriate buffer (should be natural order anyway)
    } else if (isarray(data)) {
      for (var i = 0; i < data.length; i++) {
        data[i] = _reconstructPacket(data[i], buffers);
      }
    } else if (typeof data === 'object') {
      for (var key in data) {
        data[key] = _reconstructPacket(data[key], buffers);
      }
    }

    return data;
  }

  /**
   * Asynchronously removes Blobs or Files from data via
   * FileReader's readAsArrayBuffer method. Used before encoding
   * data as msgpack. Calls callback with the blobless data.
   *
   * @param {Object} data
   * @param {Function} callback
   * @api private
   */

  var removeBlobs = function(data, callback) {
    function _removeBlobs(obj, curKey, containingObject) {
      if (!obj) return obj;

      // convert any blob
      if ((withNativeBlob && obj instanceof Blob) ||
          (withNativeFile && obj instanceof File)) {
        pendingBlobs++;

        // async filereader
        var fileReader = new FileReader();
        fileReader.onload = function() { // this.result == arraybuffer
          if (containingObject) {
            containingObject[curKey] = this.result;
          }
          else {
            bloblessData = this.result;
          }

          // if nothing pending its callback time
          if(! --pendingBlobs) {
            callback(bloblessData);
          }
        };

        fileReader.readAsArrayBuffer(obj); // blob -> arraybuffer
      } else if (isarray(obj)) { // handle array
        for (var i = 0; i < obj.length; i++) {
          _removeBlobs(obj[i], i, obj);
        }
      } else if (typeof obj === 'object' && !isBuffer(obj)) { // and object
        for (var key in obj) {
          _removeBlobs(obj[key], key, obj);
        }
      }
    }

    var pendingBlobs = 0;
    var bloblessData = data;
    _removeBlobs(bloblessData);
    if (!pendingBlobs) {
      callback(bloblessData);
    }
  };

  var binary = {
  	deconstructPacket: deconstructPacket,
  	reconstructPacket: reconstructPacket,
  	removeBlobs: removeBlobs
  };

  var socket_ioParser = createCommonjsModule$1(function (module, exports) {
  /**
   * Module dependencies.
   */

  var debug = browser$1('socket.io-parser');





  /**
   * Protocol version.
   *
   * @api public
   */

  exports.protocol = 4;

  /**
   * Packet types.
   *
   * @api public
   */

  exports.types = [
    'CONNECT',
    'DISCONNECT',
    'EVENT',
    'ACK',
    'ERROR',
    'BINARY_EVENT',
    'BINARY_ACK'
  ];

  /**
   * Packet type `connect`.
   *
   * @api public
   */

  exports.CONNECT = 0;

  /**
   * Packet type `disconnect`.
   *
   * @api public
   */

  exports.DISCONNECT = 1;

  /**
   * Packet type `event`.
   *
   * @api public
   */

  exports.EVENT = 2;

  /**
   * Packet type `ack`.
   *
   * @api public
   */

  exports.ACK = 3;

  /**
   * Packet type `error`.
   *
   * @api public
   */

  exports.ERROR = 4;

  /**
   * Packet type 'binary event'
   *
   * @api public
   */

  exports.BINARY_EVENT = 5;

  /**
   * Packet type `binary ack`. For acks with binary arguments.
   *
   * @api public
   */

  exports.BINARY_ACK = 6;

  /**
   * Encoder constructor.
   *
   * @api public
   */

  exports.Encoder = Encoder;

  /**
   * Decoder constructor.
   *
   * @api public
   */

  exports.Decoder = Decoder;

  /**
   * A socket.io Encoder instance
   *
   * @api public
   */

  function Encoder() {}

  var ERROR_PACKET = exports.ERROR + '"encode error"';

  /**
   * Encode a packet as a single string if non-binary, or as a
   * buffer sequence, depending on packet type.
   *
   * @param {Object} obj - packet object
   * @param {Function} callback - function to handle encodings (likely engine.write)
   * @return Calls callback with Array of encodings
   * @api public
   */

  Encoder.prototype.encode = function(obj, callback){
    debug('encoding packet %j', obj);

    if (exports.BINARY_EVENT === obj.type || exports.BINARY_ACK === obj.type) {
      encodeAsBinary(obj, callback);
    } else {
      var encoding = encodeAsString(obj);
      callback([encoding]);
    }
  };

  /**
   * Encode packet as string.
   *
   * @param {Object} packet
   * @return {String} encoded
   * @api private
   */

  function encodeAsString(obj) {

    // first is type
    var str = '' + obj.type;

    // attachments if we have them
    if (exports.BINARY_EVENT === obj.type || exports.BINARY_ACK === obj.type) {
      str += obj.attachments + '-';
    }

    // if we have a namespace other than `/`
    // we append it followed by a comma `,`
    if (obj.nsp && '/' !== obj.nsp) {
      str += obj.nsp + ',';
    }

    // immediately followed by the id
    if (null != obj.id) {
      str += obj.id;
    }

    // json data
    if (null != obj.data) {
      var payload = tryStringify(obj.data);
      if (payload !== false) {
        str += payload;
      } else {
        return ERROR_PACKET;
      }
    }

    debug('encoded %j as %s', obj, str);
    return str;
  }

  function tryStringify(str) {
    try {
      return JSON.stringify(str);
    } catch(e){
      return false;
    }
  }

  /**
   * Encode packet as 'buffer sequence' by removing blobs, and
   * deconstructing packet into object with placeholders and
   * a list of buffers.
   *
   * @param {Object} packet
   * @return {Buffer} encoded
   * @api private
   */

  function encodeAsBinary(obj, callback) {

    function writeEncoding(bloblessData) {
      var deconstruction = binary.deconstructPacket(bloblessData);
      var pack = encodeAsString(deconstruction.packet);
      var buffers = deconstruction.buffers;

      buffers.unshift(pack); // add packet info to beginning of data list
      callback(buffers); // write all the buffers
    }

    binary.removeBlobs(obj, writeEncoding);
  }

  /**
   * A socket.io Decoder instance
   *
   * @return {Object} decoder
   * @api public
   */

  function Decoder() {
    this.reconstructor = null;
  }

  /**
   * Mix in `Emitter` with Decoder.
   */

  componentEmitter(Decoder.prototype);

  /**
   * Decodes an encoded packet string into packet JSON.
   *
   * @param {String} obj - encoded packet
   * @return {Object} packet
   * @api public
   */

  Decoder.prototype.add = function(obj) {
    var packet;
    if (typeof obj === 'string') {
      packet = decodeString(obj);
      if (exports.BINARY_EVENT === packet.type || exports.BINARY_ACK === packet.type) { // binary packet's json
        this.reconstructor = new BinaryReconstructor(packet);

        // no attachments, labeled binary but no binary data to follow
        if (this.reconstructor.reconPack.attachments === 0) {
          this.emit('decoded', packet);
        }
      } else { // non-binary full packet
        this.emit('decoded', packet);
      }
    } else if (isBuffer(obj) || obj.base64) { // raw binary data
      if (!this.reconstructor) {
        throw new Error('got binary data when not reconstructing a packet');
      } else {
        packet = this.reconstructor.takeBinaryData(obj);
        if (packet) { // received final buffer
          this.reconstructor = null;
          this.emit('decoded', packet);
        }
      }
    } else {
      throw new Error('Unknown type: ' + obj);
    }
  };

  /**
   * Decode a packet String (JSON data)
   *
   * @param {String} str
   * @return {Object} packet
   * @api private
   */

  function decodeString(str) {
    var i = 0;
    // look up type
    var p = {
      type: Number(str.charAt(0))
    };

    if (null == exports.types[p.type]) {
      return error('unknown packet type ' + p.type);
    }

    // look up attachments if type binary
    if (exports.BINARY_EVENT === p.type || exports.BINARY_ACK === p.type) {
      var buf = '';
      while (str.charAt(++i) !== '-') {
        buf += str.charAt(i);
        if (i == str.length) break;
      }
      if (buf != Number(buf) || str.charAt(i) !== '-') {
        throw new Error('Illegal attachments');
      }
      p.attachments = Number(buf);
    }

    // look up namespace (if any)
    if ('/' === str.charAt(i + 1)) {
      p.nsp = '';
      while (++i) {
        var c = str.charAt(i);
        if (',' === c) break;
        p.nsp += c;
        if (i === str.length) break;
      }
    } else {
      p.nsp = '/';
    }

    // look up id
    var next = str.charAt(i + 1);
    if ('' !== next && Number(next) == next) {
      p.id = '';
      while (++i) {
        var c = str.charAt(i);
        if (null == c || Number(c) != c) {
          --i;
          break;
        }
        p.id += str.charAt(i);
        if (i === str.length) break;
      }
      p.id = Number(p.id);
    }

    // look up json data
    if (str.charAt(++i)) {
      var payload = tryParse(str.substr(i));
      var isPayloadValid = payload !== false && (p.type === exports.ERROR || isarray(payload));
      if (isPayloadValid) {
        p.data = payload;
      } else {
        return error('invalid payload');
      }
    }

    debug('decoded %s as %j', str, p);
    return p;
  }

  function tryParse(str) {
    try {
      return JSON.parse(str);
    } catch(e){
      return false;
    }
  }

  /**
   * Deallocates a parser's resources
   *
   * @api public
   */

  Decoder.prototype.destroy = function() {
    if (this.reconstructor) {
      this.reconstructor.finishedReconstruction();
    }
  };

  /**
   * A manager of a binary event's 'buffer sequence'. Should
   * be constructed whenever a packet of type BINARY_EVENT is
   * decoded.
   *
   * @param {Object} packet
   * @return {BinaryReconstructor} initialized reconstructor
   * @api private
   */

  function BinaryReconstructor(packet) {
    this.reconPack = packet;
    this.buffers = [];
  }

  /**
   * Method to be called when binary data received from connection
   * after a BINARY_EVENT packet.
   *
   * @param {Buffer | ArrayBuffer} binData - the raw binary data received
   * @return {null | Object} returns null if more binary data is expected or
   *   a reconstructed packet object if all buffers have been received.
   * @api private
   */

  BinaryReconstructor.prototype.takeBinaryData = function(binData) {
    this.buffers.push(binData);
    if (this.buffers.length === this.reconPack.attachments) { // done with buffer list
      var packet = binary.reconstructPacket(this.reconPack, this.buffers);
      this.finishedReconstruction();
      return packet;
    }
    return null;
  };

  /**
   * Cleans up binary packet reconstruction variables.
   *
   * @api private
   */

  BinaryReconstructor.prototype.finishedReconstruction = function() {
    this.reconPack = null;
    this.buffers = [];
  };

  function error(msg) {
    return {
      type: exports.ERROR,
      data: 'parser error: ' + msg
    };
  }
  });
  var socket_ioParser_1 = socket_ioParser.protocol;
  var socket_ioParser_2 = socket_ioParser.types;
  var socket_ioParser_3 = socket_ioParser.CONNECT;
  var socket_ioParser_4 = socket_ioParser.DISCONNECT;
  var socket_ioParser_5 = socket_ioParser.EVENT;
  var socket_ioParser_6 = socket_ioParser.ACK;
  var socket_ioParser_7 = socket_ioParser.ERROR;
  var socket_ioParser_8 = socket_ioParser.BINARY_EVENT;
  var socket_ioParser_9 = socket_ioParser.BINARY_ACK;
  var socket_ioParser_10 = socket_ioParser.Encoder;
  var socket_ioParser_11 = socket_ioParser.Decoder;

  var hasCors = createCommonjsModule$1(function (module) {
  /**
   * Module exports.
   *
   * Logic borrowed from Modernizr:
   *
   *   - https://github.com/Modernizr/Modernizr/blob/master/feature-detects/cors.js
   */

  try {
    module.exports = typeof XMLHttpRequest !== 'undefined' &&
      'withCredentials' in new XMLHttpRequest();
  } catch (err) {
    // if XMLHttp support is disabled in IE then it will throw
    // when trying to create
    module.exports = false;
  }
  });

  // browser shim for xmlhttprequest module



  var xmlhttprequest = function (opts) {
    var xdomain = opts.xdomain;

    // scheme must be same when usign XDomainRequest
    // http://blogs.msdn.com/b/ieinternals/archive/2010/05/13/xdomainrequest-restrictions-limitations-and-workarounds.aspx
    var xscheme = opts.xscheme;

    // XDomainRequest has a flow of not sending cookie, therefore it should be disabled as a default.
    // https://github.com/Automattic/engine.io-client/pull/217
    var enablesXDR = opts.enablesXDR;

    // XMLHttpRequest can be disabled on IE
    try {
      if ('undefined' !== typeof XMLHttpRequest && (!xdomain || hasCors)) {
        return new XMLHttpRequest();
      }
    } catch (e) { }

    // Use XDomainRequest for IE8 if enablesXDR is true
    // because loading bar keeps flashing when using jsonp-polling
    // https://github.com/yujiosaka/socke.io-ie8-loading-example
    try {
      if ('undefined' !== typeof XDomainRequest && !xscheme && enablesXDR) {
        return new XDomainRequest();
      }
    } catch (e) { }

    if (!xdomain) {
      try {
        return new self[['Active'].concat('Object').join('X')]('Microsoft.XMLHTTP');
      } catch (e) { }
    }
  };

  /**
   * Gets the keys for an object.
   *
   * @return {Array} keys
   * @api private
   */

  var keys = Object.keys || function keys (obj){
    var arr = [];
    var has = Object.prototype.hasOwnProperty;

    for (var i in obj) {
      if (has.call(obj, i)) {
        arr.push(i);
      }
    }
    return arr;
  };

  /* global Blob File */

  /*
   * Module requirements.
   */



  var toString$2 = Object.prototype.toString;
  var withNativeBlob$1 = typeof Blob === 'function' ||
                          typeof Blob !== 'undefined' && toString$2.call(Blob) === '[object BlobConstructor]';
  var withNativeFile$1 = typeof File === 'function' ||
                          typeof File !== 'undefined' && toString$2.call(File) === '[object FileConstructor]';

  /**
   * Module exports.
   */

  var hasBinary2 = hasBinary;

  /**
   * Checks for binary data.
   *
   * Supports Buffer, ArrayBuffer, Blob and File.
   *
   * @param {Object} anything
   * @api public
   */

  function hasBinary (obj) {
    if (!obj || typeof obj !== 'object') {
      return false;
    }

    if (isarray(obj)) {
      for (var i = 0, l = obj.length; i < l; i++) {
        if (hasBinary(obj[i])) {
          return true;
        }
      }
      return false;
    }

    if ((typeof Buffer === 'function' && Buffer.isBuffer && Buffer.isBuffer(obj)) ||
      (typeof ArrayBuffer === 'function' && obj instanceof ArrayBuffer) ||
      (withNativeBlob$1 && obj instanceof Blob) ||
      (withNativeFile$1 && obj instanceof File)
    ) {
      return true;
    }

    // see: https://github.com/Automattic/has-binary/pull/4
    if (obj.toJSON && typeof obj.toJSON === 'function' && arguments.length === 1) {
      return hasBinary(obj.toJSON(), true);
    }

    for (var key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key) && hasBinary(obj[key])) {
        return true;
      }
    }

    return false;
  }

  /**
   * An abstraction for slicing an arraybuffer even when
   * ArrayBuffer.prototype.slice is not supported
   *
   * @api public
   */

  var arraybuffer_slice = function(arraybuffer, start, end) {
    var bytes = arraybuffer.byteLength;
    start = start || 0;
    end = end || bytes;

    if (arraybuffer.slice) { return arraybuffer.slice(start, end); }

    if (start < 0) { start += bytes; }
    if (end < 0) { end += bytes; }
    if (end > bytes) { end = bytes; }

    if (start >= bytes || start >= end || bytes === 0) {
      return new ArrayBuffer(0);
    }

    var abv = new Uint8Array(arraybuffer);
    var result = new Uint8Array(end - start);
    for (var i = start, ii = 0; i < end; i++, ii++) {
      result[ii] = abv[i];
    }
    return result.buffer;
  };

  var after_1 = after;

  function after(count, callback, err_cb) {
      var bail = false;
      err_cb = err_cb || noop;
      proxy.count = count;

      return (count === 0) ? callback() : proxy

      function proxy(err, result) {
          if (proxy.count <= 0) {
              throw new Error('after called too many times')
          }
          --proxy.count;

          // after first error, rest are passed to err_cb
          if (err) {
              bail = true;
              callback(err);
              // future error callbacks will go to error handler
              callback = err_cb;
          } else if (proxy.count === 0 && !bail) {
              callback(null, result);
          }
      }
  }

  function noop() {}

  /*! https://mths.be/utf8js v2.1.2 by @mathias */

  var stringFromCharCode = String.fromCharCode;

  // Taken from https://mths.be/punycode
  function ucs2decode(string) {
  	var output = [];
  	var counter = 0;
  	var length = string.length;
  	var value;
  	var extra;
  	while (counter < length) {
  		value = string.charCodeAt(counter++);
  		if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
  			// high surrogate, and there is a next character
  			extra = string.charCodeAt(counter++);
  			if ((extra & 0xFC00) == 0xDC00) { // low surrogate
  				output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
  			} else {
  				// unmatched surrogate; only append this code unit, in case the next
  				// code unit is the high surrogate of a surrogate pair
  				output.push(value);
  				counter--;
  			}
  		} else {
  			output.push(value);
  		}
  	}
  	return output;
  }

  // Taken from https://mths.be/punycode
  function ucs2encode(array) {
  	var length = array.length;
  	var index = -1;
  	var value;
  	var output = '';
  	while (++index < length) {
  		value = array[index];
  		if (value > 0xFFFF) {
  			value -= 0x10000;
  			output += stringFromCharCode(value >>> 10 & 0x3FF | 0xD800);
  			value = 0xDC00 | value & 0x3FF;
  		}
  		output += stringFromCharCode(value);
  	}
  	return output;
  }

  function checkScalarValue(codePoint, strict) {
  	if (codePoint >= 0xD800 && codePoint <= 0xDFFF) {
  		if (strict) {
  			throw Error(
  				'Lone surrogate U+' + codePoint.toString(16).toUpperCase() +
  				' is not a scalar value'
  			);
  		}
  		return false;
  	}
  	return true;
  }
  /*--------------------------------------------------------------------------*/

  function createByte(codePoint, shift) {
  	return stringFromCharCode(((codePoint >> shift) & 0x3F) | 0x80);
  }

  function encodeCodePoint(codePoint, strict) {
  	if ((codePoint & 0xFFFFFF80) == 0) { // 1-byte sequence
  		return stringFromCharCode(codePoint);
  	}
  	var symbol = '';
  	if ((codePoint & 0xFFFFF800) == 0) { // 2-byte sequence
  		symbol = stringFromCharCode(((codePoint >> 6) & 0x1F) | 0xC0);
  	}
  	else if ((codePoint & 0xFFFF0000) == 0) { // 3-byte sequence
  		if (!checkScalarValue(codePoint, strict)) {
  			codePoint = 0xFFFD;
  		}
  		symbol = stringFromCharCode(((codePoint >> 12) & 0x0F) | 0xE0);
  		symbol += createByte(codePoint, 6);
  	}
  	else if ((codePoint & 0xFFE00000) == 0) { // 4-byte sequence
  		symbol = stringFromCharCode(((codePoint >> 18) & 0x07) | 0xF0);
  		symbol += createByte(codePoint, 12);
  		symbol += createByte(codePoint, 6);
  	}
  	symbol += stringFromCharCode((codePoint & 0x3F) | 0x80);
  	return symbol;
  }

  function utf8encode(string, opts) {
  	opts = opts || {};
  	var strict = false !== opts.strict;

  	var codePoints = ucs2decode(string);
  	var length = codePoints.length;
  	var index = -1;
  	var codePoint;
  	var byteString = '';
  	while (++index < length) {
  		codePoint = codePoints[index];
  		byteString += encodeCodePoint(codePoint, strict);
  	}
  	return byteString;
  }

  /*--------------------------------------------------------------------------*/

  function readContinuationByte() {
  	if (byteIndex >= byteCount) {
  		throw Error('Invalid byte index');
  	}

  	var continuationByte = byteArray[byteIndex] & 0xFF;
  	byteIndex++;

  	if ((continuationByte & 0xC0) == 0x80) {
  		return continuationByte & 0x3F;
  	}

  	// If we end up here, it’s not a continuation byte
  	throw Error('Invalid continuation byte');
  }

  function decodeSymbol(strict) {
  	var byte1;
  	var byte2;
  	var byte3;
  	var byte4;
  	var codePoint;

  	if (byteIndex > byteCount) {
  		throw Error('Invalid byte index');
  	}

  	if (byteIndex == byteCount) {
  		return false;
  	}

  	// Read first byte
  	byte1 = byteArray[byteIndex] & 0xFF;
  	byteIndex++;

  	// 1-byte sequence (no continuation bytes)
  	if ((byte1 & 0x80) == 0) {
  		return byte1;
  	}

  	// 2-byte sequence
  	if ((byte1 & 0xE0) == 0xC0) {
  		byte2 = readContinuationByte();
  		codePoint = ((byte1 & 0x1F) << 6) | byte2;
  		if (codePoint >= 0x80) {
  			return codePoint;
  		} else {
  			throw Error('Invalid continuation byte');
  		}
  	}

  	// 3-byte sequence (may include unpaired surrogates)
  	if ((byte1 & 0xF0) == 0xE0) {
  		byte2 = readContinuationByte();
  		byte3 = readContinuationByte();
  		codePoint = ((byte1 & 0x0F) << 12) | (byte2 << 6) | byte3;
  		if (codePoint >= 0x0800) {
  			return checkScalarValue(codePoint, strict) ? codePoint : 0xFFFD;
  		} else {
  			throw Error('Invalid continuation byte');
  		}
  	}

  	// 4-byte sequence
  	if ((byte1 & 0xF8) == 0xF0) {
  		byte2 = readContinuationByte();
  		byte3 = readContinuationByte();
  		byte4 = readContinuationByte();
  		codePoint = ((byte1 & 0x07) << 0x12) | (byte2 << 0x0C) |
  			(byte3 << 0x06) | byte4;
  		if (codePoint >= 0x010000 && codePoint <= 0x10FFFF) {
  			return codePoint;
  		}
  	}

  	throw Error('Invalid UTF-8 detected');
  }

  var byteArray;
  var byteCount;
  var byteIndex;
  function utf8decode(byteString, opts) {
  	opts = opts || {};
  	var strict = false !== opts.strict;

  	byteArray = ucs2decode(byteString);
  	byteCount = byteArray.length;
  	byteIndex = 0;
  	var codePoints = [];
  	var tmp;
  	while ((tmp = decodeSymbol(strict)) !== false) {
  		codePoints.push(tmp);
  	}
  	return ucs2encode(codePoints);
  }

  var utf8 = {
  	version: '2.1.2',
  	encode: utf8encode,
  	decode: utf8decode
  };

  var base64Arraybuffer = createCommonjsModule$1(function (module, exports) {
  /*
   * base64-arraybuffer
   * https://github.com/niklasvh/base64-arraybuffer
   *
   * Copyright (c) 2012 Niklas von Hertzen
   * Licensed under the MIT license.
   */
  (function(){

    var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

    // Use a lookup table to find the index.
    var lookup = new Uint8Array(256);
    for (var i = 0; i < chars.length; i++) {
      lookup[chars.charCodeAt(i)] = i;
    }

    exports.encode = function(arraybuffer) {
      var bytes = new Uint8Array(arraybuffer),
      i, len = bytes.length, base64 = "";

      for (i = 0; i < len; i+=3) {
        base64 += chars[bytes[i] >> 2];
        base64 += chars[((bytes[i] & 3) << 4) | (bytes[i + 1] >> 4)];
        base64 += chars[((bytes[i + 1] & 15) << 2) | (bytes[i + 2] >> 6)];
        base64 += chars[bytes[i + 2] & 63];
      }

      if ((len % 3) === 2) {
        base64 = base64.substring(0, base64.length - 1) + "=";
      } else if (len % 3 === 1) {
        base64 = base64.substring(0, base64.length - 2) + "==";
      }

      return base64;
    };

    exports.decode =  function(base64) {
      var bufferLength = base64.length * 0.75,
      len = base64.length, i, p = 0,
      encoded1, encoded2, encoded3, encoded4;

      if (base64[base64.length - 1] === "=") {
        bufferLength--;
        if (base64[base64.length - 2] === "=") {
          bufferLength--;
        }
      }

      var arraybuffer = new ArrayBuffer(bufferLength),
      bytes = new Uint8Array(arraybuffer);

      for (i = 0; i < len; i+=4) {
        encoded1 = lookup[base64.charCodeAt(i)];
        encoded2 = lookup[base64.charCodeAt(i+1)];
        encoded3 = lookup[base64.charCodeAt(i+2)];
        encoded4 = lookup[base64.charCodeAt(i+3)];

        bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
        bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
        bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
      }

      return arraybuffer;
    };
  })();
  });
  var base64Arraybuffer_1 = base64Arraybuffer.encode;
  var base64Arraybuffer_2 = base64Arraybuffer.decode;

  /**
   * Create a blob builder even when vendor prefixes exist
   */

  var BlobBuilder = typeof BlobBuilder !== 'undefined' ? BlobBuilder :
    typeof WebKitBlobBuilder !== 'undefined' ? WebKitBlobBuilder :
    typeof MSBlobBuilder !== 'undefined' ? MSBlobBuilder :
    typeof MozBlobBuilder !== 'undefined' ? MozBlobBuilder : 
    false;

  /**
   * Check if Blob constructor is supported
   */

  var blobSupported = (function() {
    try {
      var a = new Blob(['hi']);
      return a.size === 2;
    } catch(e) {
      return false;
    }
  })();

  /**
   * Check if Blob constructor supports ArrayBufferViews
   * Fails in Safari 6, so we need to map to ArrayBuffers there.
   */

  var blobSupportsArrayBufferView = blobSupported && (function() {
    try {
      var b = new Blob([new Uint8Array([1,2])]);
      return b.size === 2;
    } catch(e) {
      return false;
    }
  })();

  /**
   * Check if BlobBuilder is supported
   */

  var blobBuilderSupported = BlobBuilder
    && BlobBuilder.prototype.append
    && BlobBuilder.prototype.getBlob;

  /**
   * Helper function that maps ArrayBufferViews to ArrayBuffers
   * Used by BlobBuilder constructor and old browsers that didn't
   * support it in the Blob constructor.
   */

  function mapArrayBufferViews(ary) {
    return ary.map(function(chunk) {
      if (chunk.buffer instanceof ArrayBuffer) {
        var buf = chunk.buffer;

        // if this is a subarray, make a copy so we only
        // include the subarray region from the underlying buffer
        if (chunk.byteLength !== buf.byteLength) {
          var copy = new Uint8Array(chunk.byteLength);
          copy.set(new Uint8Array(buf, chunk.byteOffset, chunk.byteLength));
          buf = copy.buffer;
        }

        return buf;
      }

      return chunk;
    });
  }

  function BlobBuilderConstructor(ary, options) {
    options = options || {};

    var bb = new BlobBuilder();
    mapArrayBufferViews(ary).forEach(function(part) {
      bb.append(part);
    });

    return (options.type) ? bb.getBlob(options.type) : bb.getBlob();
  }
  function BlobConstructor(ary, options) {
    return new Blob(mapArrayBufferViews(ary), options || {});
  }
  if (typeof Blob !== 'undefined') {
    BlobBuilderConstructor.prototype = Blob.prototype;
    BlobConstructor.prototype = Blob.prototype;
  }

  var blob = (function() {
    if (blobSupported) {
      return blobSupportsArrayBufferView ? Blob : BlobConstructor;
    } else if (blobBuilderSupported) {
      return BlobBuilderConstructor;
    } else {
      return undefined;
    }
  })();

  var browser$2 = createCommonjsModule$1(function (module, exports) {
  /**
   * Module dependencies.
   */







  var base64encoder;
  if (typeof ArrayBuffer !== 'undefined') {
    base64encoder = base64Arraybuffer;
  }

  /**
   * Check if we are running an android browser. That requires us to use
   * ArrayBuffer with polling transports...
   *
   * http://ghinda.net/jpeg-blob-ajax-android/
   */

  var isAndroid = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);

  /**
   * Check if we are running in PhantomJS.
   * Uploading a Blob with PhantomJS does not work correctly, as reported here:
   * https://github.com/ariya/phantomjs/issues/11395
   * @type boolean
   */
  var isPhantomJS = typeof navigator !== 'undefined' && /PhantomJS/i.test(navigator.userAgent);

  /**
   * When true, avoids using Blobs to encode payloads.
   * @type boolean
   */
  var dontSendBlobs = isAndroid || isPhantomJS;

  /**
   * Current protocol version.
   */

  exports.protocol = 3;

  /**
   * Packet types.
   */

  var packets = exports.packets = {
      open:     0    // non-ws
    , close:    1    // non-ws
    , ping:     2
    , pong:     3
    , message:  4
    , upgrade:  5
    , noop:     6
  };

  var packetslist = keys(packets);

  /**
   * Premade error packet.
   */

  var err = { type: 'error', data: 'parser error' };

  /**
   * Create a blob api even for blob builder when vendor prefixes exist
   */



  /**
   * Encodes a packet.
   *
   *     <packet type id> [ <data> ]
   *
   * Example:
   *
   *     5hello world
   *     3
   *     4
   *
   * Binary is encoded in an identical principle
   *
   * @api private
   */

  exports.encodePacket = function (packet, supportsBinary, utf8encode, callback) {
    if (typeof supportsBinary === 'function') {
      callback = supportsBinary;
      supportsBinary = false;
    }

    if (typeof utf8encode === 'function') {
      callback = utf8encode;
      utf8encode = null;
    }

    var data = (packet.data === undefined)
      ? undefined
      : packet.data.buffer || packet.data;

    if (typeof ArrayBuffer !== 'undefined' && data instanceof ArrayBuffer) {
      return encodeArrayBuffer(packet, supportsBinary, callback);
    } else if (typeof blob !== 'undefined' && data instanceof blob) {
      return encodeBlob(packet, supportsBinary, callback);
    }

    // might be an object with { base64: true, data: dataAsBase64String }
    if (data && data.base64) {
      return encodeBase64Object(packet, callback);
    }

    // Sending data as a utf-8 string
    var encoded = packets[packet.type];

    // data fragment is optional
    if (undefined !== packet.data) {
      encoded += utf8encode ? utf8.encode(String(packet.data), { strict: false }) : String(packet.data);
    }

    return callback('' + encoded);

  };

  function encodeBase64Object(packet, callback) {
    // packet data is an object { base64: true, data: dataAsBase64String }
    var message = 'b' + exports.packets[packet.type] + packet.data.data;
    return callback(message);
  }

  /**
   * Encode packet helpers for binary types
   */

  function encodeArrayBuffer(packet, supportsBinary, callback) {
    if (!supportsBinary) {
      return exports.encodeBase64Packet(packet, callback);
    }

    var data = packet.data;
    var contentArray = new Uint8Array(data);
    var resultBuffer = new Uint8Array(1 + data.byteLength);

    resultBuffer[0] = packets[packet.type];
    for (var i = 0; i < contentArray.length; i++) {
      resultBuffer[i+1] = contentArray[i];
    }

    return callback(resultBuffer.buffer);
  }

  function encodeBlobAsArrayBuffer(packet, supportsBinary, callback) {
    if (!supportsBinary) {
      return exports.encodeBase64Packet(packet, callback);
    }

    var fr = new FileReader();
    fr.onload = function() {
      exports.encodePacket({ type: packet.type, data: fr.result }, supportsBinary, true, callback);
    };
    return fr.readAsArrayBuffer(packet.data);
  }

  function encodeBlob(packet, supportsBinary, callback) {
    if (!supportsBinary) {
      return exports.encodeBase64Packet(packet, callback);
    }

    if (dontSendBlobs) {
      return encodeBlobAsArrayBuffer(packet, supportsBinary, callback);
    }

    var length = new Uint8Array(1);
    length[0] = packets[packet.type];
    var blob$1 = new blob([length.buffer, packet.data]);

    return callback(blob$1);
  }

  /**
   * Encodes a packet with binary data in a base64 string
   *
   * @param {Object} packet, has `type` and `data`
   * @return {String} base64 encoded message
   */

  exports.encodeBase64Packet = function(packet, callback) {
    var message = 'b' + exports.packets[packet.type];
    if (typeof blob !== 'undefined' && packet.data instanceof blob) {
      var fr = new FileReader();
      fr.onload = function() {
        var b64 = fr.result.split(',')[1];
        callback(message + b64);
      };
      return fr.readAsDataURL(packet.data);
    }

    var b64data;
    try {
      b64data = String.fromCharCode.apply(null, new Uint8Array(packet.data));
    } catch (e) {
      // iPhone Safari doesn't let you apply with typed arrays
      var typed = new Uint8Array(packet.data);
      var basic = new Array(typed.length);
      for (var i = 0; i < typed.length; i++) {
        basic[i] = typed[i];
      }
      b64data = String.fromCharCode.apply(null, basic);
    }
    message += btoa(b64data);
    return callback(message);
  };

  /**
   * Decodes a packet. Changes format to Blob if requested.
   *
   * @return {Object} with `type` and `data` (if any)
   * @api private
   */

  exports.decodePacket = function (data, binaryType, utf8decode) {
    if (data === undefined) {
      return err;
    }
    // String data
    if (typeof data === 'string') {
      if (data.charAt(0) === 'b') {
        return exports.decodeBase64Packet(data.substr(1), binaryType);
      }

      if (utf8decode) {
        data = tryDecode(data);
        if (data === false) {
          return err;
        }
      }
      var type = data.charAt(0);

      if (Number(type) != type || !packetslist[type]) {
        return err;
      }

      if (data.length > 1) {
        return { type: packetslist[type], data: data.substring(1) };
      } else {
        return { type: packetslist[type] };
      }
    }

    var asArray = new Uint8Array(data);
    var type = asArray[0];
    var rest = arraybuffer_slice(data, 1);
    if (blob && binaryType === 'blob') {
      rest = new blob([rest]);
    }
    return { type: packetslist[type], data: rest };
  };

  function tryDecode(data) {
    try {
      data = utf8.decode(data, { strict: false });
    } catch (e) {
      return false;
    }
    return data;
  }

  /**
   * Decodes a packet encoded in a base64 string
   *
   * @param {String} base64 encoded message
   * @return {Object} with `type` and `data` (if any)
   */

  exports.decodeBase64Packet = function(msg, binaryType) {
    var type = packetslist[msg.charAt(0)];
    if (!base64encoder) {
      return { type: type, data: { base64: true, data: msg.substr(1) } };
    }

    var data = base64encoder.decode(msg.substr(1));

    if (binaryType === 'blob' && blob) {
      data = new blob([data]);
    }

    return { type: type, data: data };
  };

  /**
   * Encodes multiple messages (payload).
   *
   *     <length>:data
   *
   * Example:
   *
   *     11:hello world2:hi
   *
   * If any contents are binary, they will be encoded as base64 strings. Base64
   * encoded strings are marked with a b before the length specifier
   *
   * @param {Array} packets
   * @api private
   */

  exports.encodePayload = function (packets, supportsBinary, callback) {
    if (typeof supportsBinary === 'function') {
      callback = supportsBinary;
      supportsBinary = null;
    }

    var isBinary = hasBinary2(packets);

    if (supportsBinary && isBinary) {
      if (blob && !dontSendBlobs) {
        return exports.encodePayloadAsBlob(packets, callback);
      }

      return exports.encodePayloadAsArrayBuffer(packets, callback);
    }

    if (!packets.length) {
      return callback('0:');
    }

    function setLengthHeader(message) {
      return message.length + ':' + message;
    }

    function encodeOne(packet, doneCallback) {
      exports.encodePacket(packet, !isBinary ? false : supportsBinary, false, function(message) {
        doneCallback(null, setLengthHeader(message));
      });
    }

    map(packets, encodeOne, function(err, results) {
      return callback(results.join(''));
    });
  };

  /**
   * Async array map using after
   */

  function map(ary, each, done) {
    var result = new Array(ary.length);
    var next = after_1(ary.length, done);

    var eachWithIndex = function(i, el, cb) {
      each(el, function(error, msg) {
        result[i] = msg;
        cb(error, result);
      });
    };

    for (var i = 0; i < ary.length; i++) {
      eachWithIndex(i, ary[i], next);
    }
  }

  /*
   * Decodes data when a payload is maybe expected. Possible binary contents are
   * decoded from their base64 representation
   *
   * @param {String} data, callback method
   * @api public
   */

  exports.decodePayload = function (data, binaryType, callback) {
    if (typeof data !== 'string') {
      return exports.decodePayloadAsBinary(data, binaryType, callback);
    }

    if (typeof binaryType === 'function') {
      callback = binaryType;
      binaryType = null;
    }

    var packet;
    if (data === '') {
      // parser error - ignoring payload
      return callback(err, 0, 1);
    }

    var length = '', n, msg;

    for (var i = 0, l = data.length; i < l; i++) {
      var chr = data.charAt(i);

      if (chr !== ':') {
        length += chr;
        continue;
      }

      if (length === '' || (length != (n = Number(length)))) {
        // parser error - ignoring payload
        return callback(err, 0, 1);
      }

      msg = data.substr(i + 1, n);

      if (length != msg.length) {
        // parser error - ignoring payload
        return callback(err, 0, 1);
      }

      if (msg.length) {
        packet = exports.decodePacket(msg, binaryType, false);

        if (err.type === packet.type && err.data === packet.data) {
          // parser error in individual packet - ignoring payload
          return callback(err, 0, 1);
        }

        var ret = callback(packet, i + n, l);
        if (false === ret) return;
      }

      // advance cursor
      i += n;
      length = '';
    }

    if (length !== '') {
      // parser error - ignoring payload
      return callback(err, 0, 1);
    }

  };

  /**
   * Encodes multiple messages (payload) as binary.
   *
   * <1 = binary, 0 = string><number from 0-9><number from 0-9>[...]<number
   * 255><data>
   *
   * Example:
   * 1 3 255 1 2 3, if the binary contents are interpreted as 8 bit integers
   *
   * @param {Array} packets
   * @return {ArrayBuffer} encoded payload
   * @api private
   */

  exports.encodePayloadAsArrayBuffer = function(packets, callback) {
    if (!packets.length) {
      return callback(new ArrayBuffer(0));
    }

    function encodeOne(packet, doneCallback) {
      exports.encodePacket(packet, true, true, function(data) {
        return doneCallback(null, data);
      });
    }

    map(packets, encodeOne, function(err, encodedPackets) {
      var totalLength = encodedPackets.reduce(function(acc, p) {
        var len;
        if (typeof p === 'string'){
          len = p.length;
        } else {
          len = p.byteLength;
        }
        return acc + len.toString().length + len + 2; // string/binary identifier + separator = 2
      }, 0);

      var resultArray = new Uint8Array(totalLength);

      var bufferIndex = 0;
      encodedPackets.forEach(function(p) {
        var isString = typeof p === 'string';
        var ab = p;
        if (isString) {
          var view = new Uint8Array(p.length);
          for (var i = 0; i < p.length; i++) {
            view[i] = p.charCodeAt(i);
          }
          ab = view.buffer;
        }

        if (isString) { // not true binary
          resultArray[bufferIndex++] = 0;
        } else { // true binary
          resultArray[bufferIndex++] = 1;
        }

        var lenStr = ab.byteLength.toString();
        for (var i = 0; i < lenStr.length; i++) {
          resultArray[bufferIndex++] = parseInt(lenStr[i]);
        }
        resultArray[bufferIndex++] = 255;

        var view = new Uint8Array(ab);
        for (var i = 0; i < view.length; i++) {
          resultArray[bufferIndex++] = view[i];
        }
      });

      return callback(resultArray.buffer);
    });
  };

  /**
   * Encode as Blob
   */

  exports.encodePayloadAsBlob = function(packets, callback) {
    function encodeOne(packet, doneCallback) {
      exports.encodePacket(packet, true, true, function(encoded) {
        var binaryIdentifier = new Uint8Array(1);
        binaryIdentifier[0] = 1;
        if (typeof encoded === 'string') {
          var view = new Uint8Array(encoded.length);
          for (var i = 0; i < encoded.length; i++) {
            view[i] = encoded.charCodeAt(i);
          }
          encoded = view.buffer;
          binaryIdentifier[0] = 0;
        }

        var len = (encoded instanceof ArrayBuffer)
          ? encoded.byteLength
          : encoded.size;

        var lenStr = len.toString();
        var lengthAry = new Uint8Array(lenStr.length + 1);
        for (var i = 0; i < lenStr.length; i++) {
          lengthAry[i] = parseInt(lenStr[i]);
        }
        lengthAry[lenStr.length] = 255;

        if (blob) {
          var blob$1 = new blob([binaryIdentifier.buffer, lengthAry.buffer, encoded]);
          doneCallback(null, blob$1);
        }
      });
    }

    map(packets, encodeOne, function(err, results) {
      return callback(new blob(results));
    });
  };

  /*
   * Decodes data when a payload is maybe expected. Strings are decoded by
   * interpreting each byte as a key code for entries marked to start with 0. See
   * description of encodePayloadAsBinary
   *
   * @param {ArrayBuffer} data, callback method
   * @api public
   */

  exports.decodePayloadAsBinary = function (data, binaryType, callback) {
    if (typeof binaryType === 'function') {
      callback = binaryType;
      binaryType = null;
    }

    var bufferTail = data;
    var buffers = [];

    while (bufferTail.byteLength > 0) {
      var tailArray = new Uint8Array(bufferTail);
      var isString = tailArray[0] === 0;
      var msgLength = '';

      for (var i = 1; ; i++) {
        if (tailArray[i] === 255) break;

        // 310 = char length of Number.MAX_VALUE
        if (msgLength.length > 310) {
          return callback(err, 0, 1);
        }

        msgLength += tailArray[i];
      }

      bufferTail = arraybuffer_slice(bufferTail, 2 + msgLength.length);
      msgLength = parseInt(msgLength);

      var msg = arraybuffer_slice(bufferTail, 0, msgLength);
      if (isString) {
        try {
          msg = String.fromCharCode.apply(null, new Uint8Array(msg));
        } catch (e) {
          // iPhone Safari doesn't let you apply to typed arrays
          var typed = new Uint8Array(msg);
          msg = '';
          for (var i = 0; i < typed.length; i++) {
            msg += String.fromCharCode(typed[i]);
          }
        }
      }

      buffers.push(msg);
      bufferTail = arraybuffer_slice(bufferTail, msgLength);
    }

    var total = buffers.length;
    buffers.forEach(function(buffer, i) {
      callback(exports.decodePacket(buffer, binaryType, true), i, total);
    });
  };
  });
  var browser_1$2 = browser$2.protocol;
  var browser_2$2 = browser$2.packets;
  var browser_3$2 = browser$2.encodePacket;
  var browser_4$2 = browser$2.encodeBase64Packet;
  var browser_5$2 = browser$2.decodePacket;
  var browser_6$2 = browser$2.decodeBase64Packet;
  var browser_7$2 = browser$2.encodePayload;
  var browser_8 = browser$2.decodePayload;
  var browser_9 = browser$2.encodePayloadAsArrayBuffer;
  var browser_10 = browser$2.encodePayloadAsBlob;
  var browser_11 = browser$2.decodePayloadAsBinary;

  /**
   * Module dependencies.
   */




  /**
   * Module exports.
   */

  var transport = Transport;

  /**
   * Transport abstract constructor.
   *
   * @param {Object} options.
   * @api private
   */

  function Transport (opts) {
    this.path = opts.path;
    this.hostname = opts.hostname;
    this.port = opts.port;
    this.secure = opts.secure;
    this.query = opts.query;
    this.timestampParam = opts.timestampParam;
    this.timestampRequests = opts.timestampRequests;
    this.readyState = '';
    this.agent = opts.agent || false;
    this.socket = opts.socket;
    this.enablesXDR = opts.enablesXDR;
    this.withCredentials = opts.withCredentials;

    // SSL options for Node.js client
    this.pfx = opts.pfx;
    this.key = opts.key;
    this.passphrase = opts.passphrase;
    this.cert = opts.cert;
    this.ca = opts.ca;
    this.ciphers = opts.ciphers;
    this.rejectUnauthorized = opts.rejectUnauthorized;
    this.forceNode = opts.forceNode;

    // results of ReactNative environment detection
    this.isReactNative = opts.isReactNative;

    // other options for Node.js client
    this.extraHeaders = opts.extraHeaders;
    this.localAddress = opts.localAddress;
  }

  /**
   * Mix in `Emitter`.
   */

  componentEmitter(Transport.prototype);

  /**
   * Emits an error.
   *
   * @param {String} str
   * @return {Transport} for chaining
   * @api public
   */

  Transport.prototype.onError = function (msg, desc) {
    var err = new Error(msg);
    err.type = 'TransportError';
    err.description = desc;
    this.emit('error', err);
    return this;
  };

  /**
   * Opens the transport.
   *
   * @api public
   */

  Transport.prototype.open = function () {
    if ('closed' === this.readyState || '' === this.readyState) {
      this.readyState = 'opening';
      this.doOpen();
    }

    return this;
  };

  /**
   * Closes the transport.
   *
   * @api private
   */

  Transport.prototype.close = function () {
    if ('opening' === this.readyState || 'open' === this.readyState) {
      this.doClose();
      this.onClose();
    }

    return this;
  };

  /**
   * Sends multiple packets.
   *
   * @param {Array} packets
   * @api private
   */

  Transport.prototype.send = function (packets) {
    if ('open' === this.readyState) {
      this.write(packets);
    } else {
      throw new Error('Transport not open');
    }
  };

  /**
   * Called upon open
   *
   * @api private
   */

  Transport.prototype.onOpen = function () {
    this.readyState = 'open';
    this.writable = true;
    this.emit('open');
  };

  /**
   * Called with data.
   *
   * @param {String} data
   * @api private
   */

  Transport.prototype.onData = function (data) {
    var packet = browser$2.decodePacket(data, this.socket.binaryType);
    this.onPacket(packet);
  };

  /**
   * Called with a decoded packet.
   */

  Transport.prototype.onPacket = function (packet) {
    this.emit('packet', packet);
  };

  /**
   * Called upon close.
   *
   * @api private
   */

  Transport.prototype.onClose = function () {
    this.readyState = 'closed';
    this.emit('close');
  };

  /**
   * Compiles a querystring
   * Returns string representation of the object
   *
   * @param {Object}
   * @api private
   */

  var encode = function (obj) {
    var str = '';

    for (var i in obj) {
      if (obj.hasOwnProperty(i)) {
        if (str.length) str += '&';
        str += encodeURIComponent(i) + '=' + encodeURIComponent(obj[i]);
      }
    }

    return str;
  };

  /**
   * Parses a simple querystring into an object
   *
   * @param {String} qs
   * @api private
   */

  var decode = function(qs){
    var qry = {};
    var pairs = qs.split('&');
    for (var i = 0, l = pairs.length; i < l; i++) {
      var pair = pairs[i].split('=');
      qry[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
    }
    return qry;
  };

  var parseqs = {
  	encode: encode,
  	decode: decode
  };

  var componentInherit = function(a, b){
    var fn = function(){};
    fn.prototype = b.prototype;
    a.prototype = new fn;
    a.prototype.constructor = a;
  };

  var alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_'.split('')
    , length = 64
    , map = {}
    , seed = 0
    , i$1 = 0
    , prev;

  /**
   * Return a string representing the specified number.
   *
   * @param {Number} num The number to convert.
   * @returns {String} The string representation of the number.
   * @api public
   */
  function encode$1(num) {
    var encoded = '';

    do {
      encoded = alphabet[num % length] + encoded;
      num = Math.floor(num / length);
    } while (num > 0);

    return encoded;
  }

  /**
   * Return the integer value specified by the given string.
   *
   * @param {String} str The string to convert.
   * @returns {Number} The integer value represented by the string.
   * @api public
   */
  function decode$1(str) {
    var decoded = 0;

    for (i$1 = 0; i$1 < str.length; i$1++) {
      decoded = decoded * length + map[str.charAt(i$1)];
    }

    return decoded;
  }

  /**
   * Yeast: A tiny growing id generator.
   *
   * @returns {String} A unique id.
   * @api public
   */
  function yeast() {
    var now = encode$1(+new Date());

    if (now !== prev) return seed = 0, prev = now;
    return now +'.'+ encode$1(seed++);
  }

  //
  // Map each character to its index.
  //
  for (; i$1 < length; i$1++) map[alphabet[i$1]] = i$1;

  //
  // Expose the `yeast`, `encode` and `decode` functions.
  //
  yeast.encode = encode$1;
  yeast.decode = decode$1;
  var yeast_1 = yeast;

  /**
   * Module dependencies.
   */






  var debug$2 = browser('engine.io-client:polling');

  /**
   * Module exports.
   */

  var polling = Polling;

  /**
   * Is XHR2 supported?
   */

  var hasXHR2 = (function () {
    var XMLHttpRequest = xmlhttprequest;
    var xhr = new XMLHttpRequest({ xdomain: false });
    return null != xhr.responseType;
  })();

  /**
   * Polling interface.
   *
   * @param {Object} opts
   * @api private
   */

  function Polling (opts) {
    var forceBase64 = (opts && opts.forceBase64);
    if (!hasXHR2 || forceBase64) {
      this.supportsBinary = false;
    }
    transport.call(this, opts);
  }

  /**
   * Inherits from Transport.
   */

  componentInherit(Polling, transport);

  /**
   * Transport name.
   */

  Polling.prototype.name = 'polling';

  /**
   * Opens the socket (triggers polling). We write a PING message to determine
   * when the transport is open.
   *
   * @api private
   */

  Polling.prototype.doOpen = function () {
    this.poll();
  };

  /**
   * Pauses polling.
   *
   * @param {Function} callback upon buffers are flushed and transport is paused
   * @api private
   */

  Polling.prototype.pause = function (onPause) {
    var self = this;

    this.readyState = 'pausing';

    function pause () {
      debug$2('paused');
      self.readyState = 'paused';
      onPause();
    }

    if (this.polling || !this.writable) {
      var total = 0;

      if (this.polling) {
        debug$2('we are currently polling - waiting to pause');
        total++;
        this.once('pollComplete', function () {
          debug$2('pre-pause polling complete');
          --total || pause();
        });
      }

      if (!this.writable) {
        debug$2('we are currently writing - waiting to pause');
        total++;
        this.once('drain', function () {
          debug$2('pre-pause writing complete');
          --total || pause();
        });
      }
    } else {
      pause();
    }
  };

  /**
   * Starts polling cycle.
   *
   * @api public
   */

  Polling.prototype.poll = function () {
    debug$2('polling');
    this.polling = true;
    this.doPoll();
    this.emit('poll');
  };

  /**
   * Overloads onData to detect payloads.
   *
   * @api private
   */

  Polling.prototype.onData = function (data) {
    var self = this;
    debug$2('polling got data %s', data);
    var callback = function (packet, index, total) {
      // if its the first message we consider the transport open
      if ('opening' === self.readyState) {
        self.onOpen();
      }

      // if its a close packet, we close the ongoing requests
      if ('close' === packet.type) {
        self.onClose();
        return false;
      }

      // otherwise bypass onData and handle the message
      self.onPacket(packet);
    };

    // decode payload
    browser$2.decodePayload(data, this.socket.binaryType, callback);

    // if an event did not trigger closing
    if ('closed' !== this.readyState) {
      // if we got data we're not polling
      this.polling = false;
      this.emit('pollComplete');

      if ('open' === this.readyState) {
        this.poll();
      } else {
        debug$2('ignoring poll - transport state "%s"', this.readyState);
      }
    }
  };

  /**
   * For polling, send a close packet.
   *
   * @api private
   */

  Polling.prototype.doClose = function () {
    var self = this;

    function close () {
      debug$2('writing close packet');
      self.write([{ type: 'close' }]);
    }

    if ('open' === this.readyState) {
      debug$2('transport open - closing');
      close();
    } else {
      // in case we're trying to close while
      // handshaking is in progress (GH-164)
      debug$2('transport not open - deferring close');
      this.once('open', close);
    }
  };

  /**
   * Writes a packets payload.
   *
   * @param {Array} data packets
   * @param {Function} drain callback
   * @api private
   */

  Polling.prototype.write = function (packets) {
    var self = this;
    this.writable = false;
    var callbackfn = function () {
      self.writable = true;
      self.emit('drain');
    };

    browser$2.encodePayload(packets, this.supportsBinary, function (data) {
      self.doWrite(data, callbackfn);
    });
  };

  /**
   * Generates uri for connection.
   *
   * @api private
   */

  Polling.prototype.uri = function () {
    var query = this.query || {};
    var schema = this.secure ? 'https' : 'http';
    var port = '';

    // cache busting is forced
    if (false !== this.timestampRequests) {
      query[this.timestampParam] = yeast_1();
    }

    if (!this.supportsBinary && !query.sid) {
      query.b64 = 1;
    }

    query = parseqs.encode(query);

    // avoid port if default for schema
    if (this.port && (('https' === schema && Number(this.port) !== 443) ||
       ('http' === schema && Number(this.port) !== 80))) {
      port = ':' + this.port;
    }

    // prepend ? to query
    if (query.length) {
      query = '?' + query;
    }

    var ipv6 = this.hostname.indexOf(':') !== -1;
    return schema + '://' + (ipv6 ? '[' + this.hostname + ']' : this.hostname) + port + this.path + query;
  };

  /* global attachEvent */

  /**
   * Module requirements.
   */





  var debug$3 = browser('engine.io-client:polling-xhr');

  /**
   * Module exports.
   */

  var pollingXhr = XHR;
  var Request_1 = Request;

  /**
   * Empty function
   */

  function empty () {}

  /**
   * XHR Polling constructor.
   *
   * @param {Object} opts
   * @api public
   */

  function XHR (opts) {
    polling.call(this, opts);
    this.requestTimeout = opts.requestTimeout;
    this.extraHeaders = opts.extraHeaders;

    if (typeof location !== 'undefined') {
      var isSSL = 'https:' === location.protocol;
      var port = location.port;

      // some user agents have empty `location.port`
      if (!port) {
        port = isSSL ? 443 : 80;
      }

      this.xd = (typeof location !== 'undefined' && opts.hostname !== location.hostname) ||
        port !== opts.port;
      this.xs = opts.secure !== isSSL;
    }
  }

  /**
   * Inherits from Polling.
   */

  componentInherit(XHR, polling);

  /**
   * XHR supports binary
   */

  XHR.prototype.supportsBinary = true;

  /**
   * Creates a request.
   *
   * @param {String} method
   * @api private
   */

  XHR.prototype.request = function (opts) {
    opts = opts || {};
    opts.uri = this.uri();
    opts.xd = this.xd;
    opts.xs = this.xs;
    opts.agent = this.agent || false;
    opts.supportsBinary = this.supportsBinary;
    opts.enablesXDR = this.enablesXDR;
    opts.withCredentials = this.withCredentials;

    // SSL options for Node.js client
    opts.pfx = this.pfx;
    opts.key = this.key;
    opts.passphrase = this.passphrase;
    opts.cert = this.cert;
    opts.ca = this.ca;
    opts.ciphers = this.ciphers;
    opts.rejectUnauthorized = this.rejectUnauthorized;
    opts.requestTimeout = this.requestTimeout;

    // other options for Node.js client
    opts.extraHeaders = this.extraHeaders;

    return new Request(opts);
  };

  /**
   * Sends data.
   *
   * @param {String} data to send.
   * @param {Function} called upon flush.
   * @api private
   */

  XHR.prototype.doWrite = function (data, fn) {
    var isBinary = typeof data !== 'string' && data !== undefined;
    var req = this.request({ method: 'POST', data: data, isBinary: isBinary });
    var self = this;
    req.on('success', fn);
    req.on('error', function (err) {
      self.onError('xhr post error', err);
    });
    this.sendXhr = req;
  };

  /**
   * Starts a poll cycle.
   *
   * @api private
   */

  XHR.prototype.doPoll = function () {
    debug$3('xhr poll');
    var req = this.request();
    var self = this;
    req.on('data', function (data) {
      self.onData(data);
    });
    req.on('error', function (err) {
      self.onError('xhr poll error', err);
    });
    this.pollXhr = req;
  };

  /**
   * Request constructor
   *
   * @param {Object} options
   * @api public
   */

  function Request (opts) {
    this.method = opts.method || 'GET';
    this.uri = opts.uri;
    this.xd = !!opts.xd;
    this.xs = !!opts.xs;
    this.async = false !== opts.async;
    this.data = undefined !== opts.data ? opts.data : null;
    this.agent = opts.agent;
    this.isBinary = opts.isBinary;
    this.supportsBinary = opts.supportsBinary;
    this.enablesXDR = opts.enablesXDR;
    this.withCredentials = opts.withCredentials;
    this.requestTimeout = opts.requestTimeout;

    // SSL options for Node.js client
    this.pfx = opts.pfx;
    this.key = opts.key;
    this.passphrase = opts.passphrase;
    this.cert = opts.cert;
    this.ca = opts.ca;
    this.ciphers = opts.ciphers;
    this.rejectUnauthorized = opts.rejectUnauthorized;

    // other options for Node.js client
    this.extraHeaders = opts.extraHeaders;

    this.create();
  }

  /**
   * Mix in `Emitter`.
   */

  componentEmitter(Request.prototype);

  /**
   * Creates the XHR object and sends the request.
   *
   * @api private
   */

  Request.prototype.create = function () {
    var opts = { agent: this.agent, xdomain: this.xd, xscheme: this.xs, enablesXDR: this.enablesXDR };

    // SSL options for Node.js client
    opts.pfx = this.pfx;
    opts.key = this.key;
    opts.passphrase = this.passphrase;
    opts.cert = this.cert;
    opts.ca = this.ca;
    opts.ciphers = this.ciphers;
    opts.rejectUnauthorized = this.rejectUnauthorized;

    var xhr = this.xhr = new xmlhttprequest(opts);
    var self = this;

    try {
      debug$3('xhr open %s: %s', this.method, this.uri);
      xhr.open(this.method, this.uri, this.async);
      try {
        if (this.extraHeaders) {
          xhr.setDisableHeaderCheck && xhr.setDisableHeaderCheck(true);
          for (var i in this.extraHeaders) {
            if (this.extraHeaders.hasOwnProperty(i)) {
              xhr.setRequestHeader(i, this.extraHeaders[i]);
            }
          }
        }
      } catch (e) {}

      if ('POST' === this.method) {
        try {
          if (this.isBinary) {
            xhr.setRequestHeader('Content-type', 'application/octet-stream');
          } else {
            xhr.setRequestHeader('Content-type', 'text/plain;charset=UTF-8');
          }
        } catch (e) {}
      }

      try {
        xhr.setRequestHeader('Accept', '*/*');
      } catch (e) {}

      // ie6 check
      if ('withCredentials' in xhr) {
        xhr.withCredentials = this.withCredentials;
      }

      if (this.requestTimeout) {
        xhr.timeout = this.requestTimeout;
      }

      if (this.hasXDR()) {
        xhr.onload = function () {
          self.onLoad();
        };
        xhr.onerror = function () {
          self.onError(xhr.responseText);
        };
      } else {
        xhr.onreadystatechange = function () {
          if (xhr.readyState === 2) {
            try {
              var contentType = xhr.getResponseHeader('Content-Type');
              if (self.supportsBinary && contentType === 'application/octet-stream' || contentType === 'application/octet-stream; charset=UTF-8') {
                xhr.responseType = 'arraybuffer';
              }
            } catch (e) {}
          }
          if (4 !== xhr.readyState) return;
          if (200 === xhr.status || 1223 === xhr.status) {
            self.onLoad();
          } else {
            // make sure the `error` event handler that's user-set
            // does not throw in the same tick and gets caught here
            setTimeout(function () {
              self.onError(typeof xhr.status === 'number' ? xhr.status : 0);
            }, 0);
          }
        };
      }

      debug$3('xhr data %s', this.data);
      xhr.send(this.data);
    } catch (e) {
      // Need to defer since .create() is called directly fhrom the constructor
      // and thus the 'error' event can only be only bound *after* this exception
      // occurs.  Therefore, also, we cannot throw here at all.
      setTimeout(function () {
        self.onError(e);
      }, 0);
      return;
    }

    if (typeof document !== 'undefined') {
      this.index = Request.requestsCount++;
      Request.requests[this.index] = this;
    }
  };

  /**
   * Called upon successful response.
   *
   * @api private
   */

  Request.prototype.onSuccess = function () {
    this.emit('success');
    this.cleanup();
  };

  /**
   * Called if we have data.
   *
   * @api private
   */

  Request.prototype.onData = function (data) {
    this.emit('data', data);
    this.onSuccess();
  };

  /**
   * Called upon error.
   *
   * @api private
   */

  Request.prototype.onError = function (err) {
    this.emit('error', err);
    this.cleanup(true);
  };

  /**
   * Cleans up house.
   *
   * @api private
   */

  Request.prototype.cleanup = function (fromError) {
    if ('undefined' === typeof this.xhr || null === this.xhr) {
      return;
    }
    // xmlhttprequest
    if (this.hasXDR()) {
      this.xhr.onload = this.xhr.onerror = empty;
    } else {
      this.xhr.onreadystatechange = empty;
    }

    if (fromError) {
      try {
        this.xhr.abort();
      } catch (e) {}
    }

    if (typeof document !== 'undefined') {
      delete Request.requests[this.index];
    }

    this.xhr = null;
  };

  /**
   * Called upon load.
   *
   * @api private
   */

  Request.prototype.onLoad = function () {
    var data;
    try {
      var contentType;
      try {
        contentType = this.xhr.getResponseHeader('Content-Type');
      } catch (e) {}
      if (contentType === 'application/octet-stream' || contentType === 'application/octet-stream; charset=UTF-8') {
        data = this.xhr.response || this.xhr.responseText;
      } else {
        data = this.xhr.responseText;
      }
    } catch (e) {
      this.onError(e);
    }
    if (null != data) {
      this.onData(data);
    }
  };

  /**
   * Check if it has XDomainRequest.
   *
   * @api private
   */

  Request.prototype.hasXDR = function () {
    return typeof XDomainRequest !== 'undefined' && !this.xs && this.enablesXDR;
  };

  /**
   * Aborts the request.
   *
   * @api public
   */

  Request.prototype.abort = function () {
    this.cleanup();
  };

  /**
   * Aborts pending requests when unloading the window. This is needed to prevent
   * memory leaks (e.g. when using IE) and to ensure that no spurious error is
   * emitted.
   */

  Request.requestsCount = 0;
  Request.requests = {};

  if (typeof document !== 'undefined') {
    if (typeof attachEvent === 'function') {
      attachEvent('onunload', unloadHandler);
    } else if (typeof addEventListener === 'function') {
      var terminationEvent = 'onpagehide' in self ? 'pagehide' : 'unload';
      addEventListener(terminationEvent, unloadHandler, false);
    }
  }

  function unloadHandler () {
    for (var i in Request.requests) {
      if (Request.requests.hasOwnProperty(i)) {
        Request.requests[i].abort();
      }
    }
  }
  pollingXhr.Request = Request_1;

  /**
   * Module requirements.
   */




  /**
   * Module exports.
   */

  var pollingJsonp = JSONPPolling;

  /**
   * Cached regular expressions.
   */

  var rNewline = /\n/g;
  var rEscapedNewline = /\\n/g;

  /**
   * Global JSONP callbacks.
   */

  var callbacks;

  /**
   * Noop.
   */

  function empty$1 () { }

  /**
   * Until https://github.com/tc39/proposal-global is shipped.
   */
  function glob () {
    return typeof self !== 'undefined' ? self
        : typeof window !== 'undefined' ? window
        : typeof commonjsGlobal !== 'undefined' ? commonjsGlobal : {};
  }

  /**
   * JSONP Polling constructor.
   *
   * @param {Object} opts.
   * @api public
   */

  function JSONPPolling (opts) {
    polling.call(this, opts);

    this.query = this.query || {};

    // define global callbacks array if not present
    // we do this here (lazily) to avoid unneeded global pollution
    if (!callbacks) {
      // we need to consider multiple engines in the same page
      var global = glob();
      callbacks = global.___eio = (global.___eio || []);
    }

    // callback identifier
    this.index = callbacks.length;

    // add callback to jsonp global
    var self = this;
    callbacks.push(function (msg) {
      self.onData(msg);
    });

    // append to query string
    this.query.j = this.index;

    // prevent spurious errors from being emitted when the window is unloaded
    if (typeof addEventListener === 'function') {
      addEventListener('beforeunload', function () {
        if (self.script) self.script.onerror = empty$1;
      }, false);
    }
  }

  /**
   * Inherits from Polling.
   */

  componentInherit(JSONPPolling, polling);

  /*
   * JSONP only supports binary as base64 encoded strings
   */

  JSONPPolling.prototype.supportsBinary = false;

  /**
   * Closes the socket.
   *
   * @api private
   */

  JSONPPolling.prototype.doClose = function () {
    if (this.script) {
      this.script.parentNode.removeChild(this.script);
      this.script = null;
    }

    if (this.form) {
      this.form.parentNode.removeChild(this.form);
      this.form = null;
      this.iframe = null;
    }

    polling.prototype.doClose.call(this);
  };

  /**
   * Starts a poll cycle.
   *
   * @api private
   */

  JSONPPolling.prototype.doPoll = function () {
    var self = this;
    var script = document.createElement('script');

    if (this.script) {
      this.script.parentNode.removeChild(this.script);
      this.script = null;
    }

    script.async = true;
    script.src = this.uri();
    script.onerror = function (e) {
      self.onError('jsonp poll error', e);
    };

    var insertAt = document.getElementsByTagName('script')[0];
    if (insertAt) {
      insertAt.parentNode.insertBefore(script, insertAt);
    } else {
      (document.head || document.body).appendChild(script);
    }
    this.script = script;

    var isUAgecko = 'undefined' !== typeof navigator && /gecko/i.test(navigator.userAgent);

    if (isUAgecko) {
      setTimeout(function () {
        var iframe = document.createElement('iframe');
        document.body.appendChild(iframe);
        document.body.removeChild(iframe);
      }, 100);
    }
  };

  /**
   * Writes with a hidden iframe.
   *
   * @param {String} data to send
   * @param {Function} called upon flush.
   * @api private
   */

  JSONPPolling.prototype.doWrite = function (data, fn) {
    var self = this;

    if (!this.form) {
      var form = document.createElement('form');
      var area = document.createElement('textarea');
      var id = this.iframeId = 'eio_iframe_' + this.index;
      var iframe;

      form.className = 'socketio';
      form.style.position = 'absolute';
      form.style.top = '-1000px';
      form.style.left = '-1000px';
      form.target = id;
      form.method = 'POST';
      form.setAttribute('accept-charset', 'utf-8');
      area.name = 'd';
      form.appendChild(area);
      document.body.appendChild(form);

      this.form = form;
      this.area = area;
    }

    this.form.action = this.uri();

    function complete () {
      initIframe();
      fn();
    }

    function initIframe () {
      if (self.iframe) {
        try {
          self.form.removeChild(self.iframe);
        } catch (e) {
          self.onError('jsonp polling iframe removal error', e);
        }
      }

      try {
        // ie6 dynamic iframes with target="" support (thanks Chris Lambacher)
        var html = '<iframe src="javascript:0" name="' + self.iframeId + '">';
        iframe = document.createElement(html);
      } catch (e) {
        iframe = document.createElement('iframe');
        iframe.name = self.iframeId;
        iframe.src = 'javascript:0';
      }

      iframe.id = self.iframeId;

      self.form.appendChild(iframe);
      self.iframe = iframe;
    }

    initIframe();

    // escape \n to prevent it from being converted into \r\n by some UAs
    // double escaping is required for escaped new lines because unescaping of new lines can be done safely on server-side
    data = data.replace(rEscapedNewline, '\\\n');
    this.area.value = data.replace(rNewline, '\\n');

    try {
      this.form.submit();
    } catch (e) {}

    if (this.iframe.attachEvent) {
      this.iframe.onreadystatechange = function () {
        if (self.iframe.readyState === 'complete') {
          complete();
        }
      };
    } else {
      this.iframe.onload = complete;
    }
  };

  var _nodeResolve_empty = {};

  var _nodeResolve_empty$1 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    'default': _nodeResolve_empty
  });

  var require$$1 = getCjsExportFromNamespace(_nodeResolve_empty$1);

  /**
   * Module dependencies.
   */






  var debug$4 = browser('engine.io-client:websocket');

  var BrowserWebSocket, NodeWebSocket;

  if (typeof WebSocket !== 'undefined') {
    BrowserWebSocket = WebSocket;
  } else if (typeof self !== 'undefined') {
    BrowserWebSocket = self.WebSocket || self.MozWebSocket;
  }

  if (typeof window === 'undefined') {
    try {
      NodeWebSocket = require$$1;
    } catch (e) { }
  }

  /**
   * Get either the `WebSocket` or `MozWebSocket` globals
   * in the browser or try to resolve WebSocket-compatible
   * interface exposed by `ws` for Node-like environment.
   */

  var WebSocketImpl = BrowserWebSocket || NodeWebSocket;

  /**
   * Module exports.
   */

  var websocket = WS;

  /**
   * WebSocket transport constructor.
   *
   * @api {Object} connection options
   * @api public
   */

  function WS (opts) {
    var forceBase64 = (opts && opts.forceBase64);
    if (forceBase64) {
      this.supportsBinary = false;
    }
    this.perMessageDeflate = opts.perMessageDeflate;
    this.usingBrowserWebSocket = BrowserWebSocket && !opts.forceNode;
    this.protocols = opts.protocols;
    if (!this.usingBrowserWebSocket) {
      WebSocketImpl = NodeWebSocket;
    }
    transport.call(this, opts);
  }

  /**
   * Inherits from Transport.
   */

  componentInherit(WS, transport);

  /**
   * Transport name.
   *
   * @api public
   */

  WS.prototype.name = 'websocket';

  /*
   * WebSockets support binary
   */

  WS.prototype.supportsBinary = true;

  /**
   * Opens socket.
   *
   * @api private
   */

  WS.prototype.doOpen = function () {
    if (!this.check()) {
      // let probe timeout
      return;
    }

    var uri = this.uri();
    var protocols = this.protocols;
    var opts = {
      agent: this.agent,
      perMessageDeflate: this.perMessageDeflate
    };

    // SSL options for Node.js client
    opts.pfx = this.pfx;
    opts.key = this.key;
    opts.passphrase = this.passphrase;
    opts.cert = this.cert;
    opts.ca = this.ca;
    opts.ciphers = this.ciphers;
    opts.rejectUnauthorized = this.rejectUnauthorized;
    if (this.extraHeaders) {
      opts.headers = this.extraHeaders;
    }
    if (this.localAddress) {
      opts.localAddress = this.localAddress;
    }

    try {
      this.ws =
        this.usingBrowserWebSocket && !this.isReactNative
          ? protocols
            ? new WebSocketImpl(uri, protocols)
            : new WebSocketImpl(uri)
          : new WebSocketImpl(uri, protocols, opts);
    } catch (err) {
      return this.emit('error', err);
    }

    if (this.ws.binaryType === undefined) {
      this.supportsBinary = false;
    }

    if (this.ws.supports && this.ws.supports.binary) {
      this.supportsBinary = true;
      this.ws.binaryType = 'nodebuffer';
    } else {
      this.ws.binaryType = 'arraybuffer';
    }

    this.addEventListeners();
  };

  /**
   * Adds event listeners to the socket
   *
   * @api private
   */

  WS.prototype.addEventListeners = function () {
    var self = this;

    this.ws.onopen = function () {
      self.onOpen();
    };
    this.ws.onclose = function () {
      self.onClose();
    };
    this.ws.onmessage = function (ev) {
      self.onData(ev.data);
    };
    this.ws.onerror = function (e) {
      self.onError('websocket error', e);
    };
  };

  /**
   * Writes data to socket.
   *
   * @param {Array} array of packets.
   * @api private
   */

  WS.prototype.write = function (packets) {
    var self = this;
    this.writable = false;

    // encodePacket efficient as it uses WS framing
    // no need for encodePayload
    var total = packets.length;
    for (var i = 0, l = total; i < l; i++) {
      (function (packet) {
        browser$2.encodePacket(packet, self.supportsBinary, function (data) {
          if (!self.usingBrowserWebSocket) {
            // always create a new object (GH-437)
            var opts = {};
            if (packet.options) {
              opts.compress = packet.options.compress;
            }

            if (self.perMessageDeflate) {
              var len = 'string' === typeof data ? Buffer.byteLength(data) : data.length;
              if (len < self.perMessageDeflate.threshold) {
                opts.compress = false;
              }
            }
          }

          // Sometimes the websocket has already been closed but the browser didn't
          // have a chance of informing us about it yet, in that case send will
          // throw an error
          try {
            if (self.usingBrowserWebSocket) {
              // TypeError is thrown when passing the second argument on Safari
              self.ws.send(data);
            } else {
              self.ws.send(data, opts);
            }
          } catch (e) {
            debug$4('websocket closed before onclose event');
          }

          --total || done();
        });
      })(packets[i]);
    }

    function done () {
      self.emit('flush');

      // fake drain
      // defer to next tick to allow Socket to clear writeBuffer
      setTimeout(function () {
        self.writable = true;
        self.emit('drain');
      }, 0);
    }
  };

  /**
   * Called upon close
   *
   * @api private
   */

  WS.prototype.onClose = function () {
    transport.prototype.onClose.call(this);
  };

  /**
   * Closes socket.
   *
   * @api private
   */

  WS.prototype.doClose = function () {
    if (typeof this.ws !== 'undefined') {
      this.ws.close();
    }
  };

  /**
   * Generates uri for connection.
   *
   * @api private
   */

  WS.prototype.uri = function () {
    var query = this.query || {};
    var schema = this.secure ? 'wss' : 'ws';
    var port = '';

    // avoid port if default for schema
    if (this.port && (('wss' === schema && Number(this.port) !== 443) ||
      ('ws' === schema && Number(this.port) !== 80))) {
      port = ':' + this.port;
    }

    // append timestamp to URI
    if (this.timestampRequests) {
      query[this.timestampParam] = yeast_1();
    }

    // communicate binary support capabilities
    if (!this.supportsBinary) {
      query.b64 = 1;
    }

    query = parseqs.encode(query);

    // prepend ? to query
    if (query.length) {
      query = '?' + query;
    }

    var ipv6 = this.hostname.indexOf(':') !== -1;
    return schema + '://' + (ipv6 ? '[' + this.hostname + ']' : this.hostname) + port + this.path + query;
  };

  /**
   * Feature detection for WebSocket.
   *
   * @return {Boolean} whether this transport is available.
   * @api public
   */

  WS.prototype.check = function () {
    return !!WebSocketImpl && !('__initialize' in WebSocketImpl && this.name === WS.prototype.name);
  };

  /**
   * Module dependencies
   */






  /**
   * Export transports.
   */

  var polling_1 = polling$1;
  var websocket_1 = websocket;

  /**
   * Polling transport polymorphic constructor.
   * Decides on xhr vs jsonp based on feature detection.
   *
   * @api private
   */

  function polling$1 (opts) {
    var xhr;
    var xd = false;
    var xs = false;
    var jsonp = false !== opts.jsonp;

    if (typeof location !== 'undefined') {
      var isSSL = 'https:' === location.protocol;
      var port = location.port;

      // some user agents have empty `location.port`
      if (!port) {
        port = isSSL ? 443 : 80;
      }

      xd = opts.hostname !== location.hostname || port !== opts.port;
      xs = opts.secure !== isSSL;
    }

    opts.xdomain = xd;
    opts.xscheme = xs;
    xhr = new xmlhttprequest(opts);

    if ('open' in xhr && !opts.forceJSONP) {
      return new pollingXhr(opts);
    } else {
      if (!jsonp) throw new Error('JSONP disabled');
      return new pollingJsonp(opts);
    }
  }

  var transports = {
  	polling: polling_1,
  	websocket: websocket_1
  };

  var indexOf = [].indexOf;

  var indexof = function(arr, obj){
    if (indexOf) return arr.indexOf(obj);
    for (var i = 0; i < arr.length; ++i) {
      if (arr[i] === obj) return i;
    }
    return -1;
  };

  /**
   * Module dependencies.
   */



  var debug$5 = browser('engine.io-client:socket');





  /**
   * Module exports.
   */

  var socket = Socket;

  /**
   * Socket constructor.
   *
   * @param {String|Object} uri or options
   * @param {Object} options
   * @api public
   */

  function Socket (uri, opts) {
    if (!(this instanceof Socket)) return new Socket(uri, opts);

    opts = opts || {};

    if (uri && 'object' === typeof uri) {
      opts = uri;
      uri = null;
    }

    if (uri) {
      uri = parseuri(uri);
      opts.hostname = uri.host;
      opts.secure = uri.protocol === 'https' || uri.protocol === 'wss';
      opts.port = uri.port;
      if (uri.query) opts.query = uri.query;
    } else if (opts.host) {
      opts.hostname = parseuri(opts.host).host;
    }

    this.secure = null != opts.secure ? opts.secure
      : (typeof location !== 'undefined' && 'https:' === location.protocol);

    if (opts.hostname && !opts.port) {
      // if no port is specified manually, use the protocol default
      opts.port = this.secure ? '443' : '80';
    }

    this.agent = opts.agent || false;
    this.hostname = opts.hostname ||
      (typeof location !== 'undefined' ? location.hostname : 'localhost');
    this.port = opts.port || (typeof location !== 'undefined' && location.port
        ? location.port
        : (this.secure ? 443 : 80));
    this.query = opts.query || {};
    if ('string' === typeof this.query) this.query = parseqs.decode(this.query);
    this.upgrade = false !== opts.upgrade;
    this.path = (opts.path || '/engine.io').replace(/\/$/, '') + '/';
    this.forceJSONP = !!opts.forceJSONP;
    this.jsonp = false !== opts.jsonp;
    this.forceBase64 = !!opts.forceBase64;
    this.enablesXDR = !!opts.enablesXDR;
    this.withCredentials = false !== opts.withCredentials;
    this.timestampParam = opts.timestampParam || 't';
    this.timestampRequests = opts.timestampRequests;
    this.transports = opts.transports || ['polling', 'websocket'];
    this.transportOptions = opts.transportOptions || {};
    this.readyState = '';
    this.writeBuffer = [];
    this.prevBufferLen = 0;
    this.policyPort = opts.policyPort || 843;
    this.rememberUpgrade = opts.rememberUpgrade || false;
    this.binaryType = null;
    this.onlyBinaryUpgrades = opts.onlyBinaryUpgrades;
    this.perMessageDeflate = false !== opts.perMessageDeflate ? (opts.perMessageDeflate || {}) : false;

    if (true === this.perMessageDeflate) this.perMessageDeflate = {};
    if (this.perMessageDeflate && null == this.perMessageDeflate.threshold) {
      this.perMessageDeflate.threshold = 1024;
    }

    // SSL options for Node.js client
    this.pfx = opts.pfx || null;
    this.key = opts.key || null;
    this.passphrase = opts.passphrase || null;
    this.cert = opts.cert || null;
    this.ca = opts.ca || null;
    this.ciphers = opts.ciphers || null;
    this.rejectUnauthorized = opts.rejectUnauthorized === undefined ? true : opts.rejectUnauthorized;
    this.forceNode = !!opts.forceNode;

    // detect ReactNative environment
    this.isReactNative = (typeof navigator !== 'undefined' && typeof navigator.product === 'string' && navigator.product.toLowerCase() === 'reactnative');

    // other options for Node.js or ReactNative client
    if (typeof self === 'undefined' || this.isReactNative) {
      if (opts.extraHeaders && Object.keys(opts.extraHeaders).length > 0) {
        this.extraHeaders = opts.extraHeaders;
      }

      if (opts.localAddress) {
        this.localAddress = opts.localAddress;
      }
    }

    // set on handshake
    this.id = null;
    this.upgrades = null;
    this.pingInterval = null;
    this.pingTimeout = null;

    // set on heartbeat
    this.pingIntervalTimer = null;
    this.pingTimeoutTimer = null;

    this.open();
  }

  Socket.priorWebsocketSuccess = false;

  /**
   * Mix in `Emitter`.
   */

  componentEmitter(Socket.prototype);

  /**
   * Protocol version.
   *
   * @api public
   */

  Socket.protocol = browser$2.protocol; // this is an int

  /**
   * Expose deps for legacy compatibility
   * and standalone browser access.
   */

  Socket.Socket = Socket;
  Socket.Transport = transport;
  Socket.transports = transports;
  Socket.parser = browser$2;

  /**
   * Creates transport of the given type.
   *
   * @param {String} transport name
   * @return {Transport}
   * @api private
   */

  Socket.prototype.createTransport = function (name) {
    debug$5('creating transport "%s"', name);
    var query = clone(this.query);

    // append engine.io protocol identifier
    query.EIO = browser$2.protocol;

    // transport name
    query.transport = name;

    // per-transport options
    var options = this.transportOptions[name] || {};

    // session id if we already have one
    if (this.id) query.sid = this.id;

    var transport = new transports[name]({
      query: query,
      socket: this,
      agent: options.agent || this.agent,
      hostname: options.hostname || this.hostname,
      port: options.port || this.port,
      secure: options.secure || this.secure,
      path: options.path || this.path,
      forceJSONP: options.forceJSONP || this.forceJSONP,
      jsonp: options.jsonp || this.jsonp,
      forceBase64: options.forceBase64 || this.forceBase64,
      enablesXDR: options.enablesXDR || this.enablesXDR,
      withCredentials: options.withCredentials || this.withCredentials,
      timestampRequests: options.timestampRequests || this.timestampRequests,
      timestampParam: options.timestampParam || this.timestampParam,
      policyPort: options.policyPort || this.policyPort,
      pfx: options.pfx || this.pfx,
      key: options.key || this.key,
      passphrase: options.passphrase || this.passphrase,
      cert: options.cert || this.cert,
      ca: options.ca || this.ca,
      ciphers: options.ciphers || this.ciphers,
      rejectUnauthorized: options.rejectUnauthorized || this.rejectUnauthorized,
      perMessageDeflate: options.perMessageDeflate || this.perMessageDeflate,
      extraHeaders: options.extraHeaders || this.extraHeaders,
      forceNode: options.forceNode || this.forceNode,
      localAddress: options.localAddress || this.localAddress,
      requestTimeout: options.requestTimeout || this.requestTimeout,
      protocols: options.protocols || void (0),
      isReactNative: this.isReactNative
    });

    return transport;
  };

  function clone (obj) {
    var o = {};
    for (var i in obj) {
      if (obj.hasOwnProperty(i)) {
        o[i] = obj[i];
      }
    }
    return o;
  }

  /**
   * Initializes transport to use and starts probe.
   *
   * @api private
   */
  Socket.prototype.open = function () {
    var transport;
    if (this.rememberUpgrade && Socket.priorWebsocketSuccess && this.transports.indexOf('websocket') !== -1) {
      transport = 'websocket';
    } else if (0 === this.transports.length) {
      // Emit error on next tick so it can be listened to
      var self = this;
      setTimeout(function () {
        self.emit('error', 'No transports available');
      }, 0);
      return;
    } else {
      transport = this.transports[0];
    }
    this.readyState = 'opening';

    // Retry with the next transport if the transport is disabled (jsonp: false)
    try {
      transport = this.createTransport(transport);
    } catch (e) {
      this.transports.shift();
      this.open();
      return;
    }

    transport.open();
    this.setTransport(transport);
  };

  /**
   * Sets the current transport. Disables the existing one (if any).
   *
   * @api private
   */

  Socket.prototype.setTransport = function (transport) {
    debug$5('setting transport %s', transport.name);
    var self = this;

    if (this.transport) {
      debug$5('clearing existing transport %s', this.transport.name);
      this.transport.removeAllListeners();
    }

    // set up transport
    this.transport = transport;

    // set up transport listeners
    transport
    .on('drain', function () {
      self.onDrain();
    })
    .on('packet', function (packet) {
      self.onPacket(packet);
    })
    .on('error', function (e) {
      self.onError(e);
    })
    .on('close', function () {
      self.onClose('transport close');
    });
  };

  /**
   * Probes a transport.
   *
   * @param {String} transport name
   * @api private
   */

  Socket.prototype.probe = function (name) {
    debug$5('probing transport "%s"', name);
    var transport = this.createTransport(name, { probe: 1 });
    var failed = false;
    var self = this;

    Socket.priorWebsocketSuccess = false;

    function onTransportOpen () {
      if (self.onlyBinaryUpgrades) {
        var upgradeLosesBinary = !this.supportsBinary && self.transport.supportsBinary;
        failed = failed || upgradeLosesBinary;
      }
      if (failed) return;

      debug$5('probe transport "%s" opened', name);
      transport.send([{ type: 'ping', data: 'probe' }]);
      transport.once('packet', function (msg) {
        if (failed) return;
        if ('pong' === msg.type && 'probe' === msg.data) {
          debug$5('probe transport "%s" pong', name);
          self.upgrading = true;
          self.emit('upgrading', transport);
          if (!transport) return;
          Socket.priorWebsocketSuccess = 'websocket' === transport.name;

          debug$5('pausing current transport "%s"', self.transport.name);
          self.transport.pause(function () {
            if (failed) return;
            if ('closed' === self.readyState) return;
            debug$5('changing transport and sending upgrade packet');

            cleanup();

            self.setTransport(transport);
            transport.send([{ type: 'upgrade' }]);
            self.emit('upgrade', transport);
            transport = null;
            self.upgrading = false;
            self.flush();
          });
        } else {
          debug$5('probe transport "%s" failed', name);
          var err = new Error('probe error');
          err.transport = transport.name;
          self.emit('upgradeError', err);
        }
      });
    }

    function freezeTransport () {
      if (failed) return;

      // Any callback called by transport should be ignored since now
      failed = true;

      cleanup();

      transport.close();
      transport = null;
    }

    // Handle any error that happens while probing
    function onerror (err) {
      var error = new Error('probe error: ' + err);
      error.transport = transport.name;

      freezeTransport();

      debug$5('probe transport "%s" failed because of error: %s', name, err);

      self.emit('upgradeError', error);
    }

    function onTransportClose () {
      onerror('transport closed');
    }

    // When the socket is closed while we're probing
    function onclose () {
      onerror('socket closed');
    }

    // When the socket is upgraded while we're probing
    function onupgrade (to) {
      if (transport && to.name !== transport.name) {
        debug$5('"%s" works - aborting "%s"', to.name, transport.name);
        freezeTransport();
      }
    }

    // Remove all listeners on the transport and on self
    function cleanup () {
      transport.removeListener('open', onTransportOpen);
      transport.removeListener('error', onerror);
      transport.removeListener('close', onTransportClose);
      self.removeListener('close', onclose);
      self.removeListener('upgrading', onupgrade);
    }

    transport.once('open', onTransportOpen);
    transport.once('error', onerror);
    transport.once('close', onTransportClose);

    this.once('close', onclose);
    this.once('upgrading', onupgrade);

    transport.open();
  };

  /**
   * Called when connection is deemed open.
   *
   * @api public
   */

  Socket.prototype.onOpen = function () {
    debug$5('socket open');
    this.readyState = 'open';
    Socket.priorWebsocketSuccess = 'websocket' === this.transport.name;
    this.emit('open');
    this.flush();

    // we check for `readyState` in case an `open`
    // listener already closed the socket
    if ('open' === this.readyState && this.upgrade && this.transport.pause) {
      debug$5('starting upgrade probes');
      for (var i = 0, l = this.upgrades.length; i < l; i++) {
        this.probe(this.upgrades[i]);
      }
    }
  };

  /**
   * Handles a packet.
   *
   * @api private
   */

  Socket.prototype.onPacket = function (packet) {
    if ('opening' === this.readyState || 'open' === this.readyState ||
        'closing' === this.readyState) {
      debug$5('socket receive: type "%s", data "%s"', packet.type, packet.data);

      this.emit('packet', packet);

      // Socket is live - any packet counts
      this.emit('heartbeat');

      switch (packet.type) {
        case 'open':
          this.onHandshake(JSON.parse(packet.data));
          break;

        case 'pong':
          this.setPing();
          this.emit('pong');
          break;

        case 'error':
          var err = new Error('server error');
          err.code = packet.data;
          this.onError(err);
          break;

        case 'message':
          this.emit('data', packet.data);
          this.emit('message', packet.data);
          break;
      }
    } else {
      debug$5('packet received with socket readyState "%s"', this.readyState);
    }
  };

  /**
   * Called upon handshake completion.
   *
   * @param {Object} handshake obj
   * @api private
   */

  Socket.prototype.onHandshake = function (data) {
    this.emit('handshake', data);
    this.id = data.sid;
    this.transport.query.sid = data.sid;
    this.upgrades = this.filterUpgrades(data.upgrades);
    this.pingInterval = data.pingInterval;
    this.pingTimeout = data.pingTimeout;
    this.onOpen();
    // In case open handler closes socket
    if ('closed' === this.readyState) return;
    this.setPing();

    // Prolong liveness of socket on heartbeat
    this.removeListener('heartbeat', this.onHeartbeat);
    this.on('heartbeat', this.onHeartbeat);
  };

  /**
   * Resets ping timeout.
   *
   * @api private
   */

  Socket.prototype.onHeartbeat = function (timeout) {
    clearTimeout(this.pingTimeoutTimer);
    var self = this;
    self.pingTimeoutTimer = setTimeout(function () {
      if ('closed' === self.readyState) return;
      self.onClose('ping timeout');
    }, timeout || (self.pingInterval + self.pingTimeout));
  };

  /**
   * Pings server every `this.pingInterval` and expects response
   * within `this.pingTimeout` or closes connection.
   *
   * @api private
   */

  Socket.prototype.setPing = function () {
    var self = this;
    clearTimeout(self.pingIntervalTimer);
    self.pingIntervalTimer = setTimeout(function () {
      debug$5('writing ping packet - expecting pong within %sms', self.pingTimeout);
      self.ping();
      self.onHeartbeat(self.pingTimeout);
    }, self.pingInterval);
  };

  /**
  * Sends a ping packet.
  *
  * @api private
  */

  Socket.prototype.ping = function () {
    var self = this;
    this.sendPacket('ping', function () {
      self.emit('ping');
    });
  };

  /**
   * Called on `drain` event
   *
   * @api private
   */

  Socket.prototype.onDrain = function () {
    this.writeBuffer.splice(0, this.prevBufferLen);

    // setting prevBufferLen = 0 is very important
    // for example, when upgrading, upgrade packet is sent over,
    // and a nonzero prevBufferLen could cause problems on `drain`
    this.prevBufferLen = 0;

    if (0 === this.writeBuffer.length) {
      this.emit('drain');
    } else {
      this.flush();
    }
  };

  /**
   * Flush write buffers.
   *
   * @api private
   */

  Socket.prototype.flush = function () {
    if ('closed' !== this.readyState && this.transport.writable &&
      !this.upgrading && this.writeBuffer.length) {
      debug$5('flushing %d packets in socket', this.writeBuffer.length);
      this.transport.send(this.writeBuffer);
      // keep track of current length of writeBuffer
      // splice writeBuffer and callbackBuffer on `drain`
      this.prevBufferLen = this.writeBuffer.length;
      this.emit('flush');
    }
  };

  /**
   * Sends a message.
   *
   * @param {String} message.
   * @param {Function} callback function.
   * @param {Object} options.
   * @return {Socket} for chaining.
   * @api public
   */

  Socket.prototype.write =
  Socket.prototype.send = function (msg, options, fn) {
    this.sendPacket('message', msg, options, fn);
    return this;
  };

  /**
   * Sends a packet.
   *
   * @param {String} packet type.
   * @param {String} data.
   * @param {Object} options.
   * @param {Function} callback function.
   * @api private
   */

  Socket.prototype.sendPacket = function (type, data, options, fn) {
    if ('function' === typeof data) {
      fn = data;
      data = undefined;
    }

    if ('function' === typeof options) {
      fn = options;
      options = null;
    }

    if ('closing' === this.readyState || 'closed' === this.readyState) {
      return;
    }

    options = options || {};
    options.compress = false !== options.compress;

    var packet = {
      type: type,
      data: data,
      options: options
    };
    this.emit('packetCreate', packet);
    this.writeBuffer.push(packet);
    if (fn) this.once('flush', fn);
    this.flush();
  };

  /**
   * Closes the connection.
   *
   * @api private
   */

  Socket.prototype.close = function () {
    if ('opening' === this.readyState || 'open' === this.readyState) {
      this.readyState = 'closing';

      var self = this;

      if (this.writeBuffer.length) {
        this.once('drain', function () {
          if (this.upgrading) {
            waitForUpgrade();
          } else {
            close();
          }
        });
      } else if (this.upgrading) {
        waitForUpgrade();
      } else {
        close();
      }
    }

    function close () {
      self.onClose('forced close');
      debug$5('socket closing - telling transport to close');
      self.transport.close();
    }

    function cleanupAndClose () {
      self.removeListener('upgrade', cleanupAndClose);
      self.removeListener('upgradeError', cleanupAndClose);
      close();
    }

    function waitForUpgrade () {
      // wait for upgrade to finish since we can't send packets while pausing a transport
      self.once('upgrade', cleanupAndClose);
      self.once('upgradeError', cleanupAndClose);
    }

    return this;
  };

  /**
   * Called upon transport error
   *
   * @api private
   */

  Socket.prototype.onError = function (err) {
    debug$5('socket error %j', err);
    Socket.priorWebsocketSuccess = false;
    this.emit('error', err);
    this.onClose('transport error', err);
  };

  /**
   * Called upon transport close.
   *
   * @api private
   */

  Socket.prototype.onClose = function (reason, desc) {
    if ('opening' === this.readyState || 'open' === this.readyState || 'closing' === this.readyState) {
      debug$5('socket close with reason: "%s"', reason);
      var self = this;

      // clear timers
      clearTimeout(this.pingIntervalTimer);
      clearTimeout(this.pingTimeoutTimer);

      // stop event from firing again for transport
      this.transport.removeAllListeners('close');

      // ensure transport won't stay open
      this.transport.close();

      // ignore further transport communication
      this.transport.removeAllListeners();

      // set ready state
      this.readyState = 'closed';

      // clear session id
      this.id = null;

      // emit close event
      this.emit('close', reason, desc);

      // clean buffers after, so users can still
      // grab the buffers on `close` event
      self.writeBuffer = [];
      self.prevBufferLen = 0;
    }
  };

  /**
   * Filters upgrades, returning only those matching client transports.
   *
   * @param {Array} server upgrades
   * @api private
   *
   */

  Socket.prototype.filterUpgrades = function (upgrades) {
    var filteredUpgrades = [];
    for (var i = 0, j = upgrades.length; i < j; i++) {
      if (~indexof(this.transports, upgrades[i])) filteredUpgrades.push(upgrades[i]);
    }
    return filteredUpgrades;
  };

  var lib = socket;

  /**
   * Exports parser
   *
   * @api public
   *
   */
  var parser = browser$2;
  lib.parser = parser;

  var toArray_1 = toArray;

  function toArray(list, index) {
      var array = [];

      index = index || 0;

      for (var i = index || 0; i < list.length; i++) {
          array[i - index] = list[i];
      }

      return array
  }

  /**
   * Module exports.
   */

  var on_1 = on;

  /**
   * Helper for subscriptions.
   *
   * @param {Object|EventEmitter} obj with `Emitter` mixin or `EventEmitter`
   * @param {String} event name
   * @param {Function} callback
   * @api public
   */

  function on (obj, ev, fn) {
    obj.on(ev, fn);
    return {
      destroy: function () {
        obj.removeListener(ev, fn);
      }
    };
  }

  /**
   * Slice reference.
   */

  var slice = [].slice;

  /**
   * Bind `obj` to `fn`.
   *
   * @param {Object} obj
   * @param {Function|String} fn or string
   * @return {Function}
   * @api public
   */

  var componentBind = function(obj, fn){
    if ('string' == typeof fn) fn = obj[fn];
    if ('function' != typeof fn) throw new Error('bind() requires a function');
    var args = slice.call(arguments, 2);
    return function(){
      return fn.apply(obj, args.concat(slice.call(arguments)));
    }
  };

  var socket$1 = createCommonjsModule$1(function (module, exports) {
  /**
   * Module dependencies.
   */






  var debug = browser('socket.io-client:socket');



  /**
   * Module exports.
   */

  module.exports = exports = Socket;

  /**
   * Internal events (blacklisted).
   * These events can't be emitted by the user.
   *
   * @api private
   */

  var events = {
    connect: 1,
    connect_error: 1,
    connect_timeout: 1,
    connecting: 1,
    disconnect: 1,
    error: 1,
    reconnect: 1,
    reconnect_attempt: 1,
    reconnect_failed: 1,
    reconnect_error: 1,
    reconnecting: 1,
    ping: 1,
    pong: 1
  };

  /**
   * Shortcut to `Emitter#emit`.
   */

  var emit = componentEmitter.prototype.emit;

  /**
   * `Socket` constructor.
   *
   * @api public
   */

  function Socket (io, nsp, opts) {
    this.io = io;
    this.nsp = nsp;
    this.json = this; // compat
    this.ids = 0;
    this.acks = {};
    this.receiveBuffer = [];
    this.sendBuffer = [];
    this.connected = false;
    this.disconnected = true;
    this.flags = {};
    if (opts && opts.query) {
      this.query = opts.query;
    }
    if (this.io.autoConnect) this.open();
  }

  /**
   * Mix in `Emitter`.
   */

  componentEmitter(Socket.prototype);

  /**
   * Subscribe to open, close and packet events
   *
   * @api private
   */

  Socket.prototype.subEvents = function () {
    if (this.subs) return;

    var io = this.io;
    this.subs = [
      on_1(io, 'open', componentBind(this, 'onopen')),
      on_1(io, 'packet', componentBind(this, 'onpacket')),
      on_1(io, 'close', componentBind(this, 'onclose'))
    ];
  };

  /**
   * "Opens" the socket.
   *
   * @api public
   */

  Socket.prototype.open =
  Socket.prototype.connect = function () {
    if (this.connected) return this;

    this.subEvents();
    this.io.open(); // ensure open
    if ('open' === this.io.readyState) this.onopen();
    this.emit('connecting');
    return this;
  };

  /**
   * Sends a `message` event.
   *
   * @return {Socket} self
   * @api public
   */

  Socket.prototype.send = function () {
    var args = toArray_1(arguments);
    args.unshift('message');
    this.emit.apply(this, args);
    return this;
  };

  /**
   * Override `emit`.
   * If the event is in `events`, it's emitted normally.
   *
   * @param {String} event name
   * @return {Socket} self
   * @api public
   */

  Socket.prototype.emit = function (ev) {
    if (events.hasOwnProperty(ev)) {
      emit.apply(this, arguments);
      return this;
    }

    var args = toArray_1(arguments);
    var packet = {
      type: (this.flags.binary !== undefined ? this.flags.binary : hasBinary2(args)) ? socket_ioParser.BINARY_EVENT : socket_ioParser.EVENT,
      data: args
    };

    packet.options = {};
    packet.options.compress = !this.flags || false !== this.flags.compress;

    // event ack callback
    if ('function' === typeof args[args.length - 1]) {
      debug('emitting packet with ack id %d', this.ids);
      this.acks[this.ids] = args.pop();
      packet.id = this.ids++;
    }

    if (this.connected) {
      this.packet(packet);
    } else {
      this.sendBuffer.push(packet);
    }

    this.flags = {};

    return this;
  };

  /**
   * Sends a packet.
   *
   * @param {Object} packet
   * @api private
   */

  Socket.prototype.packet = function (packet) {
    packet.nsp = this.nsp;
    this.io.packet(packet);
  };

  /**
   * Called upon engine `open`.
   *
   * @api private
   */

  Socket.prototype.onopen = function () {
    debug('transport is open - connecting');

    // write connect packet if necessary
    if ('/' !== this.nsp) {
      if (this.query) {
        var query = typeof this.query === 'object' ? parseqs.encode(this.query) : this.query;
        debug('sending connect packet with query %s', query);
        this.packet({type: socket_ioParser.CONNECT, query: query});
      } else {
        this.packet({type: socket_ioParser.CONNECT});
      }
    }
  };

  /**
   * Called upon engine `close`.
   *
   * @param {String} reason
   * @api private
   */

  Socket.prototype.onclose = function (reason) {
    debug('close (%s)', reason);
    this.connected = false;
    this.disconnected = true;
    delete this.id;
    this.emit('disconnect', reason);
  };

  /**
   * Called with socket packet.
   *
   * @param {Object} packet
   * @api private
   */

  Socket.prototype.onpacket = function (packet) {
    var sameNamespace = packet.nsp === this.nsp;
    var rootNamespaceError = packet.type === socket_ioParser.ERROR && packet.nsp === '/';

    if (!sameNamespace && !rootNamespaceError) return;

    switch (packet.type) {
      case socket_ioParser.CONNECT:
        this.onconnect();
        break;

      case socket_ioParser.EVENT:
        this.onevent(packet);
        break;

      case socket_ioParser.BINARY_EVENT:
        this.onevent(packet);
        break;

      case socket_ioParser.ACK:
        this.onack(packet);
        break;

      case socket_ioParser.BINARY_ACK:
        this.onack(packet);
        break;

      case socket_ioParser.DISCONNECT:
        this.ondisconnect();
        break;

      case socket_ioParser.ERROR:
        this.emit('error', packet.data);
        break;
    }
  };

  /**
   * Called upon a server event.
   *
   * @param {Object} packet
   * @api private
   */

  Socket.prototype.onevent = function (packet) {
    var args = packet.data || [];
    debug('emitting event %j', args);

    if (null != packet.id) {
      debug('attaching ack callback to event');
      args.push(this.ack(packet.id));
    }

    if (this.connected) {
      emit.apply(this, args);
    } else {
      this.receiveBuffer.push(args);
    }
  };

  /**
   * Produces an ack callback to emit with an event.
   *
   * @api private
   */

  Socket.prototype.ack = function (id) {
    var self = this;
    var sent = false;
    return function () {
      // prevent double callbacks
      if (sent) return;
      sent = true;
      var args = toArray_1(arguments);
      debug('sending ack %j', args);

      self.packet({
        type: hasBinary2(args) ? socket_ioParser.BINARY_ACK : socket_ioParser.ACK,
        id: id,
        data: args
      });
    };
  };

  /**
   * Called upon a server acknowlegement.
   *
   * @param {Object} packet
   * @api private
   */

  Socket.prototype.onack = function (packet) {
    var ack = this.acks[packet.id];
    if ('function' === typeof ack) {
      debug('calling ack %s with %j', packet.id, packet.data);
      ack.apply(this, packet.data);
      delete this.acks[packet.id];
    } else {
      debug('bad ack %s', packet.id);
    }
  };

  /**
   * Called upon server connect.
   *
   * @api private
   */

  Socket.prototype.onconnect = function () {
    this.connected = true;
    this.disconnected = false;
    this.emit('connect');
    this.emitBuffered();
  };

  /**
   * Emit buffered events (received and emitted).
   *
   * @api private
   */

  Socket.prototype.emitBuffered = function () {
    var i;
    for (i = 0; i < this.receiveBuffer.length; i++) {
      emit.apply(this, this.receiveBuffer[i]);
    }
    this.receiveBuffer = [];

    for (i = 0; i < this.sendBuffer.length; i++) {
      this.packet(this.sendBuffer[i]);
    }
    this.sendBuffer = [];
  };

  /**
   * Called upon server disconnect.
   *
   * @api private
   */

  Socket.prototype.ondisconnect = function () {
    debug('server disconnect (%s)', this.nsp);
    this.destroy();
    this.onclose('io server disconnect');
  };

  /**
   * Called upon forced client/server side disconnections,
   * this method ensures the manager stops tracking us and
   * that reconnections don't get triggered for this.
   *
   * @api private.
   */

  Socket.prototype.destroy = function () {
    if (this.subs) {
      // clean subscriptions to avoid reconnections
      for (var i = 0; i < this.subs.length; i++) {
        this.subs[i].destroy();
      }
      this.subs = null;
    }

    this.io.destroy(this);
  };

  /**
   * Disconnects the socket manually.
   *
   * @return {Socket} self
   * @api public
   */

  Socket.prototype.close =
  Socket.prototype.disconnect = function () {
    if (this.connected) {
      debug('performing disconnect (%s)', this.nsp);
      this.packet({ type: socket_ioParser.DISCONNECT });
    }

    // remove socket from pool
    this.destroy();

    if (this.connected) {
      // fire events
      this.onclose('io client disconnect');
    }
    return this;
  };

  /**
   * Sets the compress flag.
   *
   * @param {Boolean} if `true`, compresses the sending data
   * @return {Socket} self
   * @api public
   */

  Socket.prototype.compress = function (compress) {
    this.flags.compress = compress;
    return this;
  };

  /**
   * Sets the binary flag
   *
   * @param {Boolean} whether the emitted data contains binary
   * @return {Socket} self
   * @api public
   */

  Socket.prototype.binary = function (binary) {
    this.flags.binary = binary;
    return this;
  };
  });

  /**
   * Expose `Backoff`.
   */

  var backo2 = Backoff;

  /**
   * Initialize backoff timer with `opts`.
   *
   * - `min` initial timeout in milliseconds [100]
   * - `max` max timeout [10000]
   * - `jitter` [0]
   * - `factor` [2]
   *
   * @param {Object} opts
   * @api public
   */

  function Backoff(opts) {
    opts = opts || {};
    this.ms = opts.min || 100;
    this.max = opts.max || 10000;
    this.factor = opts.factor || 2;
    this.jitter = opts.jitter > 0 && opts.jitter <= 1 ? opts.jitter : 0;
    this.attempts = 0;
  }

  /**
   * Return the backoff duration.
   *
   * @return {Number}
   * @api public
   */

  Backoff.prototype.duration = function(){
    var ms = this.ms * Math.pow(this.factor, this.attempts++);
    if (this.jitter) {
      var rand =  Math.random();
      var deviation = Math.floor(rand * this.jitter * ms);
      ms = (Math.floor(rand * 10) & 1) == 0  ? ms - deviation : ms + deviation;
    }
    return Math.min(ms, this.max) | 0;
  };

  /**
   * Reset the number of attempts.
   *
   * @api public
   */

  Backoff.prototype.reset = function(){
    this.attempts = 0;
  };

  /**
   * Set the minimum duration
   *
   * @api public
   */

  Backoff.prototype.setMin = function(min){
    this.ms = min;
  };

  /**
   * Set the maximum duration
   *
   * @api public
   */

  Backoff.prototype.setMax = function(max){
    this.max = max;
  };

  /**
   * Set the jitter
   *
   * @api public
   */

  Backoff.prototype.setJitter = function(jitter){
    this.jitter = jitter;
  };

  /**
   * Module dependencies.
   */







  var debug$6 = browser('socket.io-client:manager');



  /**
   * IE6+ hasOwnProperty
   */

  var has = Object.prototype.hasOwnProperty;

  /**
   * Module exports
   */

  var manager = Manager;

  /**
   * `Manager` constructor.
   *
   * @param {String} engine instance or engine uri/opts
   * @param {Object} options
   * @api public
   */

  function Manager (uri, opts) {
    if (!(this instanceof Manager)) return new Manager(uri, opts);
    if (uri && ('object' === typeof uri)) {
      opts = uri;
      uri = undefined;
    }
    opts = opts || {};

    opts.path = opts.path || '/socket.io';
    this.nsps = {};
    this.subs = [];
    this.opts = opts;
    this.reconnection(opts.reconnection !== false);
    this.reconnectionAttempts(opts.reconnectionAttempts || Infinity);
    this.reconnectionDelay(opts.reconnectionDelay || 1000);
    this.reconnectionDelayMax(opts.reconnectionDelayMax || 5000);
    this.randomizationFactor(opts.randomizationFactor || 0.5);
    this.backoff = new backo2({
      min: this.reconnectionDelay(),
      max: this.reconnectionDelayMax(),
      jitter: this.randomizationFactor()
    });
    this.timeout(null == opts.timeout ? 20000 : opts.timeout);
    this.readyState = 'closed';
    this.uri = uri;
    this.connecting = [];
    this.lastPing = null;
    this.encoding = false;
    this.packetBuffer = [];
    var _parser = opts.parser || socket_ioParser;
    this.encoder = new _parser.Encoder();
    this.decoder = new _parser.Decoder();
    this.autoConnect = opts.autoConnect !== false;
    if (this.autoConnect) this.open();
  }

  /**
   * Propagate given event to sockets and emit on `this`
   *
   * @api private
   */

  Manager.prototype.emitAll = function () {
    this.emit.apply(this, arguments);
    for (var nsp in this.nsps) {
      if (has.call(this.nsps, nsp)) {
        this.nsps[nsp].emit.apply(this.nsps[nsp], arguments);
      }
    }
  };

  /**
   * Update `socket.id` of all sockets
   *
   * @api private
   */

  Manager.prototype.updateSocketIds = function () {
    for (var nsp in this.nsps) {
      if (has.call(this.nsps, nsp)) {
        this.nsps[nsp].id = this.generateId(nsp);
      }
    }
  };

  /**
   * generate `socket.id` for the given `nsp`
   *
   * @param {String} nsp
   * @return {String}
   * @api private
   */

  Manager.prototype.generateId = function (nsp) {
    return (nsp === '/' ? '' : (nsp + '#')) + this.engine.id;
  };

  /**
   * Mix in `Emitter`.
   */

  componentEmitter(Manager.prototype);

  /**
   * Sets the `reconnection` config.
   *
   * @param {Boolean} true/false if it should automatically reconnect
   * @return {Manager} self or value
   * @api public
   */

  Manager.prototype.reconnection = function (v) {
    if (!arguments.length) return this._reconnection;
    this._reconnection = !!v;
    return this;
  };

  /**
   * Sets the reconnection attempts config.
   *
   * @param {Number} max reconnection attempts before giving up
   * @return {Manager} self or value
   * @api public
   */

  Manager.prototype.reconnectionAttempts = function (v) {
    if (!arguments.length) return this._reconnectionAttempts;
    this._reconnectionAttempts = v;
    return this;
  };

  /**
   * Sets the delay between reconnections.
   *
   * @param {Number} delay
   * @return {Manager} self or value
   * @api public
   */

  Manager.prototype.reconnectionDelay = function (v) {
    if (!arguments.length) return this._reconnectionDelay;
    this._reconnectionDelay = v;
    this.backoff && this.backoff.setMin(v);
    return this;
  };

  Manager.prototype.randomizationFactor = function (v) {
    if (!arguments.length) return this._randomizationFactor;
    this._randomizationFactor = v;
    this.backoff && this.backoff.setJitter(v);
    return this;
  };

  /**
   * Sets the maximum delay between reconnections.
   *
   * @param {Number} delay
   * @return {Manager} self or value
   * @api public
   */

  Manager.prototype.reconnectionDelayMax = function (v) {
    if (!arguments.length) return this._reconnectionDelayMax;
    this._reconnectionDelayMax = v;
    this.backoff && this.backoff.setMax(v);
    return this;
  };

  /**
   * Sets the connection timeout. `false` to disable
   *
   * @return {Manager} self or value
   * @api public
   */

  Manager.prototype.timeout = function (v) {
    if (!arguments.length) return this._timeout;
    this._timeout = v;
    return this;
  };

  /**
   * Starts trying to reconnect if reconnection is enabled and we have not
   * started reconnecting yet
   *
   * @api private
   */

  Manager.prototype.maybeReconnectOnOpen = function () {
    // Only try to reconnect if it's the first time we're connecting
    if (!this.reconnecting && this._reconnection && this.backoff.attempts === 0) {
      // keeps reconnection from firing twice for the same reconnection loop
      this.reconnect();
    }
  };

  /**
   * Sets the current transport `socket`.
   *
   * @param {Function} optional, callback
   * @return {Manager} self
   * @api public
   */

  Manager.prototype.open =
  Manager.prototype.connect = function (fn, opts) {
    debug$6('readyState %s', this.readyState);
    if (~this.readyState.indexOf('open')) return this;

    debug$6('opening %s', this.uri);
    this.engine = lib(this.uri, this.opts);
    var socket = this.engine;
    var self = this;
    this.readyState = 'opening';
    this.skipReconnect = false;

    // emit `open`
    var openSub = on_1(socket, 'open', function () {
      self.onopen();
      fn && fn();
    });

    // emit `connect_error`
    var errorSub = on_1(socket, 'error', function (data) {
      debug$6('connect_error');
      self.cleanup();
      self.readyState = 'closed';
      self.emitAll('connect_error', data);
      if (fn) {
        var err = new Error('Connection error');
        err.data = data;
        fn(err);
      } else {
        // Only do this if there is no fn to handle the error
        self.maybeReconnectOnOpen();
      }
    });

    // emit `connect_timeout`
    if (false !== this._timeout) {
      var timeout = this._timeout;
      debug$6('connect attempt will timeout after %d', timeout);

      // set timer
      var timer = setTimeout(function () {
        debug$6('connect attempt timed out after %d', timeout);
        openSub.destroy();
        socket.close();
        socket.emit('error', 'timeout');
        self.emitAll('connect_timeout', timeout);
      }, timeout);

      this.subs.push({
        destroy: function () {
          clearTimeout(timer);
        }
      });
    }

    this.subs.push(openSub);
    this.subs.push(errorSub);

    return this;
  };

  /**
   * Called upon transport open.
   *
   * @api private
   */

  Manager.prototype.onopen = function () {
    debug$6('open');

    // clear old subs
    this.cleanup();

    // mark as open
    this.readyState = 'open';
    this.emit('open');

    // add new subs
    var socket = this.engine;
    this.subs.push(on_1(socket, 'data', componentBind(this, 'ondata')));
    this.subs.push(on_1(socket, 'ping', componentBind(this, 'onping')));
    this.subs.push(on_1(socket, 'pong', componentBind(this, 'onpong')));
    this.subs.push(on_1(socket, 'error', componentBind(this, 'onerror')));
    this.subs.push(on_1(socket, 'close', componentBind(this, 'onclose')));
    this.subs.push(on_1(this.decoder, 'decoded', componentBind(this, 'ondecoded')));
  };

  /**
   * Called upon a ping.
   *
   * @api private
   */

  Manager.prototype.onping = function () {
    this.lastPing = new Date();
    this.emitAll('ping');
  };

  /**
   * Called upon a packet.
   *
   * @api private
   */

  Manager.prototype.onpong = function () {
    this.emitAll('pong', new Date() - this.lastPing);
  };

  /**
   * Called with data.
   *
   * @api private
   */

  Manager.prototype.ondata = function (data) {
    this.decoder.add(data);
  };

  /**
   * Called when parser fully decodes a packet.
   *
   * @api private
   */

  Manager.prototype.ondecoded = function (packet) {
    this.emit('packet', packet);
  };

  /**
   * Called upon socket error.
   *
   * @api private
   */

  Manager.prototype.onerror = function (err) {
    debug$6('error', err);
    this.emitAll('error', err);
  };

  /**
   * Creates a new socket for the given `nsp`.
   *
   * @return {Socket}
   * @api public
   */

  Manager.prototype.socket = function (nsp, opts) {
    var socket = this.nsps[nsp];
    if (!socket) {
      socket = new socket$1(this, nsp, opts);
      this.nsps[nsp] = socket;
      var self = this;
      socket.on('connecting', onConnecting);
      socket.on('connect', function () {
        socket.id = self.generateId(nsp);
      });

      if (this.autoConnect) {
        // manually call here since connecting event is fired before listening
        onConnecting();
      }
    }

    function onConnecting () {
      if (!~indexof(self.connecting, socket)) {
        self.connecting.push(socket);
      }
    }

    return socket;
  };

  /**
   * Called upon a socket close.
   *
   * @param {Socket} socket
   */

  Manager.prototype.destroy = function (socket) {
    var index = indexof(this.connecting, socket);
    if (~index) this.connecting.splice(index, 1);
    if (this.connecting.length) return;

    this.close();
  };

  /**
   * Writes a packet.
   *
   * @param {Object} packet
   * @api private
   */

  Manager.prototype.packet = function (packet) {
    debug$6('writing packet %j', packet);
    var self = this;
    if (packet.query && packet.type === 0) packet.nsp += '?' + packet.query;

    if (!self.encoding) {
      // encode, then write to engine with result
      self.encoding = true;
      this.encoder.encode(packet, function (encodedPackets) {
        for (var i = 0; i < encodedPackets.length; i++) {
          self.engine.write(encodedPackets[i], packet.options);
        }
        self.encoding = false;
        self.processPacketQueue();
      });
    } else { // add packet to the queue
      self.packetBuffer.push(packet);
    }
  };

  /**
   * If packet buffer is non-empty, begins encoding the
   * next packet in line.
   *
   * @api private
   */

  Manager.prototype.processPacketQueue = function () {
    if (this.packetBuffer.length > 0 && !this.encoding) {
      var pack = this.packetBuffer.shift();
      this.packet(pack);
    }
  };

  /**
   * Clean up transport subscriptions and packet buffer.
   *
   * @api private
   */

  Manager.prototype.cleanup = function () {
    debug$6('cleanup');

    var subsLength = this.subs.length;
    for (var i = 0; i < subsLength; i++) {
      var sub = this.subs.shift();
      sub.destroy();
    }

    this.packetBuffer = [];
    this.encoding = false;
    this.lastPing = null;

    this.decoder.destroy();
  };

  /**
   * Close the current socket.
   *
   * @api private
   */

  Manager.prototype.close =
  Manager.prototype.disconnect = function () {
    debug$6('disconnect');
    this.skipReconnect = true;
    this.reconnecting = false;
    if ('opening' === this.readyState) {
      // `onclose` will not fire because
      // an open event never happened
      this.cleanup();
    }
    this.backoff.reset();
    this.readyState = 'closed';
    if (this.engine) this.engine.close();
  };

  /**
   * Called upon engine close.
   *
   * @api private
   */

  Manager.prototype.onclose = function (reason) {
    debug$6('onclose');

    this.cleanup();
    this.backoff.reset();
    this.readyState = 'closed';
    this.emit('close', reason);

    if (this._reconnection && !this.skipReconnect) {
      this.reconnect();
    }
  };

  /**
   * Attempt a reconnection.
   *
   * @api private
   */

  Manager.prototype.reconnect = function () {
    if (this.reconnecting || this.skipReconnect) return this;

    var self = this;

    if (this.backoff.attempts >= this._reconnectionAttempts) {
      debug$6('reconnect failed');
      this.backoff.reset();
      this.emitAll('reconnect_failed');
      this.reconnecting = false;
    } else {
      var delay = this.backoff.duration();
      debug$6('will wait %dms before reconnect attempt', delay);

      this.reconnecting = true;
      var timer = setTimeout(function () {
        if (self.skipReconnect) return;

        debug$6('attempting reconnect');
        self.emitAll('reconnect_attempt', self.backoff.attempts);
        self.emitAll('reconnecting', self.backoff.attempts);

        // check again for the case socket closed in above events
        if (self.skipReconnect) return;

        self.open(function (err) {
          if (err) {
            debug$6('reconnect attempt error');
            self.reconnecting = false;
            self.reconnect();
            self.emitAll('reconnect_error', err.data);
          } else {
            debug$6('reconnect success');
            self.onreconnect();
          }
        });
      }, delay);

      this.subs.push({
        destroy: function () {
          clearTimeout(timer);
        }
      });
    }
  };

  /**
   * Called upon successful reconnect.
   *
   * @api private
   */

  Manager.prototype.onreconnect = function () {
    var attempt = this.backoff.attempts;
    this.reconnecting = false;
    this.backoff.reset();
    this.updateSocketIds();
    this.emitAll('reconnect', attempt);
  };

  var lib$1 = createCommonjsModule$1(function (module, exports) {
  /**
   * Module dependencies.
   */




  var debug = browser('socket.io-client');

  /**
   * Module exports.
   */

  module.exports = exports = lookup;

  /**
   * Managers cache.
   */

  var cache = exports.managers = {};

  /**
   * Looks up an existing `Manager` for multiplexing.
   * If the user summons:
   *
   *   `io('http://localhost/a');`
   *   `io('http://localhost/b');`
   *
   * We reuse the existing instance based on same scheme/port/host,
   * and we initialize sockets for each namespace.
   *
   * @api public
   */

  function lookup (uri, opts) {
    if (typeof uri === 'object') {
      opts = uri;
      uri = undefined;
    }

    opts = opts || {};

    var parsed = url_1(uri);
    var source = parsed.source;
    var id = parsed.id;
    var path = parsed.path;
    var sameNamespace = cache[id] && path in cache[id].nsps;
    var newConnection = opts.forceNew || opts['force new connection'] ||
                        false === opts.multiplex || sameNamespace;

    var io;

    if (newConnection) {
      debug('ignoring socket cache for %s', source);
      io = manager(source, opts);
    } else {
      if (!cache[id]) {
        debug('new io instance for %s', source);
        cache[id] = manager(source, opts);
      }
      io = cache[id];
    }
    if (parsed.query && !opts.query) {
      opts.query = parsed.query;
    }
    return io.socket(parsed.path, opts);
  }

  /**
   * Protocol version.
   *
   * @api public
   */

  exports.protocol = socket_ioParser.protocol;

  /**
   * `connect`.
   *
   * @param {String} uri
   * @api public
   */

  exports.connect = lookup;

  /**
   * Expose constructors for standalone build.
   *
   * @api public
   */

  exports.Manager = manager;
  exports.Socket = socket$1;
  });
  var lib_1 = lib$1.managers;
  var lib_2 = lib$1.protocol;
  var lib_3 = lib$1.connect;
  var lib_4 = lib$1.Manager;
  var lib_5 = lib$1.Socket;

  var SocketChannel = /** @class */ (function () {
      function SocketChannel(dispatcher, opts) {
          var _this = this;
          this.onSend = function (event) {
              _this.socket.emit('message', event);
          };
          this.subscribeEvents = function () {
              _this.socket.on('message', _this.onMessage);
              _this.socket.on('ipaddr', _this.onIp);
              _this.socket.on('log', _this.onLog);
          };
          this.onIp = function (ipaddr) {
              _this.dispatcher.dispatch('log', 'Server IP address is: ' + ipaddr);
          };
          this.onLog = function () {
              var args = [];
              for (var _i = 0; _i < arguments.length; _i++) {
                  args[_i] = arguments[_i];
              }
              _this.dispatcher.dispatch('log', args);
          };
          this.onMessage = function (event) {
              _this.dispatcher.dispatch(event.type, event);
          };
          this.dispatcher = dispatcher;
          this.socket = lib$1(opts);
          this.dispatcher.register('send', this.onSend);
          this.subscribeEvents();
      }
      return SocketChannel;
  }());

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
  var Dispatcher = new EventDispatcher();

  var PeerClient = /*#__PURE__*/function () {
    function PeerClient() {
      var servers = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : defaults.servers;
      var constraints = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : defaults.constraints;
      var socket = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : defaults.socket;
      var timeoutAfter = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 1500;

      classCallCheck(this, PeerClient);

      // Timeout after 1500 ms by default
      this.timeoutAfter = timeoutAfter;
      this.match = this.match.bind(this);
      this.sendToRoom = this.sendToRoom.bind(this);
      this.createRoomId = this.createRoomId.bind(this); // setup peer client

      this.peerData = new App(Dispatcher, servers, constraints); // setup signaling channel

      this.signaling = new SocketChannel(Dispatcher, socket);
    }

    createClass(PeerClient, [{
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
          Dispatcher.dispatch("send", {
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
          // send the response
          participant.send(response);
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

  var Peer = /*#__PURE__*/function () {
    function Peer(options) {
      classCallCheck(this, Peer);

      if (!options) {
        throw new Error("cacheName option is required");
      }

      var cacheName = options.cacheName,
          servers = options.servers,
          constraints = options.constraints,
          socket = options.socket,
          timeoutAfter = options.timeoutAfter; // cache name to get the response from

      this.cacheName = cacheName;
      this.client = new PeerClient(servers, constraints, socket, timeoutAfter);
      this.getMiddleware = this.getMiddleware.bind(this);
      Dispatcher.register(PeerEventType.PEER, this._onPeerRequest.bind(this));
    } // Middleware factory function for fetch event


    createClass(Peer, [{
      key: "getMiddleware",
      value: function getMiddleware(event) {
        var _this = this;

        var request = event.request.clone();
        return {
          get: function () {
            var _get = asyncToGenerator( /*#__PURE__*/regenerator.mark(function _callee() {
              var response;
              return regenerator.wrap(function _callee$(_context) {
                while (1) {
                  switch (_context.prev = _context.next) {
                    case 0:
                      _context.prev = 0;
                      _context.next = 3;
                      return _this.client.match(request);

                    case 3:
                      response = _context.sent;

                      if (!response) {
                        _context.next = 6;
                        break;
                      }

                      return _context.abrupt("return", response);

                    case 6:
                      return _context.abrupt("return", null);

                    case 9:
                      _context.prev = 9;
                      _context.t0 = _context["catch"](0);

                      return _context.abrupt("return", null);

                    case 13:
                    case "end":
                      return _context.stop();
                  }
                }
              }, _callee, null, [[0, 9]]);
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
      value: function () {
        var _onPeerRequest2 = asyncToGenerator( /*#__PURE__*/regenerator.mark(function _callee2(e) {
          var cache, response;
          return regenerator.wrap(function _callee2$(_context2) {
            while (1) {
              switch (_context2.prev = _context2.next) {
                case 0:
                  _context2.next = 2;
                  return caches.open(this.cacheName);

                case 2:
                  cache = _context2.sent;
                  _context2.next = 5;
                  return cache.match(e.data);

                case 5:
                  response = _context2.sent;

                  if (response) {
                    this.client.sendToRoom(e.room.id, response);
                  }

                case 7:
                case "end":
                  return _context2.stop();
              }
            }
          }, _callee2, this);
        }));

        function _onPeerRequest(_x) {
          return _onPeerRequest2.apply(this, arguments);
        }

        return _onPeerRequest;
      }()
    }]);

    return Peer;
  }();

  var Network = /*#__PURE__*/function () {
    function Network() {
      classCallCheck(this, Network);

      this.getMiddleware = this.getMiddleware.bind(this);
    } // Middleware factory function for fetch event


    createClass(Network, [{
      key: "getMiddleware",
      value: function getMiddleware(event) {
        var request = event.request.clone();
        return {
          get: function () {
            var _get = asyncToGenerator( /*#__PURE__*/regenerator.mark(function _callee() {
              return regenerator.wrap(function _callee$(_context) {
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
  var exportObj = {
    CachePlugin: Cache,
    PeerPlugin: Peer,
    DelegatePlugin: Delegate,
    NetworkPlugin: Network,
    strategies: {
      fastest: middleware.applyFastest,
      ordered: middleware.applyOrdered
    }
  }; // Merge object for easy access

  Object.assign(PeerCDN, exportObj);
  self.PeerCDN = PeerCDN;

  exports.CachePlugin = Cache;
  exports.DelegatePlugin = Delegate;
  exports.NetworkPlugin = Network;
  exports.PeerPlugin = Peer;

  Object.defineProperty(exports, '__esModule', { value: true });

})));
