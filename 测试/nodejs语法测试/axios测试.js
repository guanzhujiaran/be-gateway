const axios = require('axios');
axios.get('https://www.bilibili.com', {
    headers: {
        'content-type': 'text,html/application'
    }
}).then(da => {
    console.log(da.data)
})