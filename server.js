const express = require('express');
const path = require('path');
const http = require('http');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const {
    userJoin,
    getCurrentUser,
    userLeave,
    getRoomUsers
    } = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

//set static app
app.use(express.static(path.join(__dirname,'public')));

const botName = 'chatCord Bot';

// Run when client connects
io.on('connection', socket => {
    socket.on('joinRoom', ({username, room}) => {
        const user = userJoin(socket.id, username, room);

        socket.join(user.room);

        //welcome current user
        socket.emit('message', formatMessage(botName, 'welcome to chat BOT'));  //this will emit to user who is connecting

        //Broadcast when a user connects
        socket.broadcast
            .to(user.room)
            .emit('message', formatMessage(botName, `${user.username} has joined the chat`)
        );    //broadcast to all the users except the one who logs in with message that falana hai joined the chat


        //send users ans room info
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        });


    });

    // io.emit()   ---------    to broadcast to all user at once, the onces already loggedin and the one logging in

    //Listen for chatMessage
    socket.on('chatMessage', msg => {
        const user = getCurrentUser(socket.id);

        io.to(user.room).emit('message', formatMessage(user.username, msg));
    });

    //Runs when client disconnect
    socket.on('disconnect', () => {
        const user = userLeave(socket.id)
        if(user){
            io.to(user.room).emit('message', formatMessage(botName, `${user.username} has left the chat`));
            //remove user from current list of active user
            io.to(user.room).emit('roomUsers', {
                room: user.room,
                users: getRoomUsers(user.room)
            });
        } 
    });
 
});




const PORT = 3000 || process.env.PORT;

server.listen(PORT, () => {
    console.log(`server running on port ${PORT}`);
});