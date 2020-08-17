const socket = io()     //store io return value in varialble :: io function to connect

// Elementi index.HTML u const za lasku manipulaciju 
const $messageForm = document.querySelector('#message-form')        //index.html <form id=""messag..""> 
const $messageFormInput = $messageForm.querySelector('input')       // input je unutar form
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')                   // location to render


// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML   //access to HTML to render the template corectly
const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

// Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true})     // vraća objekt sa paramtrima query stringa, ignore... -> remove ?

const autoscroll = () => {
    // New message $element
    const $newMessage = $messages.lastElementChild             // grab new message (last -> at the buttom)
   
    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)                  // get marginButtom spacing value from browser
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)        // convert string 16px to integer 16
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin    // add marginButtom spacing to offset -> total message height
    
    // console.log(newMessageStyles)

    // Visible height
    const visibleHeight = $messages.offsetHeight    // amount of space for messages
    
    // Height of messages container
    const containerHeight = $messages.scrollHeight   // total height of scrool space
    
    // How far have I scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight    // scrollTop -> distance we scrolled from the Top -> dynamic
    if (containerHeight - newMessageHeight <= scrollOffset) {   // at the buttom before new message? jer inace ne zelimo da auto scrolla
    $messages.scrollTop = $messages.scrollHeight                // if true, scroll all down (after new message)
    }
}


socket.on('message', (message) => {
    console.log(message)                           // console na web pregledniku
    const html = Mustache.render(messageTemplate, {     // compile the template with data to render
        username: message.username,
        message: message.text,                           // passing message data to template
        createdAt: moment(message.createdAt).format('k:mm')
    })       
    $messages.insertAdjacentHTML('beforeend', html)   // insert messages in div id="messages", beforeend - before messages div ends (at the bottom of div96+)
    autoscroll()
})

socket.on('LocationMessage', (message) => {
    console.log(message)
    const html = Mustache.render(locationTemplate, {
        username: message.username,
        locationUrl: message.url,
        createdAt: moment(message.createdAt).format('k:mm')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html      // select HTML element gdje ćemo render html
})

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()                                            // spriječimo da browser radi fullpage refresh
    
    $messageFormButton.setAttribute('disabled', 'disabled')      // DOM manipulation::: disable send button dok ne dobiješ ack da je recieved

    const message = e.target.elements.message.value              // e.target ->access to the form 
   
    socket.emit('sendMessage', message, (error) => {             // () -> run when event was acknowledged
        $messageFormButton.removeAttribute('disabled')          // enable send button (ack callback -> poruka primljena, može se opet slati)
        $messageFormInput.value = ''                            // clear the input after message is sent
        $messageFormInput.focus()                               // vrati focus na input form

        if(error) {                                          // ako je nešto poslano sa ack -> callback('bla bla')
           return console.log(error)
       }
       
       console.log('The message was delivered!')   //  ako je samo ack, tj nema ništa u error ->  callback()
    })
})

$sendLocationButton.addEventListener('click', () => {     // aktivira se kad se stisne button sa id:send-location
    if (!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser.')
    }

    $sendLocationButton.setAttribute('disabled', 'disabled')        // disable button before fetching

    navigator.geolocation.getCurrentPosition((position)=> {       // position je objekt                                     
        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, () => {                                              // ack function, kada dodje ack, printaj Location shared i enable button
            $sendLocationButton.removeAttribute('disabled')
            console.log('Location shared!')
        })
    })
})


socket.emit('join', { username, room}, (error) => {
    if(error) {
        alert(error)
        location.href='/'   // ako nije uspio login, vrati usera na home page
    }
})