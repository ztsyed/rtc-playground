$(document).ready(function(){
	$(".drag").draggable();
	//$(".resizable").resizable();
	Utils.initSocketIO();
	}
);

var remote_desc;
var client_id;
var host_id;
var Utils={
	socket:null,
	connections:{},
	initSocketIO: function(){
		Utils.socket = io.connect('https://'+window.location.host);
		Utils.socket.on('connect',function(data){
			console.log("Connected: "+Utils.socket.socket.sessionid);
		});
		Utils.socket.on('initWebRTCSession',function(data){
			client_id=data;
			WebRTC.gotClientConnection(client_id);
			//alert('SessionInit: '+client_id);
		});
		Utils.socket.on('onSessionAnswer',function(data){
			console.log(data);
			client_id=data.client_id;
			remote_desc=new RTCSessionDescription(data.sdesc);
		});
		Utils.socket.on('remoteIceCandidate',function(remote_id,data){
			//console.log(data);
			console.log("remoteIceCandidate:"+remote_id);
			Utils.connections[remote_id].pc.addIceCandidate(new RTCIceCandidate(JSON.parse(data)));
		});
		Utils.socket.on('remoteRTCDescription',function(remote_id,data){
			console.log("remoteRTCDescription:"+remote_id);
			if(data.type=="answer")
			{//PeerConnection already exists
				Utils.connections[remote_id].onRemoteDescription(data);

			}else{
				//Create PeerConnection
    		Utils.connections[remote_id]=new MyPeerConnection(remote_id).createPeerConnection(localstream,data);
    		Utils.connections[remote_id].answer();
			}
		});
		Utils.socket.on('hangup',function(data){
			WebRTC.hangup(data);
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
	joinSession:function(id,callback)
	{
		Utils.socket.emit('getSessionInfo',id,function(id){
			//console.log("Got SDP for "+id+ "\n"+sdp);
			callback(id);
		});
	},
	getSessionInfo:function(id,callback)
	{
		Utils.socket.emit('getSessionInfo',id,function(id,data){
			//console.log("Got SDP for "+id+ "\n"+sdp);
			callback(data);
			host_id=id;
		});
	},
	sendRTCDescription:function(remote_id,description)
	{
		Utils.socket.emit('remoteRTCDescription',{id:remote_id,desc:description})
	},
	hangup:function(remote_id)
	{
		Utils.socket.emit('hangup',remote_id);
	}

}