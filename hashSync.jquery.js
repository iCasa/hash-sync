/**
 * Sync location.hash with form elements
 *
 * @licencse MIT
 * @version 0.0.3
 */

;(function($){

    "use strict";

    var undefined;

    /* HashState class */
    function HashState(key) {
        if(key) this.key = key;
        this.readHash();
    }

    var _hs = HashState.prototype;

    _hs.key = undefined;

    _hs.set = function(key, val, silent) {
        var del = val === '' || val === null || val === undefined;
        if(del) return this.del(key);
        this.data[key] = val;
        this.writeHash(silent);
        return this;
    }

    _hs.get = function(key) {
        return key ? this.data[key] : this.data;
    }

    _hs.del = function(key, silent){
        delete this.data[key];
        this.writeHash(silent);
        return this;
    }

    _hs.writeHash = function(silent){
        var i
        ,   h = []
        ;

        for(i in this.hash) {
            h[h.length] = i+'='+encodeURIComponent(encode(this.hash[i]));
        }
        h.sort();
        h = h.join('&');
        if(silent) _hs.last_hash = '#' + h;

        location.hash = h;
        return this;
    }

    _hs.readHash = function() {
        var h = location.hash
        ,   o = get_url_vars(h, '#')
        ,   i
        ,   v
        ,   k = this.key
        ;

        for(i in o) {
            var v = decode(o[i]);
            if ( v != undefined ) {
                o[i] = v;
            }
            else {
                // delete o[i]; // ??? should we ignore values that we can't decode?
            }
        }
        if(k) {
            if(!o[k]) o[k] = {};
            this.data = o[k];
        }
        else {
            this.data = o;
        }
        this.hash = o;

        return this;
    }

    function encode(value) {
        if ( value == undefined ) return; // null and undefined
        switch(typeof value) {
            case 'boolean':
            case 'number':
            case 'undefined':
                value = String(value);
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
        ,   $i  = $t.find(':input:not(.hash-sync-disabled)')
        ,   _d = {
            hash: opts.hash || (new HashState())
          , last_hash: undefined
        }
        ;

        function inputChange(evt) {
            input2hash($(this));
        }

        $i.on('change', inputChange);

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
                    _d.hash.del(n, true);
                }
                else {
                    _d.hash.set(n, v, true);
                }
            }
        }

        function hash2input() {
            var $e = $t.find('textarea,select,input').not('.no-hash-sync')
            ;
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
                    _setChecked(inp, v == h)
                }
                else {
                    if(v != h) {
                        inp.val(h);
                        inp.trigger('change');
                    }
                }
            });
        }

        hash2input();

        $(window).on('hashchange', function() {
            if(location.hash !== _d.hash.last_hash) {
                _d.hash.readHash();
                hash2input();
            }
        });

        function _setChecked($int, checked) {
            checked = !!checked;
            if ( $int.prop('checked') != checked ) {
                if ( checked || !$inp.is(':radio') ) {
                    $int.prop('checked', checked).trigger('change');
                }
            }
            return $int;
        }
    }

    $.fn.hashSync = hashSync;
    window.HashState = HashState;

})(jQuery);