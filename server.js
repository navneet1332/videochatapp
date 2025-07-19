const express = require("express");
const http = require("http");
const app = express();
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

app.use(express.static("public"));

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Chat message
  socket.on("message", (msg) => {
    io.emit("message", msg);
  });

  // Video call signals
  socket.on("call", (data) => {
    socket.broadcast.emit("incoming-call", data);
  });

  socket.on("answer", (data) => {
    socket.broadcast.emit("call-answered", data);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
