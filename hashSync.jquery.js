/**
 * Sync location.hash with form elements
 *
 * @licencse MIT
 * @version 0.0.7
 */

;(function($){

    "use strict";

    var undefined; //jshint ignore:line
    var hop = Object.hasOwnProperty || ({}).hasOwnProperty;

    /* HashState class */
    function HashState(key) {
        if(key) this.key = key;
        this._listeners = [];
        this._idx = HashState._instances.length;
        HashState._instances[this._idx] = this;
        this.readHash();
    }

    HashState._instances = [];

    var _hs = HashState.prototype;

    $.extend(_hs, {

        key: undefined,

        _listeners: undefined,
        _idx: -1,

        get: function(key) {
            return key ? this.data[key] : this.data;
        },

        set: function(key, val, silent, throttled) {
            var del = val === '' || val === null || val === undefined;
            if(del) return this.del(key, silent, throttled);
            this.data[key] = val;
            this[throttled ? 'writeHashThrottled' : 'writeHash'](silent);
            return this;
        },

        del: function(key, silent, throttled) {
            delete this.data[key];
            this[throttled ? 'writeHashThrottled' : 'writeHash'](silent) ;
            return this;
        },

        destroy: function () {
            var _listeners = this._listeners;
            _listeners.length = 0;
            delete HashState._instances[this._idx];
        },

        onChange: function (fn) {
            var _listeners = this._listeners;
            if ( _listeners.indexOf(fn) < 0 ) {
                _listeners.push(fn);
            }
        },

        offChange: function (fn) {
            var _listeners = this._listeners;
            var l = _listeners.length;
            while (l--) {
                if ( _listeners[l] === fn ) {
                    _listeners.splice(l, 1);
                }
            }
        },

        writeHash: function(silent) {
            var i
            ,   h = []
            ,   hash = this.hash
            ;

            for(i in hash) if ( hop.call(hash, i) ){
                h[h.length] = i+'='+encodeURIComponent(encode(hash[i]));
            }
            h.sort();
            h = h.join('&');
            if(silent) this.last_hash = '#' + h;

            location.hash = h;
            return this;
        },

        writeHashThrottled: function(silent) {
            var self = this;
            var to = self._writeHashTo;
            // If at least one call with silent == false, breack the silence
            if ( !silent ) {
                self._writeHashNoSilence = true;
            }

            if ( to ) clearTimeout(to);
            return self._writeHashTo =
            to = setTimeout(function () {
                silent = !self._writeHashNoSilence;
                delete self._writeHashNoSilence;
                delete self._writeHashTo;
                self.writeHash(silent);
            }, 15);
        },

        readHash: function() {
            var h = location.hash
            ,   o = get_url_vars(h, '#')
            ,   i
            ,   v
            ,   k = this.key
            ;

            for(i in o) if ( hop.call(o, i) ) {
                v = decode(o[i]);
                if ( v != undefined ) {
                    o[i] = v;
                }
                // else {
                    // delete o[i]; // ??? should we ignore values that we can't decode?
                // }
            }
            this.hash = o;
            if(k) {
                if(!o[k]) o[k] = {};
                o = o[k];
            }

            var data = this.data;
            this.data = o;
            if ( this._listeners.length ) {
                // var evt = {};
                // var added = {};
                // var updated = {};
                // var removed = {};
                var _old = {};
                var _new = {};
                var changed;

                for(i in o) if ( hop.call(o, i) ) {
                    v = o[i];

                    // update
                    if ( hop.call(data, i) ) {
                        if ( data[i] !== v ) {
                            _new[i] = v;
                            _old[i] = data[i];
                            // updated[i] = data[i];
                            // evt.update = updated;
                            changed = true;
                        }
                    }
                    // add
                    else {
                        _new[i] = v;
                        // added[i] = v;
                        // evt.add = added;
                        changed = true;
                    }
                }

                // removed
                for(i in data) if ( hop.call(data, i) && !hop.call(o, i) ) {
                    _old[i] = data[i];
                    // removed[i] = data[i];
                    // evt['delete'] = removed;
                    changed = true;
                }

                if ( changed ) {
                    emitEvent.call(this, this._listeners, _new, _old);
                }
            }

            return this;
        }
    });

    function encode(value) {
        if ( value == undefined ) return; // null and undefined
        switch(typeof value) {
            case 'boolean':
            case 'number':
            case 'undefined':
                value = String(value);
            /*falls through*/

            case 'string':
            break;

            case 'function': return encode(value());

            case 'object':
                value = JSON.stringify(value);
            break;
        }

        return value;
    }

    function decode(str) {
        var num = parseFloat(str);
        if ( num == str ) return num;
        var fl = str.substr(0,1) + str.slice(-1);
        if ( ~['{}', '[]', '""'].indexOf(fl) ) {
            try {
                return JSON.parse(str);
            }
            catch(err) {
                return undefined;
            }
        }

        return str;
    }


    /* hashSync jQuery plugin */

    function hashSync(opts) {

        var $t = this
        ,   _d = {
                hash: opts.hash || (new HashState())
              // , last_hash: undefined
            }
        ;

        function inputChange(evt) {
            var $target = $(evt.target);
            if ( $target.is('.no-hash-sync') ) return;
            input2hash($target);
        }

        $t.on('change input', inputChange);

        function input2hash(e) {
            var n = e.attr('name')
            ,   v = e.val()
            ,   del
            ;
            if(!n) return false;

            switch(true) {
                case e.is(':checkbox'): {
                    del = !e.prop('checked');
                } break;

                case e.is(':radio'): {
                    if(e.prop('checked')) {
                        del = false;
                    }
                } break;

                default: {
                    del = v === '' || v == undefined;
                }
            }

            if ( del != undefined ) {
                if(del) {
                    _d.hash.del(n, true, true);
                }
                else {
                    _d.hash.set(n, v, true, true);
                }
            }
        }

        function hash2input() {
            var $e = findInputs($t);
            $e.each(function(idx, elem){
                var inp = $(elem)
                ,   i = inp.attr('name')
                ,   v = inp.val()
                ;
                if ( !i ) return; // no-name == no-action

                var h = _d.hash.get(i);
                if(inp.is(':checkbox')) {
                    _setChecked(inp, undefined != h);
                }
                else if(inp.is(':radio')) {
                    _setChecked(inp, v == h);
                }
                else {
                    if(v != h) {
                        inp.val(h);
                        inp.trigger('change');
                    }
                }
            });
        }

        // Write hash to imputs only when there is a hash (a least "#")
        if ( location.hash !== '' || location.href.slice(-1) === '#' ) {
            hash2input();
        }

        _d.hash.onChange(hash2input);

        function _setChecked($int, checked) {
            checked = !!checked;
            if ( $int.prop('checked') != checked ) {
                if ( checked || !$int.is(':radio') ) {
                    $int.prop('checked', checked).trigger('change');
                }
            }
            return $int;
        }
    }

    /**
     *  Find selector in this and descendants of this.
     */
    function findAll(elems, selector) {
        var search = elems.filter(selector);
        return search.add(elems.not(search).find(selector));
    }

    function findInputs(context) {
        return findAll($(context), 'textarea,select,input').not('.no-hash-sync');
    }

    function emitEvent(_listeners, newData, oldData) {
        for(var i=0, l=_listeners.length, fn; i<l; i++ ) {
            fn = _listeners[i];
            if ( !fn ) continue;
            fn.call(this, newData, oldData);
        }
    }

    window.HashState =
    hashSync.HashState = HashState;
    $.fn.hashSync = hashSync;

    $(window).on('hashchange', function() {
        var hash = location.hash;
        $.each(HashState._instances, function (i, h) {
            if(hash !== h.last_hash) {
                h.readHash();
                h.last_hash = hash;
            }
        });
        _hs.last_hash = hash;
    });

}
(jQuery));
