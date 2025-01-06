
class base_model{
    /**
     *
     * @return {Object}
     */
    toJSON=()=>{
        return Object.fromEntries(Reflect.ownKeys(this).map((el,idx)=> {
            if (typeof this[el] == 'function') return;
            return [el, this[el]]
        }).filter(el=>el))
    }
}

/**
 * @template T
 * @typedef {Object} RootObject
 * @property {number} code
 * @property {T} data
 * @property {string} msg
 * @property {number} ttl
 */
class base_api_model extends base_model {
    code=0;
    data=null;
    msg='';
    ttl=1;

    constructor({code = 0, data =undefined, msg = '', ttl = 1}){
        super();
        this.code=code;
        this.data=data;
        this.msg=msg;
        this.ttl=ttl;
    }

}

module.exports = {
    base_api_model,
    base_model
}