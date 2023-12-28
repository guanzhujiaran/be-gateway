class API {
	constructor(uname) {
		this.uname = uname;
	}
	chatLog = (text, type = "info") => {
		let dateTime_str = new Date().toLocaleString();
		switch (type) {
			case "info": {
				console.log(`【${this.uname}】${text}  --${dateTime_str}`);
				break;
			}
			case "warning": {
				console.warn(`【${this.uname}】${text}  --${dateTime_str}`);
				break;
			}
			case "error": {
				console.error(`【${this.uname}】${text}  --${dateTime_str}`);
				break;
			}
			default: {
				console.debug(`【${this.uname}】${text}  --${dateTime_str}`);
				break;
			}
		}
	};
}
module.exports= {
    API,
}