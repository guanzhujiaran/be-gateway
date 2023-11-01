const axios = require('axios');

(async () => {
    let data = { data: 'aaaaaa' };
    await axios.post('http://localhost:3000/ChatGPT/ask', data)

})();