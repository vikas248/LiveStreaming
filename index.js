import http from "http"
import express from "express"
import path from "path"
import {spawn} from 'child_process'
import {Server as SocketIO} from "socket.io"

const app = express()
const server = http.createServer(app);
const io = new SocketIO(server)

const options = [
    '-i',
    '-',
    '-c:v', 'libx264',
    '-preset', 'ultrafast',
    '-tune', 'zerolatency',
    '-r', `${25}`,
    '-g', `${25 * 2}`,
    '-keyint_min', 25,
    '-crf', '25',
    '-pix_fmt', 'yuv420p',
    '-sc_threshold', '0',
    '-profile:v', 'main',
    '-level', '3.1',
    '-c:a', 'aac',
    '-b:a', '128k',
    '-ar', 128000 / 4,
    '-f', 'flv',
    `rtmp://a.rtmp.youtube.com/live2/apzy-styt-wy3j-hu9x-a3cg`,
];

const ffmpegProcess = spawn('ffmpeg', options);

//basically check krre ki ffmpeg shi se kaam to krri h na
ffmpegProcess.stdout.on('data', (data) => {
    console.log(`ffmpeg stdout: ${data}`)
})

//to check jb koi data hoga ffmpeg ke uppar to koi error to ni aari
ffmpegProcess.stderr.on('data', (data) => {
    console.error(`ffmpeg stderr: ${data}`)
})

//jb process close to hm bata re ki close ho gai h
ffmpegProcess.on('close', (code) => {
    console.log(`ffmpeg process is ended: ${code}`)
})

app.use(express.static(path.resolve('./public')))

//jo binary stream frontend se aari h usko leke ffmpeg pe throw krre h
io.on('connection', socket => {
    console.log('Socket Connected Successfully', socket.id);
    socket.on('binarystream', stream => {
        console.log('Binary Stream Incoming')
        ffmpegProcess.stdin.write(stream, (err) =>{
            console.log('Err', err)
        })
    })

    // socket.on("chat-message", (message) => {
    //   console.log("Received chat message:", message);
    //   // Broadcast the message to all connected clients
    //   io.emit("chat-message", message);
    // });
})

server.listen(5000, () => console.log(`Server running on port 5000`))

// har user ko uske container ke saath spin krna h,
// jb stream pe click krega to uska container is responsible for making it live,
// jb vo live streaming band kr dega to we will destroy that container(cpu intensive h islie ye krna h ni to nodejs process bht jaldi kill ho jaegi)
