module.exports = function (io, appconfig) {
	var RedisStore = require('socket.io/lib/stores/redis'),
		pub    = appconfig.redis.createClient(),
		sub    = appconfig.redis.createClient(),
		client = appconfig.redis.createClient();
		
	io
		.enable('browser client etag')
		.enable('browser client minification')
		.enable('browser client gzip')
		.set('log level', 2)
		.set('transports', ['websocket'])
		.set('store', new RedisStore({
			pub: pub,
			sub: sub,
			client:client
		}))
		;
}
