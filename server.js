const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

app.use(express.static(__dirname + "/public"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

var userList = [];

io.on("connection", (socket) => {
  const username = socket.handshake.auth.username;
  userList.push({ username: username, socketID: socket.id });
  io.emit("user_connected", username);
  //console.log(userList);

  socket.emit(
    "online_users",
    userList.map((v) => v.username)
  );

  socket.on("chat_message", (msg, from) => {
    //console.log("broadcasting message to other users");
    socket.broadcast.emit("chat_message", msg, from);
  });

  socket.on("priv_message", (msg, to) => {
    //console.log("Sending private message");

    var toID = userList.find((val) => {
      return val.username == to;
    });

    io.to(toID.socketID).emit("priv_message", msg, username);
  });

  socket.on("disconnect", () => {
    io.emit("user_disconnected", username);
    userList = userList.filter((v) => v.username != username);
    //console.log(userList);
  });

  socket.on("status_add", (status) => {
    //console.log(`adding ${username} status`);
    socket.broadcast.emit("status_user_add", status, username);
  });

  socket.on("status_rem", (status) => {
    //console.log(`removing ${username} status`);
    socket.broadcast.emit("status_user_rem", status, username);
  });
});

server.listen(3000, () => {
  console.log("listening on *:3000");
});
