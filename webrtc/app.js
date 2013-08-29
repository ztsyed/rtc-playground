
/**
 * Module dependencies.
 */

var express = require('express')
  , handler = require('./handler')
  , routes = require('./routes');

var app = module.exports = express.createServer();
io = require('socket.io').listen(app);
// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// Routes

app.get('/', routes.index);
app.post('/sessions/:id', routes.setSession);
app.get('/sessions/:id', routes.getSession);

app.listen(3000, function(){
  console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});

// Socket.io events
io.sockets.on('connection', function (socket) {
  console.log("Got a connection:"+socket.id);
  socket.on('initSession',function(name){
    handler.setSession(name,socket.id);
  });
  socket.on('remoteRTCDescription', function (data) {
    if(data.id && data.desc){
      io.sockets.socket(data.id).emit('remoteRTCDescription',data.desc);
    }
    //console.log("socket.io:updateSessionInfo:"+data.sid+ "\n"+data.data);
  });
  socket.on('updateSessionInfo', function (data) {
    if(data.sid && data.sdesc){
      handler.setSession(data.sid,{socket_id:socket.id,sdesc:data.sdesc});
    }
    //console.log("socket.io:updateSessionInfo:"+data.sid+ "\n"+data.data);
  });

  socket.on('getSessionInfo',function(sid,fn){
    if(handler.sessionExists(sid)){
      fn(handler.getSession(sid));
      io.sockets.socket(handler.getSession(sid)).emit('initWebRTCSession',socket.id);
    }else
      {
        fn();
      }
  });
  socket.on('sessionAnswer',function(data){
    io.sockets.socket(handler.getSession(data.sid).socket_id).emit('onSessionAnswer',{client_id:socket.id,sdesc:data.sdesc});
  });
  socket.on('iceCandidate',function(data){
    io.sockets.socket(data.id).emit('remoteIceCandidate',data.candidate);
  });
});
