$(document).ready(function(){
	Utils.initSocketIO();
	}
);


var remote_desc;
var client_id;
var host_id;
var Utils={
	socket:null,
	initSocketIO: function(){
		Utils.socket = io.connect('http://localhost:3000');
		Utils.socket.on('connect',function(data){
			console.log("Connected: "+Utils.socket.socket.sessionid);
		});
		Utils.socket.on('initWebRTCSession',function(data){
			client_id=data;
			WebRTC.gotClientConnection();
			//alert('SessionInit: '+client_id);
		});
		Utils.socket.on('onSessionAnswer',function(data){
			console.log(data);
			client_id=data.client_id;
			remote_desc=new RTCSessionDescription(data.sdesc);
		});
		Utils.socket.on('remoteIceCandidate',function(data){
			//console.log(data);
			WebRTC.addICECandidate(data);
		});
		Utils.socket.on('remoteRTCDescription',function(data){
			WebRTC.onRemoteDescription(data);
			remote_desc=data;
		});
	},
	initSessionWithName: function(name)
	{
		Utils.socket.emit('initSession',name);
	},
	sendIceCandidate: function(remote_id,candidate)
	{
		Utils.socket.emit('iceCandidate',{id:remote_id,candidate:candidate});
	},
	updateSessionInfo:function(id,blob)
	{
		Utils.socket.emit('updateSessionInfo',{sid:id,sdesc:blob});
		// $.ajax({
		// 	type: "POST",
		// 	url: '/sessions/'+id,
		// 	data: blob,	
		// 	success: Utils.onUpdateSuccess,
		// 	dataType: 'json'
		// });
	},

	onUpdateSuccess:function(data){
		console.log("Session updated: "+data);
	},
	joinSession:function(id,callback)
	{
		Utils.socket.emit('getSessionInfo',id,function(id){
			//console.log("Got SDP for "+id+ "\n"+sdp);
			callback(id);
		});
		// $.ajax({
		// 	type: "GET",
		// 	url: '/sessions/'+id,
		// 	success: callback,
		// 	dataType: 'json'
		// });
	},
	getSessionInfo:function(id,callback)
	{
		Utils.socket.emit('getSessionInfo',id,function(id,data){
			//console.log("Got SDP for "+id+ "\n"+sdp);
			callback(data);
			host_id=id;
		});
		// $.ajax({
		// 	type: "GET",
		// 	url: '/sessions/'+id,
		// 	success: callback,
		// 	dataType: 'json'
		// });
	},
	sendRTCDescription:function(remote_id,description)
	{
		Utils.socket.emit('remoteRTCDescription',{id:remote_id,desc:description})
	},
	sendAnswerDescription:function(remote_id,description)
	{
		Utils.socket.emit('remoteRTCDescription',{id:remote_id,desc:description})
	},
	sendAnswer:function(id,blob)
	{
		Utils.socket.emit('sessionAnswer',{sid:id,sdesc:blob});
	}

}