var socket;
var form = document.getElementById("form");
var input = document.getElementById("input");
var inputButton = document.getElementById("inputButton");
var statusParagraph = document.getElementById("statusParagraph");
var onlineUsersParagraph = document.getElementById("onlineUsersParagraph");
var baseOnlineUsersParagraph = onlineUsersParagraph.textContent;
var statuses = [];
var clearStatusTimeout;
var TypingTimeout = 1000;
var username;
var onlineUsers = [];

form.addEventListener("submit", function (e) {
  e.preventDefault();

  if (!username) {
    username = input.value;
    input.value = "";
    inputButton.textContent = "Send";
    socket = io({
      auth: {
        username: username,
      },
    });

    socket.on("online_users", function (onlineUsersServer) {
      //console.log(
      //  "Updating online user list from server: " + onlineUsersServer
      //);
      onlineUsers = onlineUsersServer;
      updateOnlineUsersParagraph();
    });

    socket.on("user_connected", function (username) {
      var item = document.createElement("li");
      item.textContent = username + " connected";
      messages.appendChild(item);
      window.scrollTo(0, document.body.scrollHeight);

      onlineUsers.push(username);
      updateOnlineUsersParagraph();
    });

    socket.on("chat_message", function (msg, from) {
      var item = document.createElement("li");
      item.textContent = from + ": " + msg;
      messages.appendChild(item);
      window.scrollTo(0, document.body.scrollHeight);
    });

    socket.on("priv_message", function (msg, from) {
      //console.log("receiving private message");

      var item = document.createElement("li");
      item.textContent = `${from} -> ${username}: ${msg}`;
      messages.appendChild(item);
      window.scrollTo(0, document.body.scrollHeight);
    });

    socket.on("user_disconnected", function (username) {
      var item = document.createElement("li");
      item.textContent = username + " disconnected";
      messages.appendChild(item);
      window.scrollTo(0, document.body.scrollHeight);

      onlineUsers = onlineUsers.filter((user) => user != username);
      updateOnlineUsersParagraph();
    });

    //updating users status message
    socket.on("status_user_add", function (status, username) {
      if (
        statuses.some((value) => {
          return value.status == status && value.username == username;
        })
      ) {
        return;
      }
      statuses.push({ username: username, status: status });

      if (statuses.length == 0) {
        statusParagraph.textContent;
      }
      var statusString = statuses.reduce(function (previous, current) {
        return `${previous} ${current.username} is ${current.status}`;
      }, " ");

      statusParagraph.textContent = statusString;
    });

    socket.on("status_user_rem", function (status, username) {
      //console.log("removing user status");
      //console.log(statuses);
      statuses = statuses.filter(
        (value) => value.status != status || value.username != username
      );
      //console.log(statuses);
      if (statuses.length == 0) {
        statusParagraph.innerHTML = "&nbsp";
      } else {
        var statusString = statuses.reduce(function (previous, current) {
          return `${previous} ${current.username} is ${current.status}`;
        }, " ");

        statusParagraph.innerText = statusString;
      }
    });

    // send a message to the server saying that user is typing
    input.addEventListener("input", function (e) {
      clearTimeout(clearStatusTimeout);
      stillTyping = true;
      socket.emit("status_add", "typing", username);

      clearStatusTimeout = setTimeout(() => {
        //console.log("Sending end of typing message");
        socket.emit("status_rem", "typing", username);
      }, TypingTimeout);
    });
  }
  if (input.value) {
    if (input.value.startsWith("/w")) {
      var messageParts = input.value.split(" ");
      var to = messageParts[1];
      var message = messageParts.splice(2, messageParts.length).join(" ");

      socket.emit("priv_message", message, to);

      var item = document.createElement("li");
      item.textContent = `${username} -> ${to}: ${message}`;
      messages.appendChild(item);
      window.scrollTo(0, document.body.scrollHeight);
      input.value = "";
    } else {
      socket.emit("chat_message", input.value, username);
      var item = document.createElement("li");
      item.textContent = username + ": " + input.value;
      messages.appendChild(item);
      window.scrollTo(0, document.body.scrollHeight);
      input.value = "";
    }
  }
});

function updateOnlineUsersParagraph() {
  onlineUsersParagraph.textContent =
    baseOnlineUsersParagraph +
    " " +
    onlineUsers.reduce((prev, curr, index) => {
      if (index == 0) {
        return `${curr}`;
      } else {
        return `${prev}, ${curr}`;
      }
      //return `${prev}, ${curr}`;
    }, "");
}
