
//    TODONE
// Add hold
// Fix spawn location
// Make ghost be a position and not a color - allowing shading on spawn etc
// Implement ghost
// Potentially gain score from loops around central point
// Fix piece rotation with line pieces
// Check piece.isViable
// Use score checking loop for rotation positions


//      TODONT
// Potentially gain score from lines around outside
//   if use this then move half the board in direction


//    TODO
// Add direction indicator
// Add score
// Art for each color of piece
// Art for board and background
// Sound effects


// #region - Setup

let game0;


function setup() { // Setup variables and canvas
  createCanvas(600, 600);
  noStroke();
  fill(255);

  game0 = { // Game

    // #region - Variables

    maxPiece: 7, // Config variables
    pieceListAmount: 4,


    running: false, // Internal variables
    score: 0,
    inputs: [false, false, false, false],
    pieceList: [[], [], [], []],
    spawnsValid: [true, true, true, true],
    holdPieceType: null,
    canHold: true,
    score: 0,


    board: { // Board

      // #region - Variables

      pos: createVector(100, 100), // Constants variables
      size: createVector(21, 21),
      scale: createVector(400, 400),

      game0: null, // Internal variables
      game: null,
      output: null,

      // #endregion


      // #region - Functions

      init: function(game0) { // Initialize the board
        this.game0 = game0;
      },


      reset: function() { // Setup board
        this.game = [];
        this.output = [];
        for (let x = 0; x < this.size.x; x++) {
          this.game.push([]);
          this.output.push([]);
          for (let y = 0; y < this.size.y; y++) {
            this.game[x].push(0);
            this.output[x].push(0);
          }
        }
        this.game[int(this.size.x/2)][int(this.size.y/2)]=1;
        this.output[int(this.size.x/2)][int(this.size.y/2)]=1;
      },


      updateOutput: function() {
        for (let x = 0; x < this.size.x; x++) { // Update screenShow with screenGame
          for (let y = 0; y < this.size.y; y++) {
            this.output[x][y] = this.game[x][y];
          }
        }

        for (let dir = 0; dir < 4; dir++) { // Update screenShow with spawn areas
          let offset = vectorFromDirection(dir);
          let spawnPos = createVector(
            int((this.game0.board.size.x/2-2) * (1 + offset.x)),
            int((this.game0.board.size.y/2-2) * (1 + offset.y))
          );
          for (let x = 0; x < 4; x++) {
            for (let y = 0; y < 4; y++) {
              let nx = spawnPos.x + x;
              let ny = spawnPos.y + y;
              if (this.output[nx][ny] == 0) {
                if (this.game0.spawnsValid[dir])
                  this.output[nx][ny] = 2;
                else this.output[nx][ny] = 3;
              }
            }
          }
        }

        if (this.game0.running) {
          for (let x = 0; x < 4; x++) { // Update screenShow with piece
            for (let y = 0; y < 4; y++) {
              let px = this.game0.piece.pos.x + x;
              let py = this.game0.piece.pos.y + y;
              let val = pieces[this.game0.piece.type][this.game0.piece.rotation][x][y];
              if (val != 0) this.output[px][py] = val+colorsNonPieceLimit;
            }
          }
        }
      },


      showOutput: function() {
        let xDif = this.scale.x/this.size.x; // Show each cells in output
        let yDif = this.scale.y/this.size.y;
        for (let x = 0; x < this.size.x; x++) {
          for (let y = 0; y < this.size.y; y++) {
            let px = this.pos.x + x*xDif;
            let py = this.pos.y + y*yDif;

            if (this.output[x][y] > colorsNonPieceLimit) {
              stroke(255);
              strokeWeight(2);
            } else {
              stroke(120);
              strokeWeight(1);
            }

            let col = colors[this.output[x][y]];
            fill(col[0], col[1], col[2]);
            rect(px, py, xDif, yDif);
          }
        }

        if (this.game0.piece.ghostPos != null) { // Show ghost
          for (let x = 0; x < 4; x++) {
            for (let y = 0; y < 4; y++) {
              let bx = this.game0.piece.ghostPos.x + x;
              let by = this.game0.piece.ghostPos.y + y;
              let px = this.pos.x + bx * xDif;
              let py = this.pos.y + by * xDif;

              let val0 = pieces[this.game0.piece.type][this.game0.piece.rotation][x][y];
              if (val0 != 0) {

                let val1 = this.output[bx][by];
                if(val1 == 0) {
                  noStroke();
                  fill(100, 100, 100, 100);
                  rect(px, py, xDif, yDif);
                }
              }
            }
          }
        }
      },


      inBounds: function(x, y) { // Check whether a point is on the screen
        let viable =
          x >= 0
          &&x < this.size.x
          &&y >= 0
          &&y < this.size.y;
        return viable;
      }

      // #endregion

    },


    piece: { // Piece

      // #region - Variables

      moveLimit: 20, // Constant variables
      sprintLimit: 4,
      inputLimit: 10,

      game0: null, // Internal variables
      type: null,
      direction: null,
      Rotation: null,
      pos: null,
      ghostPos: null,

      toMove: false, // Action variables
      toSprint: false,
      toPlace: false,

      moveTimer: null, // Timing variables
      sprintTimer: null,
      inputTimer: null,

      // #endregion


      // #region - Functions

      init: function(game0) { // Initialize piece variable
        this.game0 = game0;
      },


      updateMovement: function() {
        if (this.toMove) {

          if (this.game0.inputs[(this.direction + 1) % 4] // Movement based on input
          ||  this.game0.inputs[(this.direction + 3) % 4]) {
            this.inputTimer++;
            if (this.inputTimer >= this.inputLimit) {
              if (this.game0.inputs[(this.direction + 1) % 4]) {
                let offset = vectorFromDirection((this.direction + 1) % 4);
                this.move(offset.x, offset.y);
              }
              if (this.game0.inputs[(this.direction + 3) % 4]) {
                let offset = vectorFromDirection((this.direction + 3) % 4);
                this.move(offset.x, offset.y);
              }
              this.inputTimer = 0;
            }
          }

          this.moveTimer++; // Movement based on direction
          this.toSprint = this.game0.inputs[this.direction];
          if ((this.toSprint && (this.moveTimer >= this.sprintLimit))
          ||(!this.toSprint && (this.moveTimer >= this.moveLimit))) {
            let offset = vectorFromDirection(this.direction);
            if (this.move(offset.x, offset.y)) this.toPlace = false;

            else if (this.toPlace) this.place(); // Try to place if cannot move
            else this.toPlace = true;
            this.moveTimer = 0;
          }

          let offset = vectorFromDirection(this.direction); // Update ghostPos
          this.ghostPos = this.pos.copy().sub(offset);
          let found = false;
          while (this.isViable(this.type,
          this.ghostPos.x+offset.x,
          this.ghostPos.y+offset.y,
          this.rotation)) {
            this.ghostPos.add(offset);
            found = true;
          }
          if (!found) this.ghostPos = null;
        }
      },


      generateNew: function(givenDirection=null, count=0, givenPiece=null) { // Generate new piece
        if (count >= 4) {
          console.log("Could not generate piece");
          this.game0.running = false;

        } else {
          let newDirection = givenDirection!=null ? givenDirection : ((this.direction ? this.direction : 0) + 5) % 4;
          let newRotation = 0;
          let newType = givenPiece!=null ? givenPiece : this.game0.pieceList[newDirection][0];

          let placed = false;
          if (this.game0.spawnsValid[(newDirection+2)%4]) {
            let distance = 0;
            let offset = vectorFromDirection(newDirection);
            let newPos = createVector(
              int((this.game0.board.size.x/2-2) * (1 - offset.x)),
              int((this.game0.board.size.y/2-2) * (1 - offset.y))
            );
            placed = this.isViable(newType, newPos.x, newPos.y, newRotation);

            if (placed) {
              this.game0.pieceList[newDirection].shift();
              this.game0.pieceList[newDirection].push(floor(random(this.game0.maxPiece)));
              this.direction = newDirection;
              this.rotation = newRotation;
              this.type = newType;
              placed = true;
              this.pos = newPos;
            }
          }

          if (!placed)
            this.generateNew((newDirection+1)%4, count+1); // Try to place at next direction
        }
      },


      isViable: function(checkPiece, nx, ny, checkRotation) { // Check whether a piece at a position and rotation is viable
        for (let x = 0; x < 4; x++) {
          for (let y = 0; y < 4; y++) {
            let px = nx + x;
            let py = ny + y;
            let val = pieces[checkPiece][checkRotation][x][y];
            if (val!=0) {
              if (!this.game0.board.inBounds(px, py)) return false;
              if (this.game0.board.game[px][py]!=0) return false;
            }
          }
        }
        return true;
      },


      place: function() { // Place the current piece at the current place
        for (let x = 0; x < 4; x++) {
          for (let y = 0; y < 4; y++) {
            let px = this.pos.x + x;
            let py = this.pos.y + y;
            let val = pieces[this.type][this.rotation][x][y];
            if (val!=0) this.game0.board.game[px][py] = val+colorsNonPieceLimit;
          }
        }
        this.game0.canHold = true;
        this.game0.updateScore();
        this.game0.updateSpawns();
        this.generateNew();
      },


      move: function(dx, dy) { // Move the current piece
        if (this.isViable(this.type, this.pos.x+dx, this.pos.y+dy, this.rotation)) {
          this.pos.x += dx;
          this.pos.y += dy;
          this.toPlace = false;
          return true;
        } return false;
      },


      rotate: function(difference) { // Rotate the current piece
        let newPos = null;
        let newRotation = (this.rotation+difference+4)%4;

        if (this.isViable(this.type, this.pos.x, this.pos.y, newRotation))
          newPos = createVector(this.pos.x, this.pos.y);

        for (let dist = 1; dist < 3 && newPos == null; dist++) {
          let x = this.pos.x-dist;
          let y = this.pos.y-dist;

          for (let dir = 0; dir < 4 && newPos == null; dir++) {
            let offset = vectorFromDirection(dir);

            for (let i = 0; i < dist*2 && newPos == null; i++) {
              x += offset.x;
              y += offset.y;
              if (this.isViable(this.type, x, y, newRotation))
                newPos = createVector(x, y);
            }
          }
        }

        if (newPos != null) { // If found a successful position then place
          this.pos = newPos;
          this.rotation = newRotation;
          this.toPlace = false;
          return true;
        }
        return false;
      }

      // #endregion

    },

    // #endregion


    // #region - Functions

    init: function() { // Initialize board, piece and game0
      this.board.init(this);
      this.piece.init(this);
      this.board.reset();
    },


    start: function() { // Setup game variables
      this.running = true;
      this.score = 0;
      this.inputs = [false, false, false, false];
      this.pieceList = [[],[],[],[]];
      this.spawnsValid = [true, true, true, true];
      for (let i = 0; i < 4; i++)
        for (let o = 0; o < this.pieceListAmount; o++)
          this.pieceList[i].push(floor(random(this.maxPiece)));

      this.board.reset();
      this.piece.generateNew(1);

      this.piece.toMove = true;
      this.piece.toSprint = false;
      this.piece.toPlace = false;
      this.piece.moveTimer = 0;
      this.piece.inputTimer = 0;
    },


    update: function() {
      if (this.running) {
        this.piece.updateMovement();
        this.board.updateOutput();
      }
    },


    show: function() {
      this.board.showOutput(); // Show board

      textAlign(CENTER); // Show score
      textSize(20);
      noStroke();
      fill(255);
      text("Score: " + this.score, this.board.pos.x+this.board.scale.x+10, this.board.pos.y-42);

      let pieceSpacing = 50; // Show hold and pieceList for each direction based on boardPos
      let pieceSize = 40;
      let pieceShowScale = 0.75;

      let pcx = this.board.pos.x - pieceSpacing; // Draw hold piece - Use piece spacing
      let pcy = this.board.pos.y - pieceSpacing;
      let p0x = pcx - pieceSpacing/2;
      let p0y = pcy - pieceSpacing/2;
      strokeWeight(1);
      stroke(255);
      noFill();
      rect(p0x, p0y, pieceSpacing, pieceSpacing);
      if (this.holdPieceType != null) {
        let dif = (pieceShowScale*pieceSpacing/4);
        let pWidth = pieces[this.holdPieceType][4].length;
        let pHeight = pieces[this.holdPieceType][4][0].length;
        let p1x = pcx - dif * pWidth/2;
        let p1y = pcy - dif * pHeight/2;
        for (let x = 0; x < pWidth; x++) {
          for (let y = 0; y < pHeight; y++) {
            let val = pieces[this.holdPieceType][4][x][y];
            if (val != 0) {
              let col = colors[val+colorsNonPieceLimit];
              fill(col[0], col[1], col[2]);
              rect(p1x + x*dif, p1y + y*dif, dif, dif);
            }
          }
        }
      }

      for (let i = 0; i < 4; i++) { // Draw pieces in lists - Use piece size
        let offset = vectorFromDirection((i+2)%4);
        let cx = this.board.pos.x + this.board.scale.x/2
                + offset.x * (this.board.scale.x/2 + pieceSpacing);
        let cy = this.board.pos.y + this.board.scale.y/2
                + offset.y * (this.board.scale.y/2 + pieceSpacing);

        let direction = vectorFromDirection((i+3)%4); // For each piece in pieceList
        for (let o = 0; o < this.pieceListAmount; o++) {
          let pcx = cx + (o - (this.pieceListAmount-1)/2) * pieceSpacing * direction.x;
          let pcy = cy + (o - (this.pieceListAmount-1)/2) * pieceSpacing * direction.y;

          let p0x = pcx - pieceSize/2.0; // Show square
          let p0y = pcy - pieceSize/2.0;
          if (o==0) strokeWeight(3);
          else strokeWeight(1);
          stroke(255);
          noFill();
          rect(p0x, p0y, pieceSize, pieceSize);

          if (this.running) { // Show piece
            noStroke();
            let dif = (pieceShowScale*pieceSize/4);
            let pWidth = pieces[this.pieceList[i][o]][4].length;
            let pHeight = pieces[this.pieceList[i][o]][4][0].length;
            let p1x = pcx - dif * pWidth/2;
            let p1y = pcy - dif * pHeight/2;
            for (let x = 0; x < pWidth; x++) {
              for (let y = 0; y < pHeight; y++) {
                let val = pieces[this.pieceList[i][o]][4][x][y];
                if (val != 0) {
                  let col = colors[val+colorsNonPieceLimit];
                  fill(col[0], col[1], col[2]);
                  rect(p1x + x*dif, p1y + y*dif, dif, dif);
                }
              }
            }
          }
        }
      }
    },


    updateScore: function() {
      for (let dist = 1; dist <= int(this.board.size.x/2); dist++) {
        let x = int(this.board.size.x/2)-dist;
        let y = int(this.board.size.y/2)-dist;

        let completed = true;
        for (let dir = 0; dir < 4; dir++) { // Check if current distance is completed
          let offset = vectorFromDirection(dir);
          for (let i = 0; i < dist*2; i++) {
            x += offset.x;
            y += offset.y;
            if (this.board.game[x][y]==0)
              completed = false;
          }
        }

        if (completed) {
          this.score += (dist*dist)*40;
          for (let dir = 0; dir < 4; dir++) { // If completed then remove
            let offset = vectorFromDirection(dir);
            let offsetAway = vectorFromDirection((dir+3)%4);
            for (let i = 0; i < dist*2; i++) {
              x += offset.x;
              y += offset.y;
              this.board.game[x][y] = 0;
            }
          }
        }
      }
    },


    updateSpawns: function() {
      for (let dir = 0; dir < 4; dir++) { // Update spawnsValid
        let offset = vectorFromDirection(dir);
        let spawnPos = createVector(
          int((this.board.size.x/2-2) * (1 + offset.x)),
          int((this.board.size.y/2-2) * (1 + offset.y))
        );
        for (let x = 0; x < 4; x++) {
          for (let y = 0; y < 4; y++) {
            let nx = spawnPos.x + x;
            let ny = spawnPos.y + y;
            if (this.board.game[nx][ny] != 0)
              this.spawnsValid[dir] = false;
          }
        }
      }
    },


    keyPressed: function() {
      if (keyCode == 81) // Start game
        this.start();

      if (keyCode == 90) // Rotation
        this.piece.rotate(1);

      else if (keyCode == 88)
        this.piece.rotate(-1);

      else if (keyCode == 67) { // Hold piece
        if (this.canHold) {
          let prevHoldPieceType = this.holdPieceType;
          this.holdPieceType = this.piece.type;
          this.piece.generateNew(this.piece.direction, 0, prevHoldPieceType);
          this.canHold = false;
        }

      } else if (keyCode == 32) { // Hard drop
        if (this.piece.ghostPos != null) {
          let dx = this.piece.ghostPos.x-this.piece.pos.x;
          let dy = this.piece.ghostPos.y-this.piece.pos.y;
          this.piece.move(dx, dy);
          this.piece.place();
        } else {
          console.log("no ghost");
        }

      } else if (keyCode >= 37 && keyCode <= 40) { // Movement
        let inputDirection = (keyCode-35)%4;
        this.inputs[inputDirection] = true;
        let offset = vectorFromDirection(inputDirection);
        if (inputDirection == (this.piece.direction+3)%4
        ||  inputDirection == (this.piece.direction+5)%4
        ) this.piece.move(offset.x, offset.y);
      }
    },


    keyReleased: function() {
        if (keyCode >= 37 && keyCode <= 40) { // Movement
          let inputDirection = (keyCode-35)%4;
          this.inputs[inputDirection] = false;
          this.piece.inputTimer = 0;
        }
    }

    // #endregion

  };

  game0.init();
}

// #endregion


// #region - Main

function draw() { // Called each frame
  background(0);
  game0.update();
  game0.show();
}


function keyPressed() { // Input
  game0.keyPressed();

  if (keyCode == 89) console.log("debug");
}


function keyReleased() { // Input
  game0.keyReleased();
}


function vectorFromDirection(direction) { // Get direction vector from int
  return createVector(
    int(cos(direction*PI/2)),
    int(sin(direction*PI/2))
  );
}

// #endregion
