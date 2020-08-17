const users = []

const addUser = ({ id, username, room}) => {
    // Clean the data
    username = username.trim().toLowerCase()
    room = room.trim().toLowerCase()

    // Validate the data
    if(!username || !room) {       // ako prazno
        return {
            error: 'Usernmae and room are required!'
        }
    }

    // Check for existing user
    const existingUser = users.find((user) => {  // return true if found match, tj ako postovji takav username u tom room-u
        return user.room === room && user.username === username
    })

    // Validate username
    if(existingUser) {            // ako postoji već taj username u tom room-u, javi da ne može
        return {
            error: 'Username is in use!'
        }
    }

    // Store user
    const user = { id, username, room}        // create user object
    users.push(user)                         // add to users aray
    return { user }
}
// addUser returns object with user or error !



const removeUser = (id) => {
    const index = users.findIndex((user) => {         // return position of aray item
        return user.id === id
    })  
    
    if (index != -1) {                      // -1 ako nije pronašao, pa ako !=-1 onda je pronasao tog usera
        return users.splice(index, 1)[0]    // sa splice mičemo tog usera iz users araya, sa [0] pristupamo tom removed useru
    }
}

const getUser = (id) => {
    return users.find((user) => user.id === id)
}

const getUsersInRoom = (room) => {
    room = room.trim().toLowerCase()
    return users.filter((user) => user.room === room)
    }




module.exports = {
    addUser,
    removeUser,
    getUser,
    getUsersInRoom
}
