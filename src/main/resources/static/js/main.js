//this is main.js 
var chatPage = document.querySelector("#message-container");
var messageForm = document.querySelector("#messageForm");
var messageInput = document.querySelector("#message");
var messageArea = document.querySelector("#messageArea");
var connectingElement = document.querySelector(".connecting");
var onlineCountElement = document.querySelector(".online-count");
var loadMoreContainer = document.querySelector("#load-more-container");
var loadMoreBtn = document.querySelector("#loadMoreBtn");

var stompClient = null;
var activeUsers = new Set();
var currentUsername = "";

var currentPage = 0;
var pageSize = 50;
var hasMoreMessages = true;

// Get the logged-in username directly from the template
var username = document.querySelector("#user-email").textContent.trim();

if (username) {
    currentUsername = username;
    connectToChat(username);
    loadMessageHistory(0);
} else {
    console.error("Username not found!");
}

function connectToChat(username) {
    var socket = new SockJS("/ws");
    stompClient = Stomp.over(socket);

    // Disable debug logging from Stomp
    stompClient.debug = null;

    stompClient.connect({}, function (frame) {
        // Hide connecting message
        connectingElement.classList.add("hidden");

        // Subscribe to public channel
        stompClient.subscribe("/topic/public", function (message) {
            handleMessage(JSON.parse(message.body));
        });

        // Subscribe to user count updates
        stompClient.subscribe("/topic/users", function (message) {
            updateUserCount(JSON.parse(message.body));
        });

        // Send join notification
        stompClient.send(
            "/app/chat.addUser",
            {},
            JSON.stringify({ sender: username, type: "JOIN" })
        );
    }, function (error) {
        connectingElement.textContent = "Could not connect to WebSocket server. Please refresh this page to try again!";
        connectingElement.classList.remove("hidden");
        connectingElement.style.backgroundColor = "rgba(239, 68, 68, 0.2)";
        connectingElement.style.color = "#FCA5A5";
    });

    messageForm.addEventListener("submit", function (event) {
        event.preventDefault();
        sendMessage();
    });

    // Also allow sending with Enter key
    messageInput.addEventListener("keypress", function (event) {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            sendMessage();
        }
    });

    if (loadMoreBtn) {
        loadMoreBtn.addEventListener("click", function () {
            if (hasMoreMessages) {
                currentPage++;
                loadMessageHistory(currentPage);
            }
        });
    }
}

function loadMessageHistory(page) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", `/api/messages/community?page=${page}&size=${pageSize}`, true);
    xhr.onload = function () {
        if (xhr.status === 200) {
            var messages = JSON.parse(xhr.responseText);

            if (messages.length < pageSize) {
                hasMoreMessages = false;
                loadMoreContainer.classList.add("hidden");
            } else {
                hasMoreMessages = true;
                loadMoreContainer.classList.remove("hidden");
            }

            if (page === 0) {
                messageArea.innerHTML = "";
                messages.forEach(function (msg) {
                    showChatMessage(msg, false, false);
                });
                chatPage.scrollTop = chatPage.scrollHeight;
            } else {
                var oldScrollHeight = chatPage.scrollHeight;
                for (var i = messages.length - 1; i >= 0; i--) {
                    showChatMessage(messages[i], true, false);
                }
                setTimeout(function () {
                    chatPage.scrollTop = chatPage.scrollHeight - oldScrollHeight;
                }, 50);
            }
        } else {
            console.error("Failed to load message history");
        }
    };
    xhr.send();
}

function sendMessage() {
    var messageContent = messageInput.value.trim();
    if (messageContent && stompClient) {
        var chatMessage = {
            sender: currentUsername,
            content: messageContent,
            type: "CHAT"
        };
        stompClient.send("/app/chat.sendMessage", {}, JSON.stringify(chatMessage));
        messageInput.value = "";
    }
    messageInput.focus();
}

function handleMessage(message) {
    if (message.type === "JOIN") {
        showEventMessage(`${formatUsername(message.sender)} joined the chat`);
        activeUsers.add(message.sender);
    } else if (message.type === "LEAVE") {
        showEventMessage(`${formatUsername(message.sender)} left the chat`);
        activeUsers.delete(message.sender);
    } else {
        showChatMessage(message, false, true);
    }

    // Scroll to the bottom
    chatPage.scrollTop = chatPage.scrollHeight;
}

function showEventMessage(text) {
    var messageElement = document.createElement("li");
    messageElement.className = "flex justify-center mb-4 new-message";

    messageElement.innerHTML = `
        <div class="px-4 py-2 rounded-full bg-violet-900/20 text-violet-300 text-sm">
            <i class="fas fa-info-circle mr-2"></i>
            ${text}
        </div>
    `;

    messageArea.appendChild(messageElement);
}

function showChatMessage(message, prepend, isNew) {
    if (prepend === undefined) prepend = false;
    if (isNew === undefined) isNew = true;

    var isOwnMessage = message.sender === currentUsername;
    var messageElement = document.createElement("li");

    messageElement.className = "flex " + (isOwnMessage ? "justify-end" : "justify-start") + " mb-4" + (isNew ? " new-message" : "");

    var msgTime = message.timestamp ? new Date(message.timestamp) : new Date();
    var formattedTime = msgTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    var displayName = message.senderName ? message.senderName : formatUsername(message.sender);

    if (isOwnMessage) {
        messageElement.innerHTML = `
            <div class="max-w-xs md:max-w-md">
                <div class="message-bubble outgoing px-4 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-violet-700 text-white shadow-md">
                    ${formatMessage(message.content)}
                </div>
                <div class="text-right mt-1 text-xs text-gray-400">${formattedTime}</div>
            </div>
        `;
    } else {
        messageElement.innerHTML = `
            <div class="max-w-xs md:max-w-md">
                <div class="flex items-center mb-1">
                    <div class="w-6 h-6 rounded-full bg-indigo-800 flex items-center justify-center text-xs font-bold mr-2">
                        ${getInitials(message.sender)}
                    </div>
                    <span class="text-sm text-violet-300">${displayName}</span>
                </div>
                <div class="message-bubble incoming px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-700 to-indigo-800 text-white shadow-md">
                    ${formatMessage(message.content)}
                </div>
                <div class="text-left mt-1 text-xs text-gray-400">${formattedTime}</div>
            </div>
        `;
    }

    if (prepend) {
        messageArea.insertBefore(messageElement, messageArea.firstChild);
    } else {
        messageArea.appendChild(messageElement);
    }
}

function updateUserCount(userCount) {
    onlineCountElement.textContent = `${userCount} Online`;
}

function formatUsername(email) {
    // Display only the part before @
    return email.split('@')[0];
}

// Ensure the profile page or user name fetch is robust
function getInitials(email) {
    // Get first letter of username
    return email.charAt(0).toUpperCase();
}

function formatMessage(content) {
    // Convert URLs to clickable links
    let linkedContent = content.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" class="underline text-cyan-300 hover:text-cyan-200">$1</a>');

    // Convert emojis to actual emojis if needed

    return linkedContent;
}

document.querySelector("#backButton").addEventListener("click", function () {
    if (stompClient !== null) {
        stompClient.send(
            "/app/chat.removeUser",
            {},
            JSON.stringify({ sender: currentUsername, type: "LEAVE" })
        );

        stompClient.disconnect(() => {
            console.log("Disconnected from WebSocket");
        });
    }
    window.location.href = "/user/profile";
});

// Handle window close/reload
window.addEventListener("beforeunload", function () {
    if (stompClient !== null) {
        stompClient.send(
            "/app/chat.removeUser",
            {},
            JSON.stringify({ sender: currentUsername, type: "LEAVE" })
        );
    }
});