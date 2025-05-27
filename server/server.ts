import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
import { customAlphabet } from "nanoid";
import { randomUUID } from "crypto";
import { Socket } from "socket.io";
import { Room } from "./room";
import { Board } from "./board"

const express = require("express");
const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer)
const nanoid = customAlphabet("BCDFGHJKLMNPQRSTVWXYZ", 4)

const PORT = 4000

app.use(express.static(path.join(__dirname, "../client")))

const socketIDs: Record<string, string> = {} //string(socketID) : string(userID)
const rooms: Record<string, Room> = {} //string(roomID) : Room
const users: Record<string, Socket> = {} //string(userID) : Socket
const userRooms: Record<string, string> = {} //string(userID) : string(RoomID)
const userNames: Record<string, string> = {} //string(userID) : string(userName)

function playerListPing(roomID: string) {
    if(typeof rooms[roomID] === 'undefined'){ //room doesn't exist
        return;
    }else{ //room exists
        var players: string[] = rooms[roomID].users.map(id => userNames[id]) //get usernames in room
        rooms[roomID].users.forEach(player => {
            if(typeof users[player] === 'undefined'){
                return;
            }else{
                users[player].emit("playerList", players)
            }
        });
    }
}

function boardUpdate(roomID: string){
    if(typeof rooms[roomID] === 'undefined'){ //room doesn't exist
        return;
    }else{ //room exists
        rooms[roomID].users.forEach(player => {
            if(typeof users[player] === 'undefined'){
                return;
            }else{
                users[player].emit("boardUpdate", rooms[roomID].board.grid)
            }
        });
    }
}

function pieceDropped(roomID:string, result: { col: number, row: number, grid: number[][] }){
    if(typeof rooms[roomID] === 'undefined'){ //room doesn't exist
        return;
    }else{ //room exists
        rooms[roomID].users.forEach(player => {
            if(typeof users[player] === 'undefined'){
                return;
            }else{
                users[player].emit("pieceDropped", result)
            }
        });
    }
}

function playerWin(roomID:string, winner:string){
    if(typeof rooms[roomID] === 'undefined'){ //room doesn't exist
        return;
    }else{ //room exists
        rooms[roomID].users.forEach(player => {
            if(typeof users[player] === 'undefined'){
                return;
            }else{
                users[player].emit("playerWins", winner)
            }
        });
    }
}

function playerTurn(roomID:string, userID:string, p:string){
    if(typeof rooms[roomID] === 'undefined'){ //room doesn't exist
        return;
    }else{ //room exists
        rooms[roomID].users.forEach(player => {
            if(typeof users[player] === 'undefined'){
                return;
            }else{
                users[player].emit("turnUpdate", userID, p)
            }
        });
    }
}

io.on("connection", (socket) => {
    var userID = randomUUID()
    users[userID] = socket;
    socketIDs[socket.id] = userID
    socket.emit("initializeUser", userID)

    //when frontend requests to create a new room
    socket.on("createRoom", (userID, userName) => {
        console.log(`${userID}(${userName}) requested to create a room`)
        var roomID = nanoid()
        console.log("room created with ID " + roomID)
        rooms[roomID] = new Room(roomID)
        rooms[roomID].addUser(userID)
        userRooms[userID] = roomID
        userNames[userID] = userName
        socket.emit("roomJoined", roomID)
        playerListPing(roomID)
    })

    //when frontend requests to join an existing room
    socket.on("joinRoom", (userID, userName, roomID) => {
        console.log(userID + " is joining room " + roomID)
        if(typeof rooms[roomID] === 'undefined'){ //room doesn't exist
            return;
        }else{ //room exists
            rooms[roomID].addUser(userID)
            userRooms[userID] = roomID
            userNames[userID] = userName
            socket.emit("roomJoined", roomID)
            playerListPing(roomID)
        }
    })

    //when frontend requests to start the game
    socket.on("startGameServer", (userID) => {
    if(typeof rooms[userRooms[userID]] === 'undefined') return;
    if(rooms[userRooms[userID]].users.length >= 2){
        rooms[userRooms[userID]].users.forEach(user => {
            users[user].emit("startGameClient")
            users[user].emit("boardUpdate", rooms[userRooms[userID]].board.grid)
        })
    }
    var p = rooms[userRooms[userID]].users[0]
    playerTurn(userRooms[userID], p, userNames[p])

    })

    //when frontend requests to drop a piece
    socket.on("dropPiece", (userID, column) => {
        if(typeof rooms[userRooms[userID]] === 'undefined') return;

        var dropResult = rooms[userRooms[userID]].dropPiece(column, userID)
        if(dropResult.placed){
            boardUpdate(userRooms[userID])
            pieceDropped(userRooms[userID], { col: dropResult.col, row: dropResult.row, grid: rooms[userRooms[userID]].board.grid })
            var next = rooms[userRooms[userID]].users[rooms[userRooms[userID]].board.turnIndex]
            playerTurn(userRooms[userID], next, userNames[next])
        }
        if(dropResult.win){
            rooms[userRooms[userID]].board.winState = true
            playerWin(userRooms[userID], userNames[userID])
        }
    })

    //when frontend wants to restart
    socket.on("restart", (userID) => {
        if(typeof rooms[userRooms[userID]] === 'undefined') return;

        rooms[userRooms[userID]].board = new Board(rooms[userRooms[userID]])
        boardUpdate(userRooms[userID])
    })

    socket.on("disconnect", (socket) => {
        
    })
})

httpServer.listen(PORT, () => {
    console.log("open")
})