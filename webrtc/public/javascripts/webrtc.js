var host_local_pc = null;
var localVideo = document.getElementById("localVideo");
var remoteVideo = document.getElementById("remoteVideo");
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
    var servers = null;
    var pc_constraints = {"optional": []};
    host_local_pc = new RTCPeerConnection(servers,pc_constraints);
    trace("Created local peer connection object host_local_pc");
    host_local_pc.onicecandidate = WebRTC.iceCallback; 
    host_local_pc.onaddstream = WebRTC.gotRemoteStream; 
    
    trace("Requesting local stream");
    // Call into getUserMedia via the polyfill (adapter.js).
    getUserMedia({audio:true, video:true},
      WebRTC.gotStream, function() {});
  },
  gotStream:function(stream)
  {
    trace("Received local stream");
    // Call the polyfill wrapper to attach the media stream to this element.
    localstream = stream;
    host_local_pc.addStream(localstream);
    trace("Adding Local Stream to peer connection");    
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