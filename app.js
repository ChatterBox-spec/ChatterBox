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

let currentUser = null;
let currentUsername = null;

function show(section) {
    authBox.style.display = section === 'auth' ? '' : 'none';
    usernameBox.style.display = section === 'username' ? '' : 'none';
    chatUI.style.display = section === 'chat' ? '' : 'none';
    if (section === 'chat' && currentUsernameSpan) {
        currentUsernameSpan.textContent = currentUsername || '';
    }
    if (userDropdown) userDropdown.style.display = 'none';
    if (userMenuToggle) userMenuToggle.classList.remove('active');
}

// Auth state observer
auth.onAuthStateChanged(function(user) {
    if (user) {
        currentUser = user;
        // Check if username exists
        db.ref('users/' + user.uid + '/username').once('value', function(snapshot) {
            if (snapshot.exists()) {
                currentUsername = snapshot.val();
                show('chat');
            } else {
                show('username');
            }
        });
    } else {
        currentUser = null;
        currentUsername = null;
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
    // Check if username is taken
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
                    show('chat');
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

// Render a message with delete button
function renderMessage(key, val) {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'message';
    const textDiv = document.createElement('div');
    textDiv.className = 'message-text';
    textDiv.textContent = (val.username ? val.username + ': ' : '') + val.message;
    msgDiv.appendChild(textDiv);
    if (currentUser && val.uid === currentUser.uid) {
        const delBtn = document.createElement('button');
        delBtn.className = 'delete-btn';
        delBtn.textContent = 'Delete';
        delBtn.onclick = function() {
            db.ref('messages/' + key).remove();
        };
        msgDiv.appendChild(delBtn);
    }
    msgDiv.setAttribute('data-key', key);
    return msgDiv;
}

// Listen for new messages
function addMessage(data) {
    const val = data.val();
    const key = data.key;
    const msgDiv = renderMessage(key, val);
    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
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
    const message = messageInput.value.trim();
    if (message && currentUser && currentUsername) {
        db.ref('messages').push({ message, username: currentUsername, uid: currentUser.uid });
        messageInput.value = '';
    }
}); 