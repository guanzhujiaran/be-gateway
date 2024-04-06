
class API {
	constructor(uname) {
		this.uname = uname;
	}
	chatLog = (text, type = "info") => {
		let dateTime_str = new Date().toLocaleString();
		switch (type) {
			case "info": {
				console.log(`{info}【${this.uname}】${text}  --${dateTime_str}`);
				break;
			}
			case "warning": {
				console.warn(`{warning}【${this.uname}】${text}  --${dateTime_str}`);
				break;
			}
			case "error": {
				console.error(`{error}【${this.uname}】${text}  --${dateTime_str}`);
				break;
			}
			default: {
				console.debug(`{debug}【${this.uname}】${text}  --${dateTime_str}`);
				break;
			}
		}
	};
}
module.exports= {
    API,
}