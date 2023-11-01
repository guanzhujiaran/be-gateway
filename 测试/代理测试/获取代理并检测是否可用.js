let axios = require('axios')
axios.default.defaults.timeout = 3000
axios.default.defaults.headers.post = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36 Edg/112.0.0.0',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'accept-encoding': 'gzip, deflate',
    'origin': 'https://www.padaili.com',
    'referer': 'https://www.padaili.com/user/api',
    'cookie': 'PHPSESSID=1t1e94dgb76nff2g17jfejsspq; _ga=GA1.2.1211466078.1679493730; _gid=GA1.2.957990186.1679493730; Hm_lvt_7931b01194e19897fca6e11106bfc730=1679493730; Hm_lvt_550672a265db97bedecf48ee742a872a=1679495102; Hm_lpvt_550672a265db97bedecf48ee742a872a=1679495314; user=eyJpdiI6IlBwZkRGM1ZKSzFwMDQ4REkxMVllOHc9PSIsInZhbHVlIjoiRjVvU08wXC9HS2NoXC85WGh5Y0twRmt3PT0iLCJtYWMiOiJkYzI3MjIwNWU2NjU4MjgzMGI4Zjg3MGNjZWM2MDllMTIyYmM2NzMxNzk1MjlkM2UyMzVkYWJlZjEyNTA3YzE0In0%3D; loginuser=eyJpdiI6IjAzNTNZZzlnM3RHcVhjUkpEQmZmNEE9PSIsInZhbHVlIjoiWitSaVhXbVRyRFJWTWNDM3Q1cWtRdz09IiwibWFjIjoiYWI4OTIwZjc3MGJiZGJmMzY4OWI1MmQzYjY3YTFlZDAwYWE1YjBiYzZmMzkwNTZiMzU1YzMzYWM2OTk5YmExNyJ9; loginpass=eyJpdiI6IlVuRm1OelBkNm91aGE2NHM1YjYrbVE9PSIsInZhbHVlIjoieFNRRzBQNnNMNldNblZIdVB4T0l6UT09IiwibWFjIjoiN2ViN2MxZjllY2FiNjI4YjY4YzQyN2NmNjhmMTc5MDEwZWI5Y2NjMjI3ZTNjNDgzMGJjMGNhNDFlMDBlZDI4MyJ9; qq=eyJpdiI6IjVGYk5neGVkdFhMSnl6VklJYk1SYXc9PSIsInZhbHVlIjoiMFN5bGxCNDV2ZDZ4OFwvRWdERzJQcVE9PSIsIm1hYyI6ImQzNGExYTEyNmUwODAyZDdkYWYzZDIxNmI2MmM5NWZjZjc4MDU0ZDgyNzEwNzU0NDMyZjJkMzk1YTZlMzNmMGYifQ%3D%3D; mail=eyJpdiI6IjVKdis5THVPaFpDd3VWOHpjT1wvTzlnPT0iLCJ2YWx1ZSI6IkFVRTdhZkJBRGNGVGxXVXdOd1JDMkE9PSIsIm1hYyI6IjZmNDVjYzk1ODYyNDdhZDI3ZDdiYjNjYmJlZGZmZjRmYzFkMjM1NGJlZGNjNDMxM2Q2ZTMzNDliYmNmYmQ4NGEifQ%3D%3D; sid=eyJpdiI6IjBKRXo5UklsaktQYXhNWmdOY0xmaFE9PSIsInZhbHVlIjoiTldjRnltWlNhb0ZqVlB1dlF4ZmtIdFZ3cGVwZmx6SnVmN1l5dkkwcnFMVFEyK3JrMlVPNFdzcWoxUU41RFwvaXMiLCJtYWMiOiI5MGRkNDk4MDUyOTIzM2Q2NTVlOWY1YTM4YWE1ZjFkM2E0OGJjYjhmOWVlNmIzYjYzNjNkZWI4OWNjM2RjNzZmIn0%3D; Hm_lpvt_7931b01194e19897fca6e11106bfc730=1679495910; XSRF-TOKEN=eyJpdiI6IjRYaUg4b0dSYVMreEJYam5kRGtZS1E9PSIsInZhbHVlIjoiZHRRcnlTNldPc2MyRDY1K2ZLbDBYQ3lKUXY1ZzZ1TWNsXC9iT1dNbzFJNjFRM0U5MVFhanBqZ0Y0dHZUWEM2VXUiLCJtYWMiOiJlNDI3MzcyNjQwOTE4MmIyYjNiNjVjMGFhMjk2ZjBjZjQ5YzBjNjUxODEzMWYxOTkyMGNmNDhhMTk5Mzk5NGYyIn0%3D; laravel_session=eyJpdiI6InpoV1MwUWVieFUzcStVQjNKcDFFamc9PSIsInZhbHVlIjoiTllVNExWbXpOc1lVZGpcL2Y4YVNuN3ErM3ZHVmU5cTM3NnVvd016U3o2SEdQUG9xK2RJWkMwM2o5R2FrNkpnQ2IiLCJtYWMiOiIxZWM5ZDcyMmM3OTViZDZkNTg0YTIzYTc1YzBlZDkxM2E4NzRjN2Q2OTFkYjRkMDgyZmQxYzRjMjdiZDViYzdkIn0%3D',
    'sec-ch-ua': "\"Google Chrome\";v=\"105\", \"Not)A;Brand\";v=\"8\", \"Chromium\";v=\"105\"",
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': "\"Windows\"",
    'sec-fetch-dest': 'document',
    'sec-fetch-mode': 'navigate',
    'sec-fetch-site': 'same-origin',
};
async function post(api, data, proxy) {
    let post_config = {
        data: data,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36 Edg/112.0.0.0',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
            'accept-encoding': 'gzip, deflate',
            'origin': 'https://www.padaili.com',
            'referer': 'https://www.padaili.com/user/api',
            'cookie': 'PHPSESSID=1t1e94dgb76nff2g17jfejsspq; _ga=GA1.2.1211466078.1679493730; _gid=GA1.2.957990186.1679493730; Hm_lvt_7931b01194e19897fca6e11106bfc730=1679493730; Hm_lvt_550672a265db97bedecf48ee742a872a=1679495102; Hm_lpvt_550672a265db97bedecf48ee742a872a=1679495314; user=eyJpdiI6IlBwZkRGM1ZKSzFwMDQ4REkxMVllOHc9PSIsInZhbHVlIjoiRjVvU08wXC9HS2NoXC85WGh5Y0twRmt3PT0iLCJtYWMiOiJkYzI3MjIwNWU2NjU4MjgzMGI4Zjg3MGNjZWM2MDllMTIyYmM2NzMxNzk1MjlkM2UyMzVkYWJlZjEyNTA3YzE0In0%3D; loginuser=eyJpdiI6IjAzNTNZZzlnM3RHcVhjUkpEQmZmNEE9PSIsInZhbHVlIjoiWitSaVhXbVRyRFJWTWNDM3Q1cWtRdz09IiwibWFjIjoiYWI4OTIwZjc3MGJiZGJmMzY4OWI1MmQzYjY3YTFlZDAwYWE1YjBiYzZmMzkwNTZiMzU1YzMzYWM2OTk5YmExNyJ9; loginpass=eyJpdiI6IlVuRm1OelBkNm91aGE2NHM1YjYrbVE9PSIsInZhbHVlIjoieFNRRzBQNnNMNldNblZIdVB4T0l6UT09IiwibWFjIjoiN2ViN2MxZjllY2FiNjI4YjY4YzQyN2NmNjhmMTc5MDEwZWI5Y2NjMjI3ZTNjNDgzMGJjMGNhNDFlMDBlZDI4MyJ9; qq=eyJpdiI6IjVGYk5neGVkdFhMSnl6VklJYk1SYXc9PSIsInZhbHVlIjoiMFN5bGxCNDV2ZDZ4OFwvRWdERzJQcVE9PSIsIm1hYyI6ImQzNGExYTEyNmUwODAyZDdkYWYzZDIxNmI2MmM5NWZjZjc4MDU0ZDgyNzEwNzU0NDMyZjJkMzk1YTZlMzNmMGYifQ%3D%3D; mail=eyJpdiI6IjVKdis5THVPaFpDd3VWOHpjT1wvTzlnPT0iLCJ2YWx1ZSI6IkFVRTdhZkJBRGNGVGxXVXdOd1JDMkE9PSIsIm1hYyI6IjZmNDVjYzk1ODYyNDdhZDI3ZDdiYjNjYmJlZGZmZjRmYzFkMjM1NGJlZGNjNDMxM2Q2ZTMzNDliYmNmYmQ4NGEifQ%3D%3D; sid=eyJpdiI6IjBKRXo5UklsaktQYXhNWmdOY0xmaFE9PSIsInZhbHVlIjoiTldjRnltWlNhb0ZqVlB1dlF4ZmtIdFZ3cGVwZmx6SnVmN1l5dkkwcnFMVFEyK3JrMlVPNFdzcWoxUU41RFwvaXMiLCJtYWMiOiI5MGRkNDk4MDUyOTIzM2Q2NTVlOWY1YTM4YWE1ZjFkM2E0OGJjYjhmOWVlNmIzYjYzNjNkZWI4OWNjM2RjNzZmIn0%3D; Hm_lpvt_7931b01194e19897fca6e11106bfc730=1679495910; XSRF-TOKEN=eyJpdiI6IjRYaUg4b0dSYVMreEJYam5kRGtZS1E9PSIsInZhbHVlIjoiZHRRcnlTNldPc2MyRDY1K2ZLbDBYQ3lKUXY1ZzZ1TWNsXC9iT1dNbzFJNjFRM0U5MVFhanBqZ0Y0dHZUWEM2VXUiLCJtYWMiOiJlNDI3MzcyNjQwOTE4MmIyYjNiNjVjMGFhMjk2ZjBjZjQ5YzBjNjUxODEzMWYxOTkyMGNmNDhhMTk5Mzk5NGYyIn0%3D; laravel_session=eyJpdiI6InpoV1MwUWVieFUzcStVQjNKcDFFamc9PSIsInZhbHVlIjoiTllVNExWbXpOc1lVZGpcL2Y4YVNuN3ErM3ZHVmU5cTM3NnVvd016U3o2SEdQUG9xK2RJWkMwM2o5R2FrNkpnQ2IiLCJtYWMiOiIxZWM5ZDcyMmM3OTViZDZkNTg0YTIzYTc1YzBlZDkxM2E4NzRjN2Q2OTFkYjRkMDgyZmQxYzRjMjdiZDViYzdkIn0%3D',
            'sec-ch-ua': "\"Google Chrome\";v=\"105\", \"Not)A;Brand\";v=\"8\", \"Chromium\";v=\"105\"",
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': "\"Windows\"",
            'sec-fetch-dest': 'document',
            'sec-fetch-mode': 'navigate',
            'sec-fetch-site': 'same-origin',
        }
    }
    if (proxy) {
        post_config.proxy = proxy
    }
    return new Promise((resolve, reject) => {
        axios.post(URL = api, post_config)
            .then((res) => {
                resolve(res.data);
            })
            .catch((err) => {
                reject(err.data);
            })
    })
};
function get(url, params) {
    return new Promise((resolve, reject) => {
        axios.get(url, {
            params: params
        })
            .then((res) => {
                resolve(res.data);
            })
            .catch((err) => {
                reject(err.message)
            })
    });
}

async function get(api, params, proxy) {
    let get_config = {
        params: params,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36 Edg/112.0.0.0',
            'Accept': 'application/json, text/plain, */*',
            'accept-encoding': 'gzip, deflate',
            'origin': 'https://t.bilibili.com',
            'referer': 'https://t.bilibili.com/?spm_id_from=444.41.0.0',
            'sec-ch-ua': "\"Google Chrome\";v=\"105\", \"Not)A;Brand\";v=\"8\", \"Chromium\";v=\"105\"",
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': "\"Windows\"",
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-site',
        }
    }
    if (proxy) {
        get_config.proxy = proxy
    }
    return new Promise((resolve, reject) => {
        axios.get(api, get_config)
            .then(res => {
                resolve(res.data)
            })
            .catch(err => {
            console.warn(err.message)
            })
    });
}
Array.prototype.shuffle = function () {
    "use strict";
    var a = [], b = [], n = this.length, i, j, seq;
    // @b: a[i] element exists?
    for (i = 0; i < n; i++) {
        b[i] = 0;
    }

    function _getIndex(b, seq) {
        var n = b.length;
        for (i = 0; ; i = (i + 1) % n) {
            if (!b[i]) {
                if (seq === 0) {
                    break;
                }
                seq--;
            }
        }
        return i;
    }

    while (n-- > 0) {
        seq = Math.floor(3 * this.length * Math.random());
        j = _getIndex(b, seq);
        a.push(this[j]);
        b[j] = 1;
    }

    return a;
};

async function main() {
    let api = 'http://httpbin.org/get'
    console.log(await get(api, undefined, {
        protocol: 'http',
        host: '42.192.45.192',
        port: 996
    }))
}

(async function () {
    await main();

})()
