var host_local_pc = null;
var localVideo, remoteVideo;
var localstream = null;
var remotestream = null;

var dtmfSender = null;
var sdpConstraints = {'mandatory': {
                      'OfferToReceiveAudio':true, 
                      'OfferToReceiveVideo':true }};
var candidates=[];
var remote;

WebRTC={

  init:function()
  {
    var servers = {"iceServers": [{"url": "stun:stun.l.google.com:19302"}]};
    var pc_constraints = {"optional": []};
    host_local_pc = new RTCPeerConnection(servers,pc_constraints);
    trace("Created local peer connection object host_local_pc");
    host_local_pc.onicecandidate = WebRTC.iceCallback; 
    host_local_pc.onaddstream = WebRTC.gotRemoteStream; 
    
    localVideo = document.getElementById("localVideo");

    remoteVideo = document.getElementById("remoteVideo");
    trace("Requesting local stream");
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
    remoteVideo.addEventListener("dblclick",function(e){
      if(remoteVideo.height<=200){
        remoteVideo.height=800;
        remoteVideo.width=800;
      }else
      {
        remoteVideo.height=200;
        remoteVideo.width=200; 
      }
    });    
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
  gotStream:function(stream)
  {
    trace("Received local stream");
    // Call the polyfill wrapper to attach the media stream to this element.
    localstream = stream;
    host_local_pc.addStream(localstream);
    trace("Adding Local Stream to peer connection");  
    $("#localdiv").show();  
    document.getElementById("localVideo").src = URL.createObjectURL(stream);
    Utils.initSessionWithName('zia');
  },
  gotDescription:function(description)
  {
    host_sdp=description;
    host_local_pc.setLocalDescription(description);
    trace("Local description from host_local_pc \n" + description);
    if(host_id)
    {
      remote=host_id;
    }else{
      remote=client_id;
    }
    Utils.sendRTCDescription(remote,description);
    
  },
  onRemoteDescription:function(description)
  {
    console.log("WebRTC:onRemoteDescription:"+description);
    host_local_pc.setRemoteDescription(new RTCSessionDescription(description));
  },
  iceCallback:function(event)
  {
    console.log("Host::iceCallback");
  if (event.candidate) {
    if(host_id)
    {
      remote=host_id;
    }else{
      remote=client_id;
    }
    //console.log("iceCallback\n"+event.candidate);
    Utils.sendIceCandidate(remote,JSON.stringify(event.candidate));
    //host_local_pc.addIceCandidate(new RTCIceCandidate(event.candidate));
    //trace("Local ICE candidate: \n" + event.candidate.candidate);
    }
  },
  gotRemoteStream:function(event)
  {
  // Call the polyfill wrapper to attach the media stream to this element.
  //attachMediaStream(audio2, e.stream);
  remotestream=event.stream;
  trace("Received remote stream");
  $("#remotediv").show(); 
  $("#session-controls").show(); 
  document.getElementById("remoteVideo").src = URL.createObjectURL(event.stream);
 // enableDtmfSender();
  },
  gotClientConnection:function()
  {
    console.log("Got Client Connection")
    host_local_pc.createOffer(WebRTC.gotDescription);
  },
  stop:function()
  {
 //   localstream.stop();
    host_local_pc.close();
    host_local_pc=null;
    Utils.hangup(remote);
  },
  hangup:function()
  {
//    localstream.stop();
    host_local_pc=null;
  },
  addICECandidate:function(cand){
    host_local_pc.addIceCandidate(new RTCIceCandidate(JSON.parse(cand)));
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


function setCandidate(candidate){
  host_local_pc.addIceCandidate(new RTCIceCandidate(candidate));
}

var host_sdp;
function enableDtmfSender(){
  if (localstream != null) {
    var local_audio_track = localstream.getAudioTracks()[0];
    dtmfSender = host_local_pc.createDTMFSender(local_audio_track);
    trace("Created DTMF Sender\n");
    dtmfSender.ontonechange = dtmfOnToneChange;
  }
  else {
    trace("No Local Stream to create DTMF Sender\n");
  }
}