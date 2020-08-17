const path = require ('path')
const http = require('http')
const express = require('express')     // potrebno da bi digli web stranicu na localhost://port
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateMessage, generateLocationMessage } = require('./utils/messages')
const { addUser, removeUser, getUser,getUsersInRoom} = require ('./utils/users')


const app = express()                   // Create the Express application
const server = http.createServer(app)    // Create the HTTP server using the Express appn sa http serverom
const io = socketio(server)              // Connect socket.io to the HTTP server

const port = process.env.PORT || 3000
const publicDirPath = path.join(__dirname, '../public')   // put do public foldera C:\Users\Dino\Desktop\rokaj-snimaj\chat-app\public

app.use(express.static(path.join(publicDirPath)))         // povlači index.html iz public folder


// pokreće se 1 za svaku novu konekciju
io.on('connection', (socket) => {            //socket-> objekt, sadrži info o toj novoj connekciji, koristimo methode da komuniciramo sa točno tim client-om
    console.log('New WebSocket connection')

    socket.on('join', (options, callback) => {
        const {error, user } = addUser({ id: socket.id, ...options })   // u user objectu su username i room trim() i lowercase pa kasnije koristimo user.room ...

        if(error) {
            return callback(error)
        }
        
        socket.join(user.room)                       // join the room, moguce samo na server side

        socket.emit('message', generateMessage('Admin', 'Welcome!'))                                   // Welcome the user to the room                     
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined!`))   // to every user in the room except this new connected client
        
        io.to(user.room).emit('roomData', {                          // send list of users in room to all clients(users)
            room: user.room,
            users: getUsersInRoom(user.room)
            })
        
        callback()
    })


    socket.on('sendMessage', (message, callback) => {       // callback to acknowledge event
       const filter = new Filter()                          // initialize bad words

       const user = getUser(socket.id)

       if(filter.isProfane(message)) {                          // ima li "proste riječi"
           return callback('Profanity is not allowed!')         // ako ima, šalje ack sa porukom (error), to vidi samo taj client koji je napisao tu rijec
       }
       
       io.to(user.room).emit('message', generateMessage(user.username, message))             // to every single connected client in room
       callback()                                                               // šalje ack
    })

    socket.on('sendLocation', (position, callback) => {
        const user = getUser(socket.id)
        io.to(user.room).emit('LocationMessage', generateLocationMessage(user.username, 'https://www.google.com/maps?q=${position.latitude},${position.longitude}'))    // link to google map with coordinates
        callback()
    })

    socket.on('disconnect', () => {                    // kad user ode sa stranice ::: mora biti unutar te connekcije
        const user = removeUser(socket.id)

        if (user) {
            io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left`))         // posalji svima koji su jos spojeni
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
                })
        }
    })

})

server.listen(port, () => {
    console.log("Server is up on port " + port)
})       