axios = require('axios');

(async function () {
    let OriginMessage = 'hello world!'
    for (let i = 0; i < 5; i++) {
        axios.post(url = 'http://localhost:5555/v1/ai_reply', { 'prompt': OriginMessage + i }, { timeout: 300e3 }).then(
            (da) => {
                let result = da.data.response;
                console.log(result);
            }
        )
    }
})()