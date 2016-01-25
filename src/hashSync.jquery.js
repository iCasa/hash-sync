/**
 * Sync location.hash with form elements
 *
 * @licencse MIT
 * @verions 0.0.1
 */


/*globals jQuery, location, JSON*/

// ;(function($){

    var $ = jQuery;
    var trim = ''.trim;

    /* HashState class */

    import HashState from './hashState';

    /* hashSync jQuery plugin */

    export default function hashSync(opts) {

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
            if(e.is(':checkbox') && !e.prop('checked')) {
                del = true;
            }
            else if(!e.is(':radio')){
                del = v === '' || v === null || v === undefined;
            }

            if(del) {
                _d.hash.del(n, true);
            }
            else {
                _d.hash.set(n, v, true);
            }
        }

        function hash2input() {
            var i, inp, v
            ,   $e = $t.find(':input:not(.hash-sync-disabled)')
            ;
            $e.each(function(){
                var inp = $(this)
                ;

                v = inp.val();
                i = inp.attr('name');

                if(inp.is(':checkbox')) {
                    inp.prop('checked', !!_d.hash.get(i));
                    inp.trigger('change');
                }
                else if(inp.is(':radio')) {
                    inp.prop('checked', v == _d.hash.get(i));
                    if(v == _d.hash.get(i)) {
                        inp.trigger('change');
                    }
                }
                else {
                    if(v != _d.hash.get(i)) {
                        inp.val(_d.hash.get(i));
                        inp.trigger('change');
                    }
                }
            });
        }

        hash2input();

        $(window).on('hashchange', function(){
            if(location.hash !== _d.hash.last_hash) {
                _d.hash.readHash();
                hash2input();
            }
        });
    }

    hashSync.HashState = HashState;
    $.fn.hashSync = hashSync;
    
// })(jQuery);