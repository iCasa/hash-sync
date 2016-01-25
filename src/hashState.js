/**
 * Hash State class
 *
 * @licencse MIT
 * @verions 0.0.1
 */

/*globals location, JSON*/

export default class HashState {

    constructor(key) {
        if(key) this.key = key;
        this.readHash();
    }

    get(key) {
        return key != undefined ? this.data[key] : this.data;
    }

    set(key, val, silent) {
        var del = val === '' || val === null || val === undefined;
        if(del) return this.del(key);
        this.data[key] = val;
        this.writeHash(silent);
        return this;
    }



    del(key, silent) {
        delete this.data[key];
        this.writeHash(silent);
        return this;
    }

    writeHash(silent) {
        var i
        ,   h = []
        ;

        for(i in this.hash) {
            h[h.length] = i+'='+encodeURIComponent(JSON.stringify(this.hash[i]));
        }
        h.sort();
        h = h.join('&');
        if(silent) this.__proto__.last_hash = '#' + h;

        location.hash = h;
        return this;
    }

    readHash() {
        var h = location.hash
        ,   o = HashState.toObject(h.replace(/^#/, ''))
        ,   i
        ;

        for(i in o) {
            try {
                o[i] = JSON.parse(o[i]);
            }
            catch(e){

            }
        }
        this.hash = o;
        if(this.key) {
            if(!this.hash[this.key]) this.hash[this.key] = {};
            this.data = this.hash[this.key];
        }
        else {
            this.data = this.hash;
        }

        return this;
    }

    static toObject(str, sep, eq, ndec) {
        if(sep == undefined) sep = '&';
        if(eq == undefined) eq = '=';
        var j = String(str).split(sep)
        ,   i = j.length
        ,   a = {}
        ,   t
        ;
        ndec = ndec ? function (v) { return String(v).replace(/%26/g, '&') } : decodeURIComponent;
        while(i-->0) if(t = String(j[i]).trim()) {
            t = t.split(eq);
            j[i] = String(t.splice(0,1)[0]).trim();
            t = t.join(eq);
            a[ndec(j[i])] = ndec(String(t).trim());
        }
        return a;
    }

}