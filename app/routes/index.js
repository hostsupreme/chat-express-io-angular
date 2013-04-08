
module.exports = function (app) {
    var config = app.get('config');
    
    app.get('/', function (req, res) {
        res.render('index', 
			{ 
				title: 'Door Tweakers'
			});
    });
};
