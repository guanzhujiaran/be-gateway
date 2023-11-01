let zmq = require('zeromq');

(async () => {
    let sock = new zmq.Request();
    let OriginMessage = `问：
【#哔哩哔哩漫画#作品推荐】《有兽焉》：网页链接
人间有神兽，来自九重天~
随着科技的发展，往日威风凛凛的神兽们日子大不如前。神兽四不像奉命下凡，去解救流落人间的落魄神兽。
在凡间，他遇到了走投无路的老同事貔貅，不得志的酒友兔爷，被贬下凡的金银角兄弟....
他们之间会发生怎样的故事？欢迎来到毛球们的世界
答：`
    sock.receiveTimeout = 30e3;
    sock.connect('tcp://localhost:5555');

    await sock.send(OriginMessage);
    let [result] = await sock.receive();
    console.log(`同义改写内容：${OriginMessage}\n结果：${result.toString()}`)
    return result.toString();
})()