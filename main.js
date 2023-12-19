let boardSpyos = []

let spyoImages={}

function preload(){
  let list = [
    {'name':'Maton','path':"images/maton.png"}
  ]

  for (let img of list){
    spyoImages[img.name] = loadImage(img.path)
  }
}

window.gameWidth = 7
window.gameHeight = 6

function setup(){
  createCanvas(10+(window.gameWidth*110),10+(window.gameHeight*110),document.getElementById('canv'))
  window.winner = ''
}

function draw(){
  strokeWeight(1)
  background('lightgreen')

  for (let i = 0; i < window.gameWidth; i++){
    for (let j = 0; j < window.gameHeight; j++){
      let x = 10 + i*110
      let y = 10 + j*110

      fill('green')
      rect(x,y,100,100)    
    }
  }

  for (let spyo of boardSpyos){
    if (spyo.owner != window.player){
      tint('red')
    }else{
      tint('white')
    }

    let x = 10 + spyo.x*110

    let y
    
    if (window.player == 1){
      y = 10 + (window.gameHeight-1-spyo.y)*110
    }else{
      y = 10 + spyo.y*110
    }
    
    if (spyo.current){
      fill('yellow')
      rect(x,y,100,100)
    }
    image(spyoImages[spyo.name],x,y,100,100)
    fill('white')
    textSize(20)
    strokeWeight(6)
    stroke('black')
    text(`${spyo.health}/${spyo.maxHp}`,x+30,y+80)
  
    spyomoving(spyo)  
    spyoattacking(spyo)
  }

  if (window.winner != ''){
    fill(255,128)
    rect(0,0,width,height)
  
    strokeWeight(1)
    fill('black')
    text(`Player ${window.winner} won!`, width/2-50,height/2)
    text("refresh to play again", width/2-50,height/2 + 50)


  }

}

function updateSpyos(spyo){
  boardSpyos = spyo.filter((val)=>{return !val.dead})
}

function spyomoving(spyo){
  if (spyo.current && window.player == spyo.owner){
    if (window.inputstate == 'moving'){


      let occs = new Map()
      for (let s of boardSpyos){
        if (occs.has(s.x)){
          occs.get(s.x).push(s.y)
        }else{
          occs.set(s.x,[s.y])
        }
      }


      let positions = []

      //left
      for (let i=1;i<=window.movingsteps;i++){
        let pos = [spyo.x-i,spyo.y]
        let occ = false
        if (pos[0] >= 0 && pos[0] < window.gameWidth){
          if (occs.has(pos[0])){
            if (occs.get(pos[0]).includes(pos[1])){
              occ = true
              break
            }
          }
          if (!occ){
            positions.push(pos)
          }  
        }

      }

      //down
      for (let i=1;i<=window.movingsteps;i++){
        let pos = [spyo.x,spyo.y-i]
        let occ = false
        if (pos[1] >= 0 && pos[1] < window.gameHeight){
          if (occs.has(pos[0])){
            if (occs.get(pos[0]).includes(pos[1])){
              occ = true
              break
            }
          }
          if (!occ){
            positions.push(pos)
          }
        }
      }

      //up
      for (let i=1;i<=window.movingsteps;i++){
        let pos = [spyo.x,spyo.y+i]
        let occ = false
        if (pos[1] >= 0 && pos[1] < window.gameHeight){
          if (occs.has(pos[0])){
            if (occs.get(pos[0]).includes(pos[1])){
              occ = true
              break
            }
          }
          if (!occ){
            positions.push(pos)
          }
        }
      }

      //right
      for (let i=1;i<=window.movingsteps;i++){
        let pos = [spyo.x+i,spyo.y]
        let occ = false
        if (pos[0] >= 0 && pos[0] < window.gameWidth){
          if (occs.has(pos[0])){
            if (occs.get(pos[0]).includes(pos[1])){
              occ = true
              break
            }
          }
          if (!occ){
            positions.push(pos)
          }  
        }
      }
      


      for (let pos of positions){
        let cx = 10 + pos[0]*110
        let cy
        if (window.player == 1){
          cy = 10 + (window.gameHeight-1-pos[1])*110
        }else{
          cy = 10 + pos[1]*110
        }

        let mouseIn = mouseX >= cx && mouseX <= cx+100 && mouseY >= cy && mouseY <= cy+100

        fill(0,0)
        strokeWeight(6)
        if (mouseIn){
          strokeWeight(12)
        }

        ellipse(cx+50,cy+50,100,100)
      
        if (mouseIn && mouseIsPressed){
          window.movedTo(pos)
        }
      
      }


    }


  }
}

function spyoattacking(spyo){
  if (spyo.current && spyo.owner == window.player){
    if (window.inputstate == 'attacking'){
      let ts=0
      for (let s of boardSpyos){
        if (s.owner == spyo.owner){ continue }
        let inRange = false

        if (s.x == spyo.x-1 && s.y == spyo.y){
          inRange = true
        }
        if (s.x == spyo.x+1 && s.y == spyo.y){
          inRange = true
        }
        if (s.x == spyo.x && s.y == spyo.y-1){
          inRange = true
        }
        if (s.x == spyo.x && s.y == spyo.y+1){
          inRange = true
        }

        if (inRange){
          stroke('red')
          fill(0,0)
          let cx = 10 + s.x*110
          let cy
          if (window.player == 1){
            cy = 10 + (window.gameHeight-1-s.y)*110
          }else{
            cy = 10 + s.y*110
          }
          ts++

          let mouseIn = mouseX >= cx && mouseX <= cx+100 && mouseY >= cy && mouseY <= cy+100
          strokeWeight(6)
          if (mouseIn){
            strokeWeight(12)
          }

          ellipse(cx+50,cy+50,100,100)

          if (mouseIn && mouseIsPressed){
            window.attacking([s.x,s.y])
          }


        }

      }

      if (ts==0){
        if (window.atkstrength == 0.5){
          console.log('no targets')
          window.quickatkflubbed()
        }
      }
    }
  }
}