﻿/// <reference path="../../../smartJs/sj.js" />
/// <reference path="../../../smartJs/sj-core.js" />
/// <reference path="../../../smartJs/sj-event.js" />
/// <reference path="../core.js" />
'use strict';

PocketCode.Bricks = {

    BrickContainer: (function () {

        function BrickContainer(bricks) {
            this._bricks = bricks || [];
            this._pendingOps = {};
        }

        BrickContainer.prototype.merge({
            execute: function (onExecutedListener, threadId) {
                if (!onExecutedListener || !threadId || !(onExecutedListener instanceof SmartJs.Event.EventListener) || typeof threadId !== 'string')
                    throw new Error('BrickContainer: missing or invalid arguments on execute()');

                var id = SmartJs._getId();
                this._pendingOps[id] = { threadId: threadId, listener: onExecutedListener, loopDelay: false, childIdx: 0 };
                this._executeContainerItem({ id: id, loopDelay: false });
            },

            _executeContainerItem: function (args) {
                var op = this._pendingOps[args.id];
                if (args.loopDelay)
                    op.loopDelay = op.loopDelay || args.loopDelay;
                var idx = op.childIdx;

                var bricks = this._bricks;
                if (idx < bricks.length) {
                    op.childIdx++;
                    bricks[idx].execute(new SmartJs.Event.EventListener(this._executeContainerItem, this), args.id);
                }
                else {
                    var listener = op.listener;
                    delete this._pendingOps[args.id];
                    listener.handler.call(listener.scope, { id: op.threadId, loopDelay: op.loopDelay });
                }
            },

            pause: function () {
                var bricks = this._bricks;
                for (var i = 0, l = bricks.length; i < l; i++) {
                    if (bricks[i].pause)
                        brick[i].pause();
                }
            },

            resume: function () {
                var bricks = this._bricks;
                for (var i = 0, l = bricks.length; i < l; i++) {
                    if (bricks[i].resume)
                        brick[i].resume();
                }
            },
            stop: function () {
                this._pendingOps = {};
            },
        });

        return BrickContainer;
    })(),

    BaseBrick: (function () {
        BaseBrick.extends(SmartJs.Core.Component);

        function BaseBrick(device, sprite) {
            this._device = device;
            this._sprite = sprite;
        }

        BaseBrick.prototype.merge({
            execute: function (onExecutedListener, threadId) {
                if (!onExecutedListener || !threadId || !(onExecutedListener instanceof SmartJs.Event.EventListener) || typeof threadId !== 'string')
                    throw new Error('BrickContainer: missing or invalid arguments on execute()');

                this._onExecutedListener = onExecutedListener;
                this._threadId = threadId;
                this._execute();
            },
            _return: function (loopDelay) {
                this._onExecutedListener.handler.call(this._onExecutedListener.scope, { id: this._threadId, loopDelay: loopDelay });
            },
        });

        return BaseBrick;
    })(),

};


PocketCode.Bricks.ThreadedBrick = (function () {
    ThreadedBrick.extends(PocketCode.Bricks.BaseBrick, false);

    function ThreadedBrick(device, sprite) {
        PocketCode.Bricks.BaseBrick.call(this, device, sprite);
        this._pendingOps = {};
    }

    ThreadedBrick.prototype.merge({
        execute: function (onExecutedListener, threadId) {    //parameters can be null, e.g. ProgramStartBrick, WhenActionBrick, BroadcastReceiveBrick if not triggerend by BroadcastWaitBrick
            if (!onExecutedListener || !threadId || !(onExecutedListener instanceof SmartJs.Event.EventListener) || typeof threadId !== 'string')
                throw new Error('BrickContainer: missing or invalid arguments on execute()');

            var id = SmartJs._getId();
            this._pendingOps[id] = { threadId: threadId, listener: onExecutedListener };
            this._execute(id);
        },
        _return: function (id, loopDelay) {
            if (!this._pendingOps[id])  //stopped
                return;

            var loopD = loopDelay || false;
            var listener = this._pendingOps[id].listener;
            var threadId = this._pendingOps[id].threadId;
            delete this._pendingOps[id];
            if (listener)
                listener.handler.call(listener.scope, { id: threadId, loopDelay: loopD });
        },
        stop: function () {
            this._pendingOps = {};
        },
    });

    return ThreadedBrick;
})();


PocketCode.Bricks.SingleContainerBrick = (function () {
    SingleContainerBrick.extends(PocketCode.Bricks.ThreadedBrick, false);

    function SingleContainerBrick(device, sprite) {
        PocketCode.Bricks.ThreadedBrick.call(this, device, sprite);

        //this._bricks typeof PocketCode.Bricks.BrickContainer
    }

    SingleContainerBrick.prototype.merge({
        _execute: function (threadId) {
            this._bricks.execute(new SmartJs.Event.EventListener(this._return, this), threadId);
        },
        pause: function () {
            this._bricks.pause();
        },
        resume: function () {
            this._bricks.resume();
        },
    });

    return SingleContainerBrick;
})();


PocketCode.Bricks.RootContainerBrick = (function () {
    RootContainerBrick.extends(PocketCode.Bricks.SingleContainerBrick, false);

    function RootContainerBrick(device, sprite) {
        PocketCode.Bricks.SingleContainerBrick.call(this, device, sprite);

        //this._bricks typeof PocketCode.Bricks.BrickContainer
        //this.running = false;

        //events
        this._onExecuted = new SmartJs.Event.Event(this);
    }

    RootContainerBrick.prototype.merge({
        onExecuted: {
            get: function () { return this._onExecuted; },
            //enumerable: false,
            //configurable: true,
        },
        //_execute: function (threadId) {
        //    this._bricks.execute(new SmartJs.Event.EventListener(this._return, this), threadId);
        //},
        //pause: function () {
        //    this._bricks.pause();
        //},
        //resume: function () {
        //    this._bricks.resume();
        //},
    });

    return RootContainerBrick;
})();


PocketCode.Bricks.LoopBrick = (function () {
    LoopBrick.extends(PocketCode.Bricks.SingleContainerBrick, false);

    function LoopBrick(device, sprite) {
        PocketCode.Bricks.SingleContainerBrick.call(this, device, sprite);

        //this._bricks typeof PocketCode.Bricks.BrickContainer
    }

    LoopBrick.prototype.merge({
        execute: function (onExecutedListener, callId) {
            var id = SmartJs._getId();
            this._pendingOps[id] = { callId: callId, listener: onExecutedListener, childIdx: 0, startTime: new Date() };
            this._execute(id);
        },
        _return: function (id, loopDelay) {
            var op = this._pendingOps[id];
            var listener = op.listener;
            var callId = op.callId;

            var executionDelay = 0;
            if (loopDelay)
                executionDelay = 20 - (new Date() - op.startTime);  //20ms min loop cycle time
            delete this._pendingOps[id];

            if (executionDelay > 0)
                window.setTimeout(function () {
                    listener.handler.call(listener.scope, { id: callId, loopDelay: loopDelay });
                }, executionDelay);
            else {  //spend 5ms on a roundtrip to avoid long running script messages + enable UI update
                //window.setTimeout(function () {
                //    listener.handler.call(listener.scope, { id: callId, loopDelay: loopDelay });
                //}, 5);
                listener.handler.call(listener.scope, { id: callId, loopDelay: loopDelay });
            }
        },
    });

    return LoopBrick;
})();


PocketCode.Bricks.UnsupportedBrick = (function () {
    UnsupportedBrick.extends(PocketCode.Bricks.BaseBrick, false);

    function UnsupportedBrick(device, sprite, propObject) {
        PocketCode.Bricks.BaseBrick.call(this, device, sprite);

        this._xml = propObject.xml;
        this._brickType = propObject.brickType;
    }

    UnsupportedBrick.prototype._execute = function () {
        console.log('call to unsupported brick: sprite= ' + this._sprite.name + ', xml= ' + this._xml);
        this._return();
    };

    return UnsupportedBrick;
})();


