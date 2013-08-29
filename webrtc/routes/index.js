
/*
 * GET home page.
 */
var handler=require('../handler.js');

exports.index = function(req, res){
	if(req.params.id){
	  console.log("QuaryPath ID: " +req.params.id);
		if(handler.sessionExists(req.params.id)){
			console.log(handler.getSession(req.params.id));
			res.render('guest', { title: 'WebRTC Demo Guest View' });
		}else
		{
			 res.render('index', { title: 'WebRTC Demo' });
		}
	}else
	{
		 res.render('index', { title: 'WebRTC Demo' });
	}
  
};

exports.setSession = function(req, res){
	console.log("QuaryPath ID: " +req.params.id);
  console.log(req.body);
  if(req.params.id && req.body){
  	handler.setSession(req.params.id,req.body);
  	res.send(200);
  }
  else{
  	res.send(400);
  }
};
exports.getSession = function(req, res){
	console.log("GetSession QuaryPath ID: " +req.params.id);
		if(handler.sessionExists(req.params.id)){
			console.log(handler.getSession(req.params.id));
			res.render('guest', { title: 'WebRTC Demo Guest View' });
		}else
		{
			 res.render('index', { title: 'WebRTC Demo' });
		}
};