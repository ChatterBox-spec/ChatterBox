// Your web app's Firebase configuration
var firebaseConfig = {
    apiKey: "AIzaSyB1Zez4AFO52z5LjkQyZ9BpD2xFtR1Slr4",
    authDomain: "chatterbox-9ef65.firebaseapp.com",
    databaseURL: "https://chatterbox-9ef65-default-rtdb.firebaseio.com/",
    projectId: "chatterbox-9ef65",
    storageBucket: "chatterbox-9ef65.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
var db = firebase.database();
var auth = firebase.auth();

const chatBox = document.getElementById('chat-box');
const chatForm = document.getElementById('chat-form');
const messageInput = document.getElementById('message');
const authBox = document.getElementById('auth-box');
const usernameBox = document.getElementById('username-box');
const chatUI = document.getElementById('chat-ui');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('login-btn');
const signupBtn = document.getElementById('signup-btn');
const authError = document.getElementById('auth-error');
const usernameInput = document.getElementById('username-input');
const setUsernameBtn = document.getElementById('set-username-btn');
const usernameError = document.getElementById('username-error');
const logoutBtn = document.getElementById('logout-btn');
const currentUsernameSpan = document.getElementById('current-username');
const userMenuToggle = document.getElementById('user-menu-toggle');
const userDropdown = document.getElementById('user-dropdown');
const editUsernameBtn = document.getElementById('edit-username-btn');
const changePasswordBtn = document.getElementById('change-password-btn');
const privateChatBtn = document.getElementById('private-chat-btn');
const privateChatModal = document.getElementById('private-chat-modal');
const userListModal = document.getElementById('user-list-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const chatsBtn = document.getElementById('chats-btn');
const chatsModal = document.getElementById('chats-modal');
const chatsListModal = document.getElementById('chats-list-modal');
const closeChatsModalBtn = document.getElementById('close-chats-modal-btn');
const plusChatBtn = document.getElementById('plus-chat-btn');

let currentUser = null;
let currentUsername = null;
let privateChatWith = null; // UID of the user in private chat, or null for public
let isBanned = false;

function show(section) {
    authBox.style.display = section === 'auth' ? '' : 'none';
    usernameBox.style.display = section === 'username' ? '' : 'none';
    chatUI.style.display = section === 'chat' ? '' : 'none';
    let bannedMsg = document.getElementById('banned-msg');
    if (section === 'banned') {
        if (!bannedMsg) {
            bannedMsg = document.createElement('div');
            bannedMsg.id = 'banned-msg';
            bannedMsg.style.cssText = 'color:#ff4d4f;font-size:1.2rem;text-align:center;margin:40px auto;max-width:400px;background:#fff0f0;padding:32px 18px;border-radius:16px;box-shadow:0 2px 8px rgba(255,77,79,0.08);';
            bannedMsg.innerHTML = '<b>Your account has been banned by an admin.<br>You cannot use the chat.</b>';
            chatContainer = document.querySelector('.chat-container');
            if (chatContainer) chatContainer.appendChild(bannedMsg);
        } else {
            bannedMsg.style.display = '';
        }
    } else if (bannedMsg) {
        bannedMsg.style.display = 'none';
    }
    if (section === 'chat' && currentUsernameSpan) {
        currentUsernameSpan.textContent = currentUsername || '';
    }
    if (userDropdown) userDropdown.style.display = 'none';
    if (userMenuToggle) userMenuToggle.classList.remove('active');
}

function checkBanAndShow(user) {
    db.ref('users/' + user.uid).once('value', function(snapshot) {
        const val = snapshot.val();
        isBanned = !!(val && val.banned);
        if (isBanned) {
            show('banned');
        } else {
            currentUsername = val && val.username ? val.username : '';
            if (currentUsernameSpan) currentUsernameSpan.textContent = currentUsername;
            show('chat');
            onLoginOrUsernameSet();
        }
    });
}

// Auth state observer
auth.onAuthStateChanged(function(user) {
    if (user) {
        currentUser = user;
        checkBanAndShow(user);
    } else {
        currentUser = null;
        currentUsername = null;
        isBanned = false;
        show('auth');
    }
});

// Sign up
signupBtn.onclick = function() {
    authError.textContent = '';
    auth.createUserWithEmailAndPassword(emailInput.value, passwordInput.value)
        .catch(function(error) {
            authError.textContent = error.message;
        });
};

// Sign in
loginBtn.onclick = function() {
    authError.textContent = '';
    auth.signInWithEmailAndPassword(emailInput.value, passwordInput.value)
        .catch(function(error) {
            authError.textContent = error.message;
        });
};

// Set username
setUsernameBtn.onclick = function() {
    usernameError.textContent = '';
    const uname = usernameInput.value.trim();
    if (!uname) {
        usernameError.textContent = 'Username required';
        return;
    }
    db.ref('users').orderByChild('username').equalTo(uname).once('value', function(snapshot) {
        if (snapshot.exists()) {
            usernameError.textContent = 'Username already taken';
        } else {
            db.ref('users/' + currentUser.uid + '/username').set(uname, function(error) {
                if (error) {
                    usernameError.textContent = 'Error saving username';
                } else {
                    currentUsername = uname;
                    if (currentUsernameSpan) currentUsernameSpan.textContent = currentUsername;
                    checkBanAndShow(currentUser);
                }
            });
        }
    });
};

// Logout
logoutBtn.onclick = function() {
    auth.signOut();
};

// User menu dropdown logic
if (userMenuToggle && userDropdown) {
    userMenuToggle.onclick = function(e) {
        e.stopPropagation();
        const isOpen = userDropdown.style.display === 'block';
        userDropdown.style.display = isOpen ? 'none' : 'block';
        userMenuToggle.classList.toggle('active', !isOpen);
    };
    document.addEventListener('click', function(e) {
        if (userDropdown.style.display === 'block') {
            userDropdown.style.display = 'none';
            userMenuToggle.classList.remove('active');
        }
    });
    userDropdown.onclick = function(e) { e.stopPropagation(); };
}

// Edit Username option
if (editUsernameBtn) {
    editUsernameBtn.onclick = function(e) {
        e.stopPropagation();
        userDropdown.style.display = 'none';
        userMenuToggle.classList.remove('active');
        show('username');
        usernameInput.value = currentUsername || '';
    };
}

// Change Password option
if (changePasswordBtn) {
    changePasswordBtn.onclick = function(e) {
        e.stopPropagation();
        userDropdown.style.display = 'none';
        userMenuToggle.classList.remove('active');
        const newPass = prompt('Enter your new password (at least 6 characters):');
        if (newPass && newPass.length >= 6 && currentUser) {
            currentUser.updatePassword(newPass).then(function() {
                alert('Password updated!');
            }).catch(function(error) {
                alert('Error: ' + error.message);
            });
        } else if (newPass) {
            alert('Password must be at least 6 characters.');
        }
    };
}

function getUserColorClass(uid) {
    // Deterministically assign a color class based on uid
    const colorClasses = ['msg-color1', 'msg-color2', 'msg-color3', 'msg-color4', 'msg-color5', 'msg-color6'];
    if (!uid) return 'msg-color1';
    let hash = 0;
    for (let i = 0; i < uid.length; i++) hash = uid.charCodeAt(i) + ((hash << 5) - hash);
    const idx = Math.abs(hash) % colorClasses.length;
    return colorClasses[idx];
}

function renderMessage(key, val) {
    const isOwn = currentUser && val.uid === currentUser.uid;
    const msgDiv = document.createElement('div');
    msgDiv.className = 'message ' + (isOwn ? 'own-message' : 'received-message') + (!isOwn ? ' ' + getUserColorClass(val.uid) : '');
    const textDiv = document.createElement('div');
    textDiv.className = 'message-text';
    // Only show username if the message is from someone else
    if (!isOwn && val.username) {
        const nameSpan = document.createElement('span');
        nameSpan.className = 'sender-name';
        nameSpan.textContent = val.username + ': ';
        textDiv.appendChild(nameSpan);
    }
    textDiv.appendChild(document.createTextNode(val.message));
    msgDiv.appendChild(textDiv);
    // Subtle delete button for own messages
    if (isOwn) {
        const delBtn = document.createElement('button');
        delBtn.className = 'delete-btn subtle';
        delBtn.title = 'Delete';
        delBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 8.5V14.5C6 15.3284 6.67157 16 7.5 16H12.5C13.3284 16 14 15.3284 14 14.5V8.5" stroke="#bfc7d1" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 5.5H16" stroke="#bfc7d1" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M8.5 10.5V13.5" stroke="#bfc7d1" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M11.5 10.5V13.5" stroke="#bfc7d1" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 5.5V4.5C9 3.94772 9.44772 3.5 10 3.5V3.5C10.5523 3.5 11 3.94772 11 4.5V5.5" stroke="#bfc7d1" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        delBtn.onclick = function() {
            db.ref('messages/' + key).remove();
        };
        msgDiv.appendChild(delBtn);
    }
    msgDiv.setAttribute('data-key', key);
    return msgDiv;
}

// Show notification for incoming messages not sent by the current user
function showMessageNotification(val) {
    if ("Notification" in window && Notification.permission === "granted") {
        // Only notify for messages not sent by the current user
        if (val && val.username && val.message && (!currentUser || val.uid !== currentUser.uid)) {
            let title = val.username;
            let body = val.message;
            new Notification(title, { body });
        }
    }
}

// Update addMessage to show notification
function addMessage(data) {
    const val = data.val();
    const key = data.key;
    const msgDiv = renderMessage(key, val);
    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
    addReturnToPublicBtn();
    showMessageNotification(val);
}

// Listen for message removal
function removeMessage(data) {
    const key = data.key;
    const msgDiv = chatBox.querySelector('[data-key="' + key + '"]');
    if (msgDiv) chatBox.removeChild(msgDiv);
}

db.ref('messages').on('child_added', addMessage);
db.ref('messages').on('child_removed', removeMessage);

// Send message
chatForm.addEventListener('submit', function(e) {
    e.preventDefault();
    if (isBanned) {
        alert('You are banned and cannot send messages.');
        return;
    }
    if (!privateChatWith) {
        alert('Select a user to start a private chat.');
        return;
    }
    const message = messageInput.value.trim();
    if (message && currentUser && currentUsername) {
        const msgData = { message, username: currentUsername, uid: currentUser.uid, timestamp: Date.now(), to: privateChatWith };
        db.ref('messages').push(msgData);
        messageInput.value = '';
    }
});

function showPrivateChatModal() {
    userListModal.innerHTML = '';
    db.ref('users').once('value', function(snapshot) {
        snapshot.forEach(function(child) {
            const uid = child.key;
            const username = child.val().username;
            if (uid !== currentUser.uid) {
                const li = document.createElement('li');
                li.textContent = username || '(no username)';
                const btn = document.createElement('button');
                btn.textContent = 'Chat';
                btn.className = 'start-chat-btn';
                btn.onclick = function() {
                    privateChatWith = uid;
                    privateChatModal.style.display = 'none';
                    renderAllMessages();
                };
                li.appendChild(btn);
                userListModal.appendChild(li);
            }
        });
    });
    privateChatModal.style.display = 'flex';
}

if (privateChatBtn) {
    privateChatBtn.onclick = function(e) {
        e.stopPropagation();
        userDropdown.style.display = 'none';
        userMenuToggle.classList.remove('active');
        showPrivateChatModal();
    };
}
if (closeModalBtn) {
    closeModalBtn.onclick = function() {
        privateChatModal.style.display = 'none';
    };
}

// Helper to check if a chat is deleted for the current user
function isChatDeleted(otherUid, cb) {
    db.ref('deletedChats/' + currentUser.uid + '/' + otherUid).once('value', function(snap) {
        cb(!!snap.val());
    });
}

// Helper to mark a chat as deleted for the current user
function deleteChatForCurrentUser(otherUid, cb) {
    db.ref('deletedChats/' + currentUser.uid + '/' + otherUid).set(true, cb);
}

function renderAllMessages() {
    chatBox.innerHTML = '';
    let ref = db.ref('messages');
    ref.off();
    if (privateChatWith) {
        chatForm.style.display = '';
        if (plusChatBtn) plusChatBtn.style.display = 'none';
        // Only show messages between currentUser and privateChatWith, and only if the current user is one of the two
        isChatDeleted(privateChatWith, function(isDeleted) {
            if (isDeleted) {
                chatForm.style.display = 'none';
                chatBox.innerHTML = '<div style="text-align:center;color:#888;margin-top:40px;">You deleted this chat. Start a new chat to restore it.</div>';
                return;
            }
            ref.orderByChild('timestamp').on('child_added', function(data) {
                const val = data.val();
                if (
                    (val.uid === currentUser.uid && val.to === privateChatWith) ||
                    (val.uid === privateChatWith && val.to === currentUser.uid)
                ) {
                    addMessage(data);
                }
            });
            ref.on('child_removed', removeMessage);
        });
    } else {
        chatForm.style.display = 'none';
        if (plusChatBtn) plusChatBtn.style.display = '';
        // Show all private chats as a list, excluding deleted ones
        db.ref('users').once('value', function(snapshot) {
            const userMap = {};
            snapshot.forEach(function(child) {
                userMap[child.key] = child.val().username;
            });
            db.ref('messages').once('value', function(msgSnap) {
                const chatUids = new Set();
                msgSnap.forEach(function(msg) {
                    const val = msg.val();
                    if (val.to && (val.uid === currentUser.uid || val.to === currentUser.uid)) {
                        const otherUid = val.uid === currentUser.uid ? val.to : val.uid;
                        if (otherUid !== currentUser.uid) chatUids.add(otherUid);
                    }
                });
                // Filter out deleted chats
                db.ref('deletedChats/' + currentUser.uid).once('value', function(deletedSnap) {
                    const deleted = deletedSnap.val() || {};
                    const filteredUids = Array.from(chatUids).filter(uid => !deleted[uid]);
                    if (filteredUids.length === 0) {
                        chatBox.innerHTML = '<div style="text-align:center;color:#888;margin-top:40px;">Select a user to start a private chat.</div>';
                    } else {
                        const ul = document.createElement('ul');
                        ul.className = 'user-list-modal';
                        filteredUids.forEach(function(uid) {
                            const li = document.createElement('li');
                            li.textContent = userMap[uid] || '(no username)';
                            li.style.cursor = 'pointer';
                            li.onclick = function(e) {
                                if (e.target.classList.contains('delete-chat-home-btn')) return;
                                privateChatWith = uid;
                                renderAllMessages();
                            };
                            // Subtle delete icon
                            const delBtn = document.createElement('button');
                            delBtn.className = 'delete-chat-home-btn';
                            delBtn.title = 'Delete chat';
                            delBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 8.5V14.5C6 15.3284 6.67157 16 7.5 16H12.5C13.3284 16 14 15.3284 14 14.5V8.5" stroke="#ff4d4f" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 5.5H16" stroke="#ff4d4f" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M8.5 10.5V13.5" stroke="#ff4d4f" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M11.5 10.5V13.5" stroke="#ff4d4f" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 5.5V4.5C9 3.94772 9.44772 3.5 10 3.5V3.5C10.5523 3.5 11 3.94772 11 4.5V5.5" stroke="#ff4d4f" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
                            delBtn.onclick = function(ev) {
                                ev.stopPropagation();
                                if (confirm('Delete this private chat? This will only remove it for you.')) {
                                    deleteChatForCurrentUser(uid, function() {
                                        // Only refresh the chat list, do not remove li directly
                                        if (privateChatWith === uid) {
                                            privateChatWith = null;
                                        }
                                        renderAllMessages();
                                    });
                                }
                            };
                            li.appendChild(delBtn);
                            ul.appendChild(li);
                        });
                        chatBox.innerHTML = '<div style="text-align:center;color:#888;margin-top:24px;margin-bottom:12px;font-size:1.1rem;">Your Chats</div>';
                        chatBox.appendChild(ul);
                    }
                });
            });
        });
    }
}

// Improve home button style
function addReturnToPublicBtn() {
    let btn = document.getElementById('return-public-btn');
    if (!btn && privateChatWith) {
        btn = document.createElement('button');
        btn.id = 'return-public-btn';
        btn.innerHTML = '<svg width="22" height="22" viewBox="0 0 20 20" fill="none" style="vertical-align:middle;margin-right:8px;"><circle cx="10" cy="10" r="9" stroke="#007bff" stroke-width="1.5" fill="#f8fafc"/><path d="M3 9.5L10 4L17 9.5" stroke="#007bff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 17V10.5H15V17" stroke="#007bff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg><span style="font-size:1.1rem;font-weight:600;color:#007bff;">Home</span>';
        btn.style.margin = '10px 0 10px 0';
        btn.style.display = 'flex';
        btn.style.alignItems = 'center';
        btn.style.gap = '6px';
        btn.style.background = 'linear-gradient(90deg, #e0c3fc 0%, #8ec5fc 100%)';
        btn.style.border = 'none';
        btn.style.borderRadius = '12px';
        btn.style.padding = '10px 22px';
        btn.style.boxShadow = '0 2px 8px rgba(142,197,252,0.10)';
        btn.style.cursor = 'pointer';
        btn.onmouseover = function() { btn.style.background = 'linear-gradient(90deg, #8ec5fc 0%, #e0c3fc 100%)'; };
        btn.onmouseout = function() { btn.style.background = 'linear-gradient(90deg, #e0c3fc 0%, #8ec5fc 100%)'; };
        btn.onclick = function() {
            privateChatWith = null;
            renderAllMessages();
            btn.remove();
        };
        chatUI.insertBefore(btn, chatBox);
    } else if (btn && !privateChatWith) {
        btn.remove();
    }
}

function showChatsModal() {
    chatsListModal.innerHTML = '';
    // Only show private chats for this user
    const userMap = {};
    db.ref('users').once('value', function(snapshot) {
        snapshot.forEach(function(child) {
            userMap[child.key] = child.val().username;
        });
        db.ref('messages').once('value', function(msgSnap) {
            const chatUids = new Set();
            msgSnap.forEach(function(msg) {
                const val = msg.val();
                if (val.to && (val.uid === currentUser.uid || val.to === currentUser.uid)) {
                    const otherUid = val.uid === currentUser.uid ? val.to : val.uid;
                    if (otherUid !== currentUser.uid) chatUids.add(otherUid);
                }
            });
            chatUids.forEach(function(uid) {
                const li = document.createElement('li');
                li.textContent = userMap[uid] || '(no username)';
                const btn = document.createElement('button');
                btn.textContent = 'Open';
                btn.className = 'start-chat-btn';
                btn.onclick = function() {
                    privateChatWith = uid;
                    chatsModal.style.display = 'none';
                    renderAllMessages();
                };
                li.appendChild(btn);
                // Delete chat button
                const delBtn = document.createElement('button');
                delBtn.textContent = 'Delete';
                delBtn.className = 'delete-chat-btn';
                delBtn.onclick = function() {
                    if (confirm('Delete this private chat? This will remove all messages between you and this user.')) {
                        db.ref('messages').once('value', function(msgSnap) {
                            msgSnap.forEach(function(msg) {
                                const val = msg.val();
                                if (
                                    (val.uid === currentUser.uid && val.to === uid) ||
                                    (val.uid === uid && val.to === currentUser.uid)
                                ) {
                                    db.ref('messages/' + msg.key).remove();
                                }
                            });
                        });
                        // If currently in this chat, return to empty
                        if (privateChatWith === uid) {
                            privateChatWith = null;
                            renderAllMessages();
                        }
                        // Remove from UI
                        li.remove();
                    }
                };
                li.appendChild(delBtn);
                chatsListModal.appendChild(li);
            });
        });
    });
    chatsModal.style.display = 'flex';
}

if (chatsBtn) {
    chatsBtn.onclick = function(e) {
        e.stopPropagation();
        userDropdown.style.display = 'none';
        userMenuToggle.classList.remove('active');
        showChatsModal();
    };
}
if (closeChatsModalBtn) {
    closeChatsModalBtn.onclick = function() {
        chatsModal.style.display = 'none';
    };
}

// Request notification permission on login
function requestNotificationPermission() {
    if ("Notification" in window && Notification.permission !== "granted") {
        Notification.requestPermission();
    }
}

// Call this after successful login or username set
function onLoginOrUsernameSet() {
    requestNotificationPermission();
    renderAllMessages();
}

if (plusChatBtn) {
    plusChatBtn.onclick = function(e) {
        e.preventDefault();
        showPrivateChatModal();
    };
}

// Secret admin shortcut: Ctrl+Alt+A
window.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        const pwd = prompt('Enter admin password:');
        if (pwd === '1301') {
            window.location.href = 'https://chatterbox-spec.github.io/admin/';
        } else if (pwd !== null) {
            alert('Incorrect password.');
        }
    }
});

// Long-press on Chatterbox label for admin access (mobile)
const chatterboxLabel = document.getElementById('chatterbox-label');
if (chatterboxLabel) {
    let pressTimer = null;
    chatterboxLabel.addEventListener('touchstart', function(e) {
        pressTimer = setTimeout(function() {
            const pwd = prompt('Enter admin password:');
            if (pwd === '1301') {
                window.location.href = 'https://chatterbox-spec.github.io/admin/';
            } else if (pwd !== null) {
                alert('Incorrect password.');
            }
        }, 600); // 600ms for long-press
    });
    chatterboxLabel.addEventListener('touchend', function(e) {
        clearTimeout(pressTimer);
    });
    chatterboxLabel.addEventListener('touchmove', function(e) {
        clearTimeout(pressTimer);
    });
} 