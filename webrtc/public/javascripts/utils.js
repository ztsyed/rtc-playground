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
		Utils.socket.on('remoteIceCandidate',function(data){
			//console.log(data);
			WebRTC.addICECandidate(data);
		});
		Utils.socket.on('remoteRTCDescription',function(data){
			WebRTC.onRemoteDescription(data);
			remote_desc=data;
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
	},
	getPC:function(client_id,stream,onRemoteStream,onIceCallback)
	{
		servers = {"iceServers": [{"url": "stun:stun.l.google.com:19302"}]};
    pc_constraints = {"optional": []};
	  pc = new RTCPeerConnection(servers,pc_constraints);
	  pc.remote_id=client_id;
    trace("Created local peer connection object host_local_pc");
    pc.onicecandidate = WebRTC.onIceCallback; 
    pc.onaddstream = WebRTC.onRemoteStream; 
    pc.addStream(stream);	
    Utils.connections[client_id]=pc;
    pc.gotDescription=function(description)
    {
       console.log(client_id);
    	 pc.setLocalDescription(description);
   		trace("Local description from host_local_pc \n" + description);
	
    Utils.sendRTCDescription(client_id,description); 	
    }
    pc.createOffer(pc.gotDescription);
	}

}