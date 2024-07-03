import {connect} from 'puppeteer-real-browser'


connect({

    headless: 'auto',

    args: [],

    customConfig: {},

    skipTarget: [],

    fingerprint: false,

    turnstile: true,

    connectOption: {},

    fpconfig: {},

    proxy:{
        host:'127.0.0.1',
        port:'24001',
    }

})
.then(async response => {
    const {browser, page} = response
    await page.setRequestInterception(true)
    page.on('request',req=>{
        console.log(req)
        req.continue()
    })
    page.on('response',response =>{
        console.log(response)
    })
    await page.goto('https://www.browserscan.net/zh/bot-detection')

})
.catch(error=>{
    console.log(error.message)
})
