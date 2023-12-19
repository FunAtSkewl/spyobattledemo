import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";


const firebaseConfig = {
  apiKey: "AIzaSyBuwsXgGW2r0jlYtdH9tPZouNUVbFrcbh4",
  authDomain: "faceblock-63c35.firebaseapp.com",
  databaseURL: "https://faceblock-63c35-default-rtdb.firebaseio.com",
  projectId: "faceblock-63c35",
  storageBucket: "faceblock-63c35.appspot.com",
  messagingSenderId: "610449760671",
  appId: "1:610449760671:web:cb0b1a31a07a3d94859daa",
  measurementId: "G-FJNYVRDVLP"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app)

let Games={};
let highestId = 0;

let started = false

onValue(ref(db,'id'),(s)=>{
    highestId = s.val()
})

onValue(ref(db,'Games'),(s)=>{
    Games = s.val()
    if (!started){
        started = true
        start()
    }
})

let cgr;

function start(){
    console.log('Games',Games)
    let selfSpyo = [
        {'name':'Maton','speed':1,'attack':10,'defense':1,'health':20},
        {'name':'Maton','speed':2,'attack':10,'defense':1,'health':20},
        {'name':'Maton','speed':3,'attack':10,'defense':1,'health':20},
        {'name':'Maton','speed':4,'attack':10,'defense':1,'health':20},
        {'name':'Maton','speed':5,'attack':10,'defense':1,'health':20},
    ]

    let found = false
    if(Games){
        for (let i in Games){
            let game = Games[i]
            if (game.open){
                found = true
                window.player = 2
                for (let spyo in selfSpyo){
                    selfSpyo[spyo].owner = window.player
                }
                game.twoSpyos = selfSpyo
                game.open = false
                set(ref(db,'Games/'+i.toString()),game)
                document.getElementById('e').innerHTML = i

                cgr = ref(db,'Games/'+i.toString())
                onValue(cgr,gameUpdated)

            }
        }
    
    }else{
        Games = {}
    }

    if (!found){
        window.player = 1
        for (let spyo in selfSpyo){
            selfSpyo[spyo].owner = window.player
        }

        let game = {
            'open':true,
            oneSpyos:selfSpyo,
            twoSpyos:[],
            turn:0,
            moveOrder:[],
            gameSpyos:[],
            winner:''
        }
        let gid = highestId
        console.log(highestId)
        document.getElementById('e').innerHTML = highestId

        Games[gid] = (game)
        highestId++;

        set(ref(db,'Games'),Games)
        set(ref(db,'id'),highestId)

        cgr = ref(db,'Games/'+gid.toString())
        onValue(cgr,gameUpdated)

    }
}

let gameData
let gamecs

function gameUpdated(s){
    const data = s.val()
    gameData = data

    if (!data.gameSpyos){

        if (!data.twoSpyos){ return }

        if (window.player == 1){
            let gs = data.oneSpyos.concat(data.twoSpyos)
            gs.sort((a,b)=>{return a.speed-b.speed})
            data.gameSpyos = gs


            for (let i=0;i<5;i++){
                if (window.gameWidth == 5){
                    data.oneSpyos[i].x = i
                }else{
                    data.oneSpyos[i].x = i+1
                }
                data.oneSpyos[i].y = 0
                data.oneSpyos[i].maxHp = data.oneSpyos[i].health
            }

            for (let i=0;i<5;i++){
                if (window.gameWidth == 5){
                    data.twoSpyos[i].x = i
                }else{
                    data.twoSpyos[i].x = i+1
                }
                data.twoSpyos[i].y = window.gameHeight-1
                data.twoSpyos[i].maxHp = data.twoSpyos[i].health

            }

            set(cgr,data)
        }
        return
    }

    if (data.winner != ''){
        updateSpyos(data.gameSpyos)
        window.winner = data.winner
        window.inputstate = ''
        return
    }

    let gs = data.oneSpyos.concat(data.twoSpyos)
    gs.sort((a,b)=>{return a.speed-b.speed})
    data.gameSpyos = gs


    for (let spyo of gs){
        spyo.current = false
    }

    let currentSpyo = data.gameSpyos[data.turn%(data.gameSpyos.length)]

    toggleControls(currentSpyo.owner == window.player)
    gamecs = currentSpyo



    //update board
    currentSpyo.current = true
    updateSpyos(data.gameSpyos)


    let list = document.getElementById('orderlist')

    list.innerHTML = ''
    for (let spyo of data.gameSpyos){
        if (currentSpyo == spyo){
            list.innerHTML += `<li><strong>${spyo.name} (p${spyo.owner})</strong></li><strong>ATK:${spyo.attack} / DEF:${spyo.defense}</strong>`
        }else{
            let mod = ''
            let endmod = ''
            if (spyo.stunned){
                mod = '<i>'
                endmod = '</i>'
            }
            if (spyo.dead){
                mod = '<s>'
                endmod = '</s>'
            }
            list.innerHTML += `<li> ${mod} ${spyo.name} (p${spyo.owner}) ${endmod}</li>`
        }
    }
    list.innerHTML += '<br>'
    list.innerHTML += currentSpyo.owner == window.player ? "YOUR TURN" : "OPPONENT's TURN"

    if (currentSpyo.stunned || currentSpyo.dead){
        currentSpyo.stunned = false
        turnEnd()
    }

}

function toggleControls(show){
    if (show){
        document.getElementById('turnbtns').style.display = 'inline-block'

        document.getElementById('movesub').style.display = 'none'
        document.getElementById('atksub').style.display = 'none'


        document.getElementById('move').onclick = togglemove
        document.getElementById('atk').onclick = toggleatk
        document.getElementById('pass').onclick = pass


    }else{
        document.getElementById('turnbtns').style.display = 'none'
    }
}

function turnEnd(){
    gameData.turn ++
/*
    gameData.oneSpyos = gameData.oneSpyos.filter((val)=>{return !val.dead})
    gameData.twoSpyos = gameData.twoSpyos.filter((val)=>{return !val.dead})
    gameData.gameSpyos = gameData.gameSpyos.filter((val)=>{return !val.dead})
*/

    let livingOneSpyos = gameData.oneSpyos.filter((val)=>{return !val.dead})
    let livingTwoSpyos = gameData.twoSpyos.filter((val)=>{return !val.dead})

    if (livingOneSpyos.length == 0){
        gameData.winner = 'two'
    }
    if (livingTwoSpyos.length == 0){
        gameData.winner = 'one'
    }


    set(cgr,gameData)
}

function togglemove(){
    document.getElementById('movesub').style.display = document.getElementById('movesub').style.display == 'none' ? 'block' : 'none'

    document.getElementById('m2').onclick = function(){move(2)}
    document.getElementById('m1qatk').onclick = function(){move(1)}

}
function toggleatk(){
    document.getElementById('atksub').style.display = document.getElementById('atksub').style.display == 'none' ? 'block' : 'none'

    document.getElementById('heavy').onclick = function(){atk(2)}
    document.getElementById('normal').onclick = function(){atk(1)}

}
function pass(){
    window.inputstate = ''
    turnEnd()
}

function move(steps){
    window.inputstate = 'moving'
    window.movingsteps = steps
    if (steps == 1){
        window.quickatkqueue = true
    }else{
        window.quickatkqueue = false
    }
}

function cancel(){
    window.inputstate = ''
}

window.movedTo = function(pos){

    gamecs.x = pos[0]
    gamecs.y = pos[1]

    updateSpyos(gameData.gameSpyos)

    window.inputstate = '' 
    if (window.quickatkqueue){
        atk(0.5)
    }else{
        turnEnd()
    }
}

function atk(strength){
    window.inputstate = 'attacking'
    window.atkstrength = strength
    window.baseatk = gamecs.attack
}

window.attacking = function(pos){
    let target
    
    for (let s of gameData.gameSpyos){
        if (s.x == pos[0] && s.y == pos[1] && !s.dead){
            target = s
            break
        }
    }

    if (window.atkstrength == 2){
        gamecs.stunned = true
    }

    let dmg = (window.baseatk * window.atkstrength) - target.defense 
    if (dmg >= 0){
        target.health -= dmg
    }

    if (target.health <= 0){
        target.dead = true
    }
    window.inputstate = ''
    turnEnd()

}
window.quickatkflubbed = function(){
    window.inputstate = ''
    turnEnd()
}
