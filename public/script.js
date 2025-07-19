const socket = io();
const local = document.getElementById("local");
const remote = document.getElementById("remote");
let pc;

const chat = document.getElementById("chat");
const msgInput = document.getElementById("msg");

function sendMessage() {
  const msg = msgInput.value;
  socket.emit("message", msg);
  msgInput.value = "";
}

socket.on("message", (msg) => {
  const li = document.createElement("li");
  li.textContent = msg;
  chat.appendChild(li);
});

async function startCall() {
  pc = new RTCPeerConnection();

  const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  stream.getTracks().forEach((track) => pc.addTrack(track, stream));
  local.srcObject = stream;

  pc.ontrack = (event) => {
    remote.srcObject = event.streams[0];
  };

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  socket.emit("call", offer);

  socket.on("incoming-call", async (offer) => {
    pc = new RTCPeerConnection();

    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));
    local.srcObject = stream;

    pc.ontrack = (event) => {
      remote.srcObject = event.streams[0];
    };

    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    socket.emit("answer", answer);
  });

  socket.on("call-answered", async (answer) => {
    await pc.setRemoteDescription(new RTCSessionDescription(answer));
  });
}
