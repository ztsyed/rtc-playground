var guest_local_pc = null;
var localVideo = document.getElementById("localVideo");
var remoteVideo = document.getElementById("remoteVideo");
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
    WebRTC.initWebRTC();
  },

  initWebRTC:function()
  {
    var servers = null;
    var pc_constraints = {"optional": []};
    guest_local_pc = new RTCPeerConnection(servers,pc_constraints);
    trace("Created local peer connection object guest_local_pc");
    guest_local_pc.onicecandidate = WebRTC.iceCallback; 
    guest_local_pc.onaddstream = WebRTC.gotRemoteStream; 
    
    trace("Requesting local stream");
    // Call into getUserMedia via the polyfill (adapter.js).
    getUserMedia({audio:true, video:true},
      WebRTC.gotStream, function() {});
  },
  onRemoteDescription:function(description)
  {
    console.log("WebRTC:onRemoteDescription:"+description);
    guest_local_pc.setRemoteDescription(new RTCSessionDescription(description));
    guest_local_pc.createAnswer(WebRTC.answerDescription);
  },
  answerDescription:function(description)
  {
    if(host_id)
    {
      remote=host_id;
    }else{
      remote=client_id;
    }
    Utils.sendRTCDescription(remote,description);
    guest_local_pc.setLocalDescription(description);
  },
  gotStream:function(stream)
  {
    trace("Received local stream");
    // Call the polyfill wrapper to attach the media stream to this element.
    localstream = stream;
    guest_local_pc.addStream(localstream);
    trace("Adding Local Stream to peer connection");    
    document.getElementById("localVideo").src = URL.createObjectURL(stream);
    Utils.joinSession('zia',function(data){
      host_id=data;
    });
  },
  gotDescription:function(description)
  {
    host_sdp=description;
    guest_local_pc.setLocalDescription(description);
    trace("Local description from guest_local_pc \n" + description);   
  },
  iceCallback:function(event)
  {
    console.log("Guest::iceCallback");
  if (event.candidate) {
    if(host_id)
    {
      remote=host_id;
    }else{
      remote=client_id;
    }
    console.log("iceCallback\n"+event.candidate);
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
  document.getElementById("remoteVideo").src = URL.createObjectURL(event.stream);
 // enableDtmfSender();
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
  addICECandidate:function(cand){
    guest_local_pc.addIceCandidate(new RTCIceCandidate(JSON.parse(cand)));
  }
}


function setCandidate(candidate){
  guest_local_pc.addIceCandidate(new RTCIceCandidate(candidate));
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