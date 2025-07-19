const socket = io();

const local = document.getElementById("local");
const remote = document.getElementById("remote");
const msgInput = document.getElementById("msg");
const chatBox = document.getElementById("chat-box");

let pc;
let localStream;

async function initMedia() {
  localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  local.srcObject = localStream;
}
initMedia();

function createPeerConnection() {
  const peer = new RTCPeerConnection();

  localStream.getTracks().forEach(track => peer.addTrack(track, localStream));

  peer.ontrack = (event) => {
    remote.srcObject = event.streams[0];
  };

  peer.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit("ice-candidate", event.candidate);
    }
  };

  return peer;
}

function startCall() {
  pc = createPeerConnection();

  pc.createOffer()
    .then(offer => {
      pc.setLocalDescription(offer);
      socket.emit("call", offer);
    });
}

// Incoming Call
socket.on("incoming-call", async (offer) => {
  pc = createPeerConnection();
  await pc.setRemoteDescription(new RTCSessionDescription(offer));

  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  socket.emit("answer", answer);
});

// Call Answered
socket.on("call-answered", async (answer) => {
  await pc.setRemoteDescription(new RTCSessionDescription(answer));
});

// ICE Candidates
socket.on("ice-candidate", async (candidate) => {
  if (candidate) {
    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (e) {
      console.error("Error adding ICE candidate", e);
    }
  }
});

// Chat
function sendMessage() {
  const msg = msgInput.value;
  if (msg.trim() === "") return;
  socket.emit("message", msg);
  msgInput.value = "";
}

socket.on("message", (msg) => {
  const p = document.createElement("p");
  p.textContent = msg;
  chatBox.appendChild(p);
  chatBox.scrollTop = chatBox.scrollHeight;
});
