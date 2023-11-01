(async () => {

    const puppeteer = require('puppeteer-extra')
    const StealthPlugin = require('puppeteer-extra-plugin-stealth')
    puppeteer.use(StealthPlugin())
    let global_var = {}
    browser = await puppeteer.launch(
        {
            executablePath: `C:\\Users\\Acer\\AppData\\Local\\Google\\Chrome SxS\\Application\\chrome.exe`,//浏览器路径
            //executablePath:`C:\\Program Files\\Google\\Chrome Dev\\Application\\chrome.exe`,
            headless: false,//false为显示浏览器界面
            defaultViewport: {
                width: 1920,
                height: 1080,
            },
            args: [
                `--start-stack-profiler`,
                '--disable-notifications=true',
                '--no-sandbox',
                '--disable-infobars',
                '--disable-session-crashed-bubble',
                '--disable-setuid-sandbox',
                //'--disable-web-security',
                //'--disable-gpu',
                '--disable-dev-shm-usage',
                '--no-first-run',
                //'--mute-audio',
                '--no-zygote',
                //'--single-process',
                `--profile-directory=Default`,
                "--disable-features=IsolateOrigins,site-per-process",
                `--start-maximized`,
            ],
            userDataDir: "UserData\\" + `cookie3`,
            ignoreDefaultArgs: [
                '--enable-automation',
                '--disable-extensions'
            ],
            ignoreHTTPSErrors: true,
        });
    global_var.browser = browser;

    let page = await browser.newPage();
    global_var.page = page;
    
})()
















