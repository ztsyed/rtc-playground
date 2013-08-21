var pc1 = null,pc2 = null;
var localstream = null;
var dtmfSender = null;
var sdpConstraints = {'mandatory': {
                      'OfferToReceiveAudio':true, 
                      'OfferToReceiveVideo':false }};

function init()
{
  var servers = null;
  var pc_constraints = {"optional": []};
  pc1 = new RTCPeerConnection(servers,pc_constraints);
  trace("Created local peer connection object pc1");
  pc1.onicecandidate = iceCallback1; 
  pc2 = new RTCPeerConnection(servers,pc_constraints);
  trace("Created remote peer connection object pc2");
  pc2.onicecandidate = iceCallback2;
  pc2.onaddstream = gotRemoteStream; 
  
  trace("Requesting local stream");
  // Call into getUserMedia via the polyfill (adapter.js).
  getUserMedia({audio:true, video:false},
                gotStream, function() {});
}

function iceCallback1(event){
  if (event.candidate) {
    pc2.addIceCandidate(new RTCIceCandidate(event.candidate));
    trace("Local ICE candidate: \n" + event.candidate.candidate);
  }
}

function iceCallback2(event){
  if (event.candidate) {
    pc1.addIceCandidate(new RTCIceCandidate(event.candidate));
    trace("Remote ICE candidate: \n " + event.candidate.candidate);
  }
}
function gotStream(stream){
  trace("Received local stream");
  // Call the polyfill wrapper to attach the media stream to this element.
  localstream = stream;
  audioTracks = localstream.getAudioTracks();
  if (audioTracks.length > 0)
    trace('Using Audio device: ' + audioTracks[0].label);
  pc1.addStream(localstream);
  trace("Adding Local Stream to peer connection");
  
  pc1.createOffer(gotDescription1);
}

function gotRemoteStream(e){
  // Call the polyfill wrapper to attach the media stream to this element.
  attachMediaStream(audio2, e.stream);
  trace("Received remote stream");
  enableDtmfSender();
}

function gotDescription1(desc){
  pc1.setLocalDescription(desc);
  trace("Offer from pc1 \n" + desc.sdp);
  pc2.setRemoteDescription(desc);
  // Since the "remote" side has no media stream we need
  // to pass in the right constraints in order for it to
  // accept the incoming offer of audio.
  pc2.createAnswer(gotDescription2, null, sdpConstraints);
}

function gotDescription2(desc){
  // Setting PCMU as the preferred codec.
  desc.sdp = desc.sdp.replace(/m=.*\r\n/, "m=audio 1 RTP/SAVPF 0 126\r\n");
  // Workaround for issue 1603.
  desc.sdp = desc.sdp.replace(/.*fmtp.*\r\n/g, "");
  pc2.setLocalDescription(desc);
  trace("Answer from pc2 \n" + desc.sdp);
  pc1.setRemoteDescription(desc);
}

function enableDtmfSender(){
  if (localstream != null) {
    var local_audio_track = localstream.getAudioTracks()[0];
    dtmfSender = pc1.createDTMFSender(local_audio_track);
    trace("Created DTMF Sender\n");
    dtmfSender.ontonechange = dtmfOnToneChange;
  }
  else {
    trace("No Local Stream to create DTMF Sender\n");
  }
}