/*
 * Chat.js - Premium client-side chat controller for STC
 */

let currentUserId;
let currentUserName;
let stompClient = null;
let selectedUserId = null;
let isReconnecting = false;

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', function () {
    // Get the variables set in HTML
    currentUserId = document.getElementById('currentUserId').value;
    currentUserName = document.getElementById('currentUserName').value;

    if (!currentUserId) {
        window.location.href = '/login';
        return;
    }

    // Hide loading indicator since friends are pre-loaded
    $('#loadingFriends').hide();

    // Connect to WebSocket
    connectWebSocket();

    // Handle message form submission
    $("#messageForm").on("submit", function (event) {
        event.preventDefault();
        sendMessage();
    });

    // Client-side Friend Search Filter
    $("#friendSearchInput").on("input", function () {
        const query = $(this).val().toLowerCase().trim();
        $(".friend-item").each(function () {
            const name = $(this).find(".friend-name").text().toLowerCase();
            const email = $(this).attr("data-email") ? $(this).attr("data-email").toLowerCase() : "";
            if (name.includes(query) || email.includes(query)) {
                $(this).show();
            } else {
                $(this).hide();
            }
        });
    });

    // Auto-select friend if query parameter is present (e.g. ?userId=abc)
    const urlParams = new URLSearchParams(window.location.search);
    const targetUserId = urlParams.get('userId');
    if (targetUserId) {
        // Wait a brief moment for lists to render
        setTimeout(function() {
            selectFriend(targetUserId);
        }, 300);
    }
});

function connectWebSocket() {
    const socket = new SockJS('/ws');
    stompClient = Stomp.over(socket);

    // Suppress console debug spam for better logs
    stompClient.debug = null;

    stompClient.connect({ 'userId': currentUserId }, function (frame) {
        console.log('Connected to WebSocket server');
        isReconnecting = false;

        // Update connection status UI
        $('#connectionStatus').removeClass('disconnected').addClass('connected');
        $('#connectionText').text('Connected');

        // Subscribe to personal private queue (uses user principal email on backend)
        stompClient.subscribe('/user/queue/messages', function (message) {
            const messageData = JSON.parse(message.body);
            processIncomingMessage(messageData);
        });

        // Check for any unread messages initially
        checkUnreadMessages();

    }, function (error) {
        console.warn('WebSocket connection error:', error);
        $('#connectionStatus').removeClass('connected').addClass('disconnected');
        $('#connectionText').text('Disconnected - Reconnecting...');
        
        if (!isReconnecting) {
            isReconnecting = true;
            setTimeout(connectWebSocket, 5000); // Retry every 5s
        }
    });
}

function selectFriend(userId) {
    selectedUserId = userId;

    // Highlight active friend in list
    $('.friend-item').removeClass('active');
    const activeItem = $(`.friend-item[data-user-id="${userId}"]`);
    activeItem.addClass('active');

    // Show Chat Panel, Hide Empty State
    $('#noChatSelected').addClass('hidden').hide();
    $('#chatBox').removeClass('hidden').show();

    // Fetch friend details
    $.ajax({
        url: `/user/${userId}`,
        method: 'GET',
        success: function (user) {
            $('#recipientImg').attr('src', user.profilePic || '/images/userimg.png');
            $('#recipientName').text(user.name);
            
            // Set location/about status
            let statusText = '';
            if (user.city || user.state || user.country) {
                statusText = [user.city, user.state, user.country].filter(Boolean).join(', ');
            } else {
                statusText = user.about || 'Online';
            }
            $('#recipientStatus').text(statusText);
            $('#recipientId').val(userId);

            // Load conversation history
            loadConversation(userId);
        },
        error: function (error) {
            console.error('Error loading companion details:', error);
        }
    });

    // Reset unread badge on UI
    $(`#unread-${userId}`).addClass('hidden').text('0');
}

function loadConversation(userId) {
    $('#messageArea').html(`
        <div class="flex justify-center items-center h-full">
            <div class="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    `);

    $.ajax({
        url: `/api/messages/conversation/${userId}`,
        method: 'GET',
        success: function (messages) {
            renderConversation(messages);
            markMessagesAsRead(messages);
        },
        error: function (error) {
            console.error('Error loading conversation:', error);
            $('#messageArea').html('<div class="text-center text-violet-300 py-10">Failed to load conversation</div>');
        }
    });
}

function renderConversation(messages) {
    if (messages.length === 0) {
        $('#messageArea').html(`
            <div class="flex flex-col items-center justify-center h-full opacity-60">
                <i class="far fa-comments text-5xl mb-3 text-violet-400"></i>
                <p class="text-violet-200">No messages yet. Send a friendly hello!</p>
            </div>
        `);
        return;
    }

    let html = '';
    let lastDateStr = '';

    messages.forEach(msg => {
        const isSent = msg.senderId === currentUserId;
        const msgDate = new Date(msg.timestamp);
        
        // Show date divider if new day
        const dateStr = msgDate.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
        if (dateStr !== lastDateStr) {
            html += `<div class="date-divider">${dateStr}</div>`;
            lastDateStr = dateStr;
        }

        const timeStr = msgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        // Fixed bubble row structure
        html += `
        <div class="message-row ${isSent ? 'sent' : 'received'}">
            <div class="message-bubble">
                <span class="message-content">${escapeHtml(msg.content)}</span>
                <span class="message-time">${timeStr}</span>
            </div>
        </div>`;
    });

    $('#messageArea').html(html);
    setTimeout(scrollToBottom, 50);
}

function sendMessage() {
    const textInput = $('#message');
    const messageContent = textInput.val().trim();
    if (!messageContent || !selectedUserId) return;

    const chatMessage = {
        senderId: currentUserId,
        recipientId: selectedUserId,
        content: messageContent,
        timestamp: new Date()
    };

    // Clear composer input immediately
    textInput.val('');

    // Append temporary outgoing bubble in chat window
    const tempId = 'temp-' + Date.now();
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const tempHtml = `
    <div id="${tempId}" class="message-row sent">
        <div class="message-bubble">
            <span class="message-content">${escapeHtml(messageContent)}</span>
            <span class="message-time">${timeStr} <i class="fas fa-clock text-[9px] opacity-60 ml-1"></i></span>
        </div>
    </div>`;

    $('#messageArea').append(tempHtml);
    scrollToBottom();

    // Send payload over WebSocket destination
    if (stompClient && stompClient.connected) {
        stompClient.send("/app/chat.privateMessage", {}, JSON.stringify(chatMessage));
    } else {
        console.warn("WebSocket not connected. Unable to send message immediately.");
        // Fallback info notification
        $(`#${tempId} .message-time`).html(`${timeStr} <i class="fas fa-exclamation-circle text-red-500 ml-1"></i>`);
    }
}

function processIncomingMessage(message) {
    console.log('Incoming real-time message received:', message);

    // 1. Message sent by CURRENT user has been confirmed by backend
    if (message.senderId === currentUserId && message.recipientId === selectedUserId) {
        // Find any unsent indicators or replace them
        const lastSentRow = $('.message-row.sent').last();
        const timeStr = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        lastSentRow.find('.message-time').html(`${timeStr} <i class="fas fa-check text-[9px] text-green-400 ml-1"></i>`);
        scrollToBottom();
    }
    // 2. Message sent from selected friend to CURRENT user
    else if (message.senderId === selectedUserId && message.recipientId === currentUserId) {
        const timeStr = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const html = `
        <div class="message-row received">
            <div class="message-bubble">
                <span class="message-content">${escapeHtml(message.content)}</span>
                <span class="message-time">${timeStr}</span>
            </div>
        </div>`;

        $('#messageArea').append(html);
        scrollToBottom();

        // Inform server that message is read
        markMessageAsRead(message.id);
    }
    // 3. Message from someone else entirely
    else if (message.recipientId === currentUserId) {
        // Increment unread count badge on user item in sidebar
        const badge = $(`#unread-${message.senderId}`);
        let count = parseInt(badge.text()) || 0;
        count++;
        badge.text(count).removeClass('hidden');

        // Play subtle sound or trigger tab highlight (optional UI polish)
    }
}

function checkUnreadMessages() {
    $.ajax({
        url: '/api/messages/unread',
        method: 'GET',
        success: function (messages) {
            const unreadCounts = {};
            messages.forEach(msg => {
                unreadCounts[msg.senderId] = (unreadCounts[msg.senderId] || 0) + 1;
            });

            Object.keys(unreadCounts).forEach(senderId => {
                const badge = $(`#unread-${senderId}`);
                if (unreadCounts[senderId] > 0) {
                    badge.text(unreadCounts[senderId]).removeClass('hidden');
                } else {
                    badge.addClass('hidden');
                }
            });
        },
        error: function (error) {
            console.error('Error fetching unread messages count:', error);
        }
    });
}

function markMessagesAsRead(messages) {
    const unread = messages.filter(msg => msg.senderId === selectedUserId && !msg.read);
    unread.forEach(msg => markMessageAsRead(msg.id));
}

function markMessageAsRead(messageId) {
    $.ajax({
        url: `/api/messages/${messageId}/read`,
        method: 'PUT',
        error: function (error) {
            console.error('Error setting message read state:', error);
        }
    });
}

function scrollToBottom() {
    const msgArea = document.getElementById('messageArea');
    if (msgArea) {
        msgArea.scrollTop = msgArea.scrollHeight;
    }
}

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}