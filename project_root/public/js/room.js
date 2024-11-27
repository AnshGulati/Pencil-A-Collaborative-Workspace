document.addEventListener('DOMContentLoaded', () => {
    // Tab switching functionality
    const tabs = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));
            
            tab.classList.add('active');
            document.getElementById(tab.dataset.tab).classList.add('active');
        });
    });

    const API_URL = 'https://pencil-whiteboard.onrender.com';
    
    // Function to check if server is available
    async function checkServerHealth() {
        try {
            const response = await fetch(`${API_URL}/health`);
            if (!response.ok) {
                throw new Error('Server health check failed');
            }
            const data = await response.json();
            console.log('Server health check passed:', data);
            return true;
        } catch (error) {
            console.error('Server health check failed:', error);
            return false;
        }
    }

    document.getElementById('createRoomForm').addEventListener('submit', async (e) => {
        e.preventDefault();
    
        // Clear any existing error messages
        clearError('createRoomForm');
        
        // Check server health first
        const isServerHealthy = await checkServerHealth();
        if (!isServerHealthy) {
            showError('createRoomForm', 'Server is not available. Please try again later.');
            return;
        }
    
        const roomName = document.getElementById('roomName').value;
        const passcode = document.getElementById('createPasscode').value;
    
        try {
            console.log('Sending create room request:', { roomName, passcode });
            
            const response = await fetch(`${API_URL}/api/rooms/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ roomName, passcode }),
            });
    
            console.log('Server response:', response);
    
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to create room');
            }
    
            const data = await response.json();
            console.log('Room created successfully:', data);
            
            sessionStorage.setItem('roomId', data.roomId);
            sessionStorage.setItem('passcode', passcode);
            // Updated redirect URL
            window.location.href = `/?room=${data.roomId}`;
        } catch (error) {
            console.error('Create room error:', error);
            showError('createRoomForm', error.message || 'Failed to connect to server');
        }
    });

    document.getElementById('joinRoomForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Clear any existing error messages
        clearError('joinRoomForm');

        const roomId = document.getElementById('roomId').value;
        const passcode = document.getElementById('joinPasscode').value;

        try {
            const response = await fetch(`${API_URL}/api/rooms/join`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ roomId, passcode }),
            });

            const data = await response.json();
            
            if (response.ok) {
                sessionStorage.setItem('roomId', roomId);
                sessionStorage.setItem('passcode', passcode);
                window.location.href = `/?room=${data.roomId}`;
            } else {
                throw new Error(data.message || 'Failed to join room');
            }
        } catch (error) {
            console.error('Join room error:', error);
            showError('joinRoomForm', error.message || 'Failed to connect to server');
        }
    });

    function showError(formId, message) {
        const form = document.getElementById(formId);
        let errorDiv = form.querySelector('.error-message');
        
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            form.appendChild(errorDiv);
        }
        
        errorDiv.textContent = message;
        errorDiv.style.color = 'red';
        errorDiv.style.marginTop = '10px';
    }

    function clearError(formId) {
        const form = document.getElementById(formId);
        const errorDiv = form.querySelector('.error-message');
        if (errorDiv) {
            errorDiv.remove();
        }
    }
});