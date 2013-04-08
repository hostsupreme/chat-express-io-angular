module.exports = function (app, express) {
	var RedisStore = require('connect-redis')(express),
		passport = require('passport')
		;
	
    var config = {
        'env': 'dev',
        'environment': 'development',
		'server': {
			'port': 8080,		
			'ip': '10.0.2.15',
			'host': 'localhost',
			'slab_buffer_size': 100*1024
		},
		'redis': {
			'host': 'localhost',
			'port': 6379
		},
		'frontend': {
			'baseurl': '/',
			'jsurl': '/js',
			'appurl': '/js/app',
			'tplurl': '/tpls'
		},
        'view': {
            'location': app.get('appdir') + '/views',
            'engine': 'ejs'
        },
		'routes': app.get('appdir') + '/routes',
		'session': {
            'secret': 'immafirinmalazr',
            'key': 'connection.sid',
			'store': null
        },
        'socketio': {
            'port': 8080,
            'host': 'localhost',
            'uri': 'http://localhost:8080'
        },
    };
	
	require('tls').SLAB_BUFFER_SIZE = config.server.slab_buffer_size;
	
	config.redis.createClient = function () {
		return require('redis').createClient(config.redis.port, config.redis.host).setMaxListeners(0);
	}

	config.session.store = new RedisStore({ 
		'client': config.redis.createClient(),
		'host': config.redis.host, 
		'port': config.redis.port 
	});



    // app config
	app.configure(function() {
		app.use(express.favicon());
		app.use(express.logger(config.env));
		app.use(express.bodyParser());
		app.use(express.methodOverride());    

		// session
		app.use(express.cookieParser(config.session.secret));
		app.use(express.session(config.session));
		
		// passport middleware init after session, before routes!
		app.use(passport.initialize());
		app.use(passport.session());

		app.use(require('stylus').middleware(app.get('basedir') + '/public'));
		app.use(express.static(app.get('path').join(app.get('basedir'), 'public')));
		
		app.set('views', config.view.location);
		app.set('view engine', config.view.engine);
		
		// development only
		app.use(express.errorHandler());
	});
    
    return config;
    
}

