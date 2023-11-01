function sleep(ms) {
    return new Promise(resolve => setTimeout(() => resolve(sleep), ms));
}

(() => {
    let a = async function (t) {
        console.log(`times:${t}`);
        await sleep(t*1e3)
    }
    async function main(){
        let c = [1,2,3,4,5,6]
        for (i of c){
            a(i)
        }
    }
    main()
})()

