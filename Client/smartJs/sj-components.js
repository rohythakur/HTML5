﻿/// <reference path="sj.js" />
/// <reference path="sj-core.js" />
/// <reference path="sj-event.js" />
/// <reference path="sj-communication.js" />
/// <reference path="sj-ui.js" />
'use strict';

SmartJs.Components = {

    Application: (function () {
        Application.extends(SmartJs.Core.EventTarget);

        function Application() {
            this._viewport = new SmartJs.Ui.Viewport();

            this._onConnectionStatusChange = new SmartJs.Event.Event(this);

            this._online = navigator.onLine;
            this._addDomListener(window, 'offline', this._offlineHandler);
            this._addDomListener(window, 'online', this._onlineHandler);
            this._addDomListener(window, 'error', this._errorHandler);
        }

        Object.defineProperties(Application.prototype, {
            onConnectionStatusChange: {
                get: function () { return this._onConnectionStatusChange; },
                //enumerable: false,
                //configurable: true,
            },
        });

        Application.prototype.merge({
            _offlineHandler: function () {
                if (!this._online) return;
                this._online = false;
                this._onConnectionStatusChange.dispatchEvent({ online: false });
            },
            _onlineHandler: function () {
                if (this._online) return;
                this._online = true;
                this._onConnectionStatusChange.dispatchEvent({ online: true });
            },
            _errorHandler: function (error, filePath, line) {
                console.log('SmartJs.Components.Application: global error: ' + error + ', ' + filePath + ', ' + lin);
            },
        });

        return Application;
    })(),

    Timer: (function () {

        function Timer(delay, listener, startOnInit, callbackArgs) {
            this._delay = delay;
            //this._remainingTime = delay;  //init on start()
            this._callBackArgs = callbackArgs;  //introduced to enable threaded timer identification
            this._paused = false;

            //events
            this._onExpire = new SmartJs.Event.Event(this);
            if (listener)
                this._onExpire.addEventListener(listener);

            if (startOnInit)
                this.start();
        }

        //events + properties
        Object.defineProperties(Timer.prototype, {
            onExpire: {
                get: function () { return this._onExpire; },
                //enumerable: false,
                //configurable: true,
            },
            remainingTime: {
                get: function () {
                    if (this._paused || this._remainingTime === 0)
                        return this._remainingTime;
                    else
                        return this._remainingTime - (new Date() - this._startTime);
                },
                //enumerable: false,
                //configurable: true,
            },
        });

        //methods
        Timer.prototype.merge({
            start: function () {
                this._clearTimeout();

                this._startTime = new Date();
                this._remainingTime = this._delay;
                if (this._remainingTime === 0) {
                    this._onExpire.dispatchEvent(this._callBackArgs);
                    return;
                }
                this._setTimeout(this._delay);
                this._paused = false;
            },
            pause: function () {
                if (this._paused)
                    return;

                this._clearTimeout();
                this._remainingTime -= (new Date() - this._startTime);
                if (this._remainingTime < 0)    //
                    this._remainingTime = 0;
                this._paused = true;
            },
            resume: function () {
                if (!this._paused)
                    return;

                this._startTime = new Date();
                this._setTimeout(this._remainingTime);
                this._paused = false;
            },
            stop: function() {
                this._clearTimeout();
                this._remainingTime = 0;
                this._paused = false;
            },
            _dispatchExpire: function () {
                this._remainingTime = 0;
                this._onExpire.dispatchEvent(this._callBackArgs);
            },
            _setTimeout: function (delay) {
                this._clearTimeout();

                //var callback = this._dispatchExpire;
                this._timeoutId = window.setTimeout(this._dispatchExpire.bind(this), delay);
            },
            _clearTimeout: function () {
                if (this._timeoutId) {
                    window.clearTimeout(this._timeoutId);
                    this._timeoutId = undefined;
                }
            },
        });

        return Timer;
    })(),
    /*
    //adapters
    CookieAdapter: (function () {
        CookieAdapter.extends(SmartJs.Core.Component);

        function CookieAdapter() {
            //this._expires = new Date().getTime() + 1000 * 60 * 60 * 24 * 365;  //in one year
            this.enabled = navigator.cookieEnabled;
        }

        //TODO: implementation + exception when storage size out of range (full)
        //enabled:
        //get: function(key){},
        CookieAdapter.prototype.merge({
            get: function (key) {
                var str = document.cookie;
                if (str.match(new RegExp(key + '=([^;]*)', 'g')))
                    return str.RegExp.$1;
                return undefined;
            },
            set: function (key, value) {
                document.cookie = key + '=' + value + ';';
            },
            del: function (key) {
                document.cookie = key + '=;expires=Thu, 01 Jan 1970 00:00:01 GMT;';
            },
            clear: function () {
                var cookies = document.cookie.split(';');
                for (var i = 0; i < cookies.length; i++) {
                    var equal = cookies[i].indexOf('=');
                    this.del(equal > -1 ? cookie.substr(0, equal) : cookie);
                }
            },
        });
        //set: function(key, value){},
        //delete
        return CookieAdapter;
    })(),

    SessionStorageAdapter: (function () {
        SessionStorageAdapter.extends(SmartJs.Core.Component);

        function SessionStorageAdapter() {
        }
        //enabled:
        //get: function(key){},
        //set: function(key, value){},
        //delete
        return SessionStorageAdapter;
    })(),

    LocalStorageAdapter: (function () {
        LocalStorageAdapter.extends(SmartJs.Core.Component);

        function LocalStorageAdapter() {
        }
        //enabled:
        //get: function(key){},
        //set: function(key, value){},
        //delete
        return LocalStorageAdapter;
    })(),
    */
    /*SettingsProvider: (function () {
        function SettingsProvider() {

        }

        return SettingsProvider;
    })(),

    NavigationProvider: (function () {
        NavigationProvider.extends(SmartJs.Core.EventTarget);

        function NavigationProvider() {

        }

        return NavigationProvider;
    })(),

    LocalizationProvider: (function () {
        LocalizationProvider.extends(SmartJs.Core.EventTarget);

        function LocalizationProvider() {

        }

        return LocalizationProvider;
    })(),

    FeedbackProvider: (function () {
        FeedbackProvider.extends(SmartJs.Core.EventTarget);

        function FeedbackProvider() {

        }

        return FeedbackProvider;
    })(),

*/
};


//navigator.getLanguage = function () {     //TODO: this should become part of the localization provider
//    var lang = navigator.userLanguage || navigator.language;
//    if (lang.length > 2)
//        return lang.substring(0, 3);
//    return lang;
//}
//navigator.defineProperty(navigator.prototype, 'getLanguage', { enumerable: false });
