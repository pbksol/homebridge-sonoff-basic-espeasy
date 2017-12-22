var request = require('request');
var Service, Characteristic;

module.exports = function(homebridge){
	Service = homebridge.hap.Service;
	Characteristic = homebridge.hap.Characteristic;
	
	homebridge.registerAccessory('homebridge-sonoff-basic-espeasy-pbk', 'SonoffBasicESPEasyPBK', SonoffBasicESPEasyPBK);
}

function SonoffBasicESPEasyPBK(log, config){
	this.log = log;
	this.name = config.name || 'Sonoff Switch';
	this.ip = config.ip;

	if(!this.ip)
		throw new Error('Your must provide IP address of the switch.');
	
	this.outlet = (config["switchType"] !== undefined) ? ((config["switchType"] == "outlet") ? true : false) : false;
	
	if (this.outlet) {
		this.service = new Service.Outlet(this.name);
		this.service
			.getCharacteristic(Characteristic.OutletInUse)
			.on('get', this.getPowerState.bind(this));
	} else {
		this.service = new Service.Switch(this.name);
	}
	
	this.serviceInfo = new Service.AccessoryInformation();

	this.serviceInfo
		.setCharacteristic(Characteristic.Manufacturer, 'Sonoff')
		.setCharacteristic(Characteristic.Model, 'Basic Switch')
		.setCharacteristic(Characteristic.SerialNumber, 'EB1B-ED2E-5EA945508A88');

	this.service
		.getCharacteristic(Characteristic.On)
		.on('get', this.getPowerState.bind(this))
		.on('set', this.setPowerState.bind(this));
}

SonoffBasicESPEasyPBK.prototype = {
	getPowerState: function(callback){
		var log = this.log;

		request.get({
			url: 'http://' + this.ip + '/control?cmd=status,gpio,12',
			timeout: 10000
		}, function(error, response, body){
			if(!error && response.statusCode == 200){
				var json = JSON.parse(body);

				log.debug('State: ' + json.state);
				callback(null, (json.state == 1));
				return;
			} else {
				callback(null, (json.state == 0));
				return;
			}

			log.debug('Error getting power state. (%s)', error);

			callback();
		});
	},

	setPowerState: function(state, callback){
		var log = this.log;

		request.get({
			url: 'http://' + this.ip + '/control?cmd=event,' + ((state) ? 'PowerOn' : 'PowerOff'),
			timeout: 10000
		}, function(error, response, body){
			if(!error && response.statusCode == 200){
				if(body == 'OK')
					return;

				log.debug('Response Error: %s', body);
				return;
			}

			log.debug('Error setting power state. (%s)', error);
		});

		callback();
	},

	identify: function(callback){
		callback();
	},

	getServices: function(){
		return [this.serviceInfo, this.service];
	}
};
