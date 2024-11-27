const { v4: uuidv4 } = require('uuid');

class RoomManager {
    constructor() {
        this.rooms = new Map();
    }

    createRoom(roomName, passcode) {
        const roomId = uuidv4();
        const room = {
            id: roomId,
            name: roomName,
            passcode: passcode,
            users: new Set(),
            createdAt: new Date(),
            canvasState: null
        };
        
        this.rooms.set(roomId, room);
        return roomId;
    }

    // Add roomExists method
    roomExists(roomId) {
        return this.rooms.has(roomId);
    }

    joinRoom(roomId, passcode) {
        const room = this.rooms.get(roomId);
        
        if (!room) {
            throw new Error('Room not found');
        }
        
        if (room.passcode !== passcode) {
            throw new Error('Invalid passcode');
        }
        
        return room;
    }

    addUserToRoom(roomId, userId) {
        const room = this.rooms.get(roomId);
        if (room) {
            room.users.add(userId);
        }
    }

    removeUserFromRoom(roomId, userId) {
        const room = this.rooms.get(roomId);
        if (room) {
            room.users.delete(userId);
            
            // Clean up empty rooms
            if (room.users.size === 0) {
                this.rooms.delete(roomId);
            }
        }
    }

    getRoomUsers(roomId) {
        const room = this.rooms.get(roomId);
        return room ? Array.from(room.users) : [];
    }

    // New method to get room state
    getRoomState(roomId) {
        const room = this.rooms.get(roomId);
        return room ? {
            id: room.id,
            name: room.name,
            canvasState: room.canvasState,
            users: Array.from(room.users)
        } : null;
    }

    // Method to update room state
    updateRoomState(roomId, canvasData) {
        const room = this.rooms.get(roomId);
        if (room) {
            room.canvasState = canvasData;
        }
    }
}

module.exports = new RoomManager();