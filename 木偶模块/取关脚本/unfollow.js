
const fs = require('fs');
const { Page } = require('puppeteer-core');
const __dir_path = './木偶模块/'
function sleep(ms) {
    return new Promise(resolve => setTimeout(() => resolve(sleep), ms));
}
/**
 * 取关脚本
 * @param {Page} pg 
 */
async function do_unfollow(pg) {
    let bili_cookie = await pg.cookies('https://www.bilibili.com')
    let csrf = bili_cookie.filter(el => el.name == 'bili_jct').shift().value;
    let unfollow_data = fs.readFileSync(__dir_path + "取关脚本/取关对象.csv", function (err) {
        if (err) {
            console.log(err);
            throw (err);
        }
        //console.log(data.toString());
    }).toString()
    let unfollow_arr = unfollow_data.split('\n')
    let all_times = unfollow_arr.length;
    let now_time = 0;
    for (let unfollow_raw of unfollow_arr) {
        let unfollow_arr_trim = unfollow_raw.trim()
        if (unfollow_arr_trim) {
            let unfollow_mid = unfollow_arr_trim.split('\t')[0].split('/').slice(-1).join('')
            let resp_json = await pg.evaluate((post_data) => {
                return fetch('https://api.bilibili.com/x/relation/modify', {
                    credentials: "include",
                    method: 'POST',
                    body: new URLSearchParams(post_data)
                }).then(resp => {
                    return resp.json();
                })
                    .catch(e => {
                        return e;
                    })
            },
                {
                    fid: unfollow_mid,
                    act: 2,
                    re_src: 11,
                    spmid: '333.999.0.0',
                    extend_content: JSON.stringify({ "entity": "user", "entity_id": unfollow_mid }),
                    csrf: csrf,
                }
            );
            if (resp_json.code != 0) {
                console.error(`${JSON.stringify(unfollow_arr_trim)}\n取关失败，原因：${JSON.stringify(resp_json, '', '\t')}\n休息2分钟`)
                await sleep(2 * 60 * 1e3);
            } else {
                now_time++;
                console.log(`当前进度【${now_time}/${all_times}】\t${unfollow_mid}\t取关成功！${JSON.stringify(resp_json, '', '\t')}\t${(new Date()).toLocaleString()}`)
            }
            await sleep(20e3)
        }
    }
}

module.exports = do_unfollow;