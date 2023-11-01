//  Hello World client
const zmq = require('zeromq');

Paraphase_nlpcda= async function (OriginMessage)  {
    try {
        const sock = new zmq.Request();
        sock.connect('tcp://localhost:5555');
        await sock.send(OriginMessage);
        const [result] = await sock.receive();
        console.log(result)
        return result.toString();
    }
    catch (e) {
        console.log(e)
        return undefined
    }
},

Paraphase_nlpcda('1145141919810');