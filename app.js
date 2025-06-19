// Your web app's Firebase configuration
var firebaseConfig = {
    databaseURL: "https://chatterbox-9ef65-default-rtdb.firebaseio.com/"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
var db = firebase.database();

const chatBox = document.getElementById('chat-box');
const chatForm = document.getElementById('chat-form');
const usernameInput = document.getElementById('username');
const messageInput = document.getElementById('message');

// Listen for new messages
function addMessage(data) {
    const val = data.val();
    const msgDiv = document.createElement('div');
    msgDiv.textContent = val.username + ': ' + val.message;
    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}
db.ref('messages').on('child_added', addMessage);

// Send message
chatForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const username = usernameInput.value.trim();
    const message = messageInput.value.trim();
    if (username && message) {
        db.ref('messages').push({ username, message });
        messageInput.value = '';
    }
}); 