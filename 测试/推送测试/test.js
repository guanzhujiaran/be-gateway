let axios = require('axios');
let my_send_notify = {
    push_key: {//专门存放token的地方
        pushme: 'T1cBRRgooZyhfIJMYPjR'//pushme的token
    },
    push_me: async (title, msg,) => {

        try {
            let resp = await axios.post('https://push.i-i.me', {
                'push_key': my_send_notify.push_key.pushme,
                'title': title,
                'content': msg
            })
            if(resp.data!='success'){
                console.error(`推送失败！原因：${resp.data}`)
            }
        }
        catch (e) {
            console.warn(e, '消息推送失败！')
        }
    }
}