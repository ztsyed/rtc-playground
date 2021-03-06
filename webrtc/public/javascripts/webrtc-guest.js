
var localVideo,remoteVideo;
var localstream = null;
var remotestream = null;

var dtmfSender = null;
var sdpConstraints = {'mandatory': {
                      'OfferToReceiveAudio':true, 
                      'OfferToReceiveVideo':true }};
WebRTC={
  candidates:[],
  init:function()
  {
    //WebRTC.initWebRTC();
   
  },
  initCamera:function()
  {
    WebRTC.init();
    // Call into getUserMedia via the polyfill (adapter.js).
    getUserMedia({audio:true, video:true},
      WebRTC.gotStream, function() {});
  },
  initScreen:function()
  {
    WebRTC.init();
    // Call into getUserMedia via the polyfill (adapter.js).
    getUserMedia({video:{mandatory:{chromeMediaSource:'screen'}}},
      WebRTC.gotStream, function() {});
  },
  initWebRTC:function()
  {
    var servers = {"iceServers": [{"url": "stun:stun.l.google.com:19302"}]};
    var pc_constraints = {"optional": []};
    guest_local_pc = new RTCPeerConnection(servers,pc_constraints);
    trace("Created local peer connection object guest_local_pc");
    guest_local_pc.onicecandidate = WebRTC.iceCallback; 
    guest_local_pc.onaddstream = WebRTC.gotRemoteStream; 
    
    trace("Requesting local stream");
  },

  gotStream:function(stream)
  {
    localVideo = document.getElementById("localVideo");
    localVideo.addEventListener("dblclick",function(e){
      if(localVideo.height<=200){
        localVideo.height=800;
        localVideo.width=800;
      }else
      {
        localVideo.height=200;
        localVideo.width=200; 
      }
    }); 
    trace("Received local stream");
    // Call the polyfill wrapper to attach the media stream to this element.
    localstream = stream;
    trace("Adding Local Stream to peer connection");
    $("#localdiv").show();      
    document.getElementById("localVideo").src = URL.createObjectURL(stream);
    Utils.joinSession('zia',function(data){
      host_id=data;
    });
  },
  stop:function()
  {
//    localstream.stop();
    guest_local_pc.close();
    guest_local_pc=null;
    Utils.hangup(remote);
  },
  hangup:function()
  {
 //   localstream.stop();
    guest_local_pc=null;
  },
  toggleCamera:function(){
    vtrack=localstream.getVideoTracks()[0];
    vtrack.enabled=!vtrack.enabled;
    if(vtrack.enabled)
    {
      $("#btnCam").html("Camera");
    }else{
      $("#btnCam").html("<strike>Camera</strike>");
    }
  },
  toggleMic:function(){
    atrack=localstream.getAudioTracks()[0];
    atrack.enabled=!atrack.enabled;
    if(atrack.enabled)
    {
      $("#btnMic").html("Microphone");
    }else{
      $("#btnMic").html("<strike>Microphone</strike>");
    }
  }
}

var host_sdp;
function enableDtmfSender(){
  if (localstream != null) {
    var local_audio_track = localstream.getAudioTracks()[0];
    dtmfSender = guest_local_pc.createDTMFSender(local_audio_track);
    trace("Created DTMF Sender\n");
    dtmfSender.ontonechange = dtmfOnToneChange;
  }
  else {
    trace("No Local Stream to create DTMF Sender\n");
  }
}
function MyPeerConnection(client_id){
  this.client_id=client_id;
  servers = {"iceServers": [{"url": "stun:stun.l.google.com:19302"}]};
  pc_constraints = {"optional": []};
  this.pc = new RTCPeerConnection(servers,pc_constraints);
}

MyPeerConnection.prototype={
  createPeerConnection:function(stream,description)
  {
    servers = {"iceServers": [{"url": "stun:stun.l.google.com:19302"}]};
    this.pc.remote_id=client_id;
    trace("Created local peer connection object "+this.client_id);
    this.pc.onicecandidate = MyPeerConnection.prototype.onIceCallback.bind(this); 
    this.pc.onaddstream = MyPeerConnection.prototype.onRemoteStream.bind(this); 
    this.pc.addStream(stream); 
    this.pc.setRemoteDescription(new RTCSessionDescription(description));
    trace("Remote description Set");
    return this;
  },
  answer:function(){
    this.pc.createAnswer(MyPeerConnection.prototype.answerDescription.bind(this));
  },
  answerDescription:function(description)
  {
    Utils.sendRTCDescription(this.client_id,description);
    this.pc.setLocalDescription(description);
    trace("Local description Set");
  },
  onIceCallback:function(event)
  {
    console.log("Host::iceCallback");
  if (event.candidate) {
    //console.log("iceCallback\n"+event.candidate);
    Utils.sendIceCandidate(this.client_id,JSON.stringify(event.candidate));
    //host_local_pc.addIceCandidate(new RTCIceCandidate(event.candidate));
    //trace("Local ICE candidate: \n" + event.candidate.candidate);
    }
  },
  onRemoteStream:function(event)
  {
  // Call the polyfill wrapper to attach the media stream to this element.
  //attachMediaStream(audio2, e.stream);
  remotestream=event.stream;
  trace("Received remote stream");
  $("#remotediv").show(); 
  $("#session-controls").show(); 
  vDiv='<video id="'+this.client_id+'" autoplay height="200" width="200" src="'+URL.createObjectURL(event.stream)+'"></video>';
      
  $("#remotediv").append(vDiv);  
  $("#remotediv").show();  
//  vDiv.src=;

  $("#"+this.client_id).dblclick(function(e){
      if(this.height<=200){
        this.height=800;
        this.width=800;
      }else
      {
        this.height=200;
        this.width=200; 
      }
    }); 
 // enableDtmfSender();
  },
}