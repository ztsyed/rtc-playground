
/*
 * GET home page.
 */
var handler=require('../handler.js');

exports.index = function(req, res){
  console.log(req.query.id);
  console.log(handler.getSession(req.query.id));
  res.render('index', { title: 'WebRTC Demo' })
};