const socket = io();
let clientUserID = ""
let clientRoomID = ""

interface DropPayload {
  col: number;
  row: number;
  grid: number[][];
}

const screens: Map<string, HTMLElement> = new Map([
    ["landing", document.getElementById("landingScreen")!],
    ["lobby", document.getElementById("lobbyScreen")!],
    ["game", document.getElementById("gameScreen")!]
]);

function setScreen(screen : string): void {
    for(let [screenName, screenElement] of screens) {
        if(screenName == screen)
            screenElement.style.display = "block";
        else
            screenElement.style.display = "none";
    }
}

//this is ai generated
function renderGrid(grid: number[][], lastDrop?: { col: number; row: number }): void {
  const rows = grid[0].length;
  const cols = grid.length;

  let html = `
    <div class="column-buttons" style="display: grid; grid-template-columns: repeat(${cols}, 40px); gap: 4px; margin-bottom: 4px;align-self: center;align-items: center;align-content: center;width: 100%;margin: 0 25% 0 25%;">
  `;

  for (let col = 0; col < cols; col++) {
    html += `<button class="col-button" id="col${col}">⬇</button>`;
  }

  html += `</div><div class="grid" style="display: grid; grid-template-columns: repeat(${cols}, 40px); gap: 4px;align-self: center;align-items: center;align-content: center;width: 100%;margin: 0 25% 5% 25%;">`;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const val = grid[col][row];
      let pieceClass = "empty";
      if (val === 0) pieceClass = "player0";
      else if (val === 1) pieceClass = "player1";

      // Animate only the last dropped piece
      const animationClass = lastDrop && lastDrop.col === col && lastDrop.row === row ? "animated-drop" : "";

      html += `
        <div class="cell" data-col="${col}" data-row="${row}">
          <div class="piece ${pieceClass} ${animationClass}"></div>
        </div>
      `;
    }
  }

  html += `</div>`;
  document.getElementById("gameGrid")!.innerHTML = html;

  // Add click events
  for (let col = 0; col < cols; col++) {
    document.getElementById(`col${col}`)!.addEventListener("click", () => {
      socket.emit("dropPiece", clientUserID, col);
    });
  }
}

socket.on("connect", () => {
    document.getElementById("createRoom")!.addEventListener("click", 
        (e: Event) => {
            socket.emit("createRoom", clientUserID, (document.getElementById("userName") as HTMLTextAreaElement)?.value)
        })
    document.getElementById("joinRoom")!.addEventListener("click", 
        (e: Event) => {
            socket.emit("joinRoom", clientUserID, (document.getElementById("userName") as HTMLTextAreaElement)?.value, (document.getElementById("roomCode") as HTMLTextAreaElement)?.value)
        })
    document.getElementById("startGame")!.addEventListener("click", 
        (e: Event) => {
            socket.emit("startGameServer", clientUserID)
        })
    
})

socket.on("pieceDropped", (payload: { col: number; row: number; grid: number[][] }) => {
    var col = payload.col
    var row = payload.row
    renderGrid(payload.grid, { col, row }); // Send the last placed cell
});

socket.on("roomJoined", (roomID:string)=>{
    clientRoomID = roomID
    document.getElementById("roomCode")!.textContent = roomID
    setScreen("lobby")
    document.getElementById("lobbyRoomCode")!.textContent += roomID;
})

socket.on("startGameClient", ()=>{
    setScreen("game")
})

socket.on("playerList", (users:[])=>{
    var userList = document.getElementById("userList")
    while(userList?.firstChild){ //clear existing user list
        userList.removeChild(userList?.firstChild)
    }
    users.forEach(user => { //add to user list
        document.getElementById("userList")?.insertAdjacentHTML("beforeend", `<div class = "playerEntry">${user}</div>`)
    });
})

socket.on("boardUpdate", (grid:number[][])=>{
    renderGrid(grid)
    try{
        document.getElementById("winScreen")!.classList.remove("show");
    }catch{}
})

socket.on("initializeUser", (userID:string)=>{
    clientUserID = userID
})

socket.on("playerWins", (winner:string) => {
    document.getElementById("winScreen")!.style.display = "block"
    document.getElementById("winnerName")!.innerHTML = `${winner} wins!`
    document.getElementById("winScreen")!.classList.add("show");
    document.getElementById("restart")!.addEventListener("click", () => {
      socket.emit("restart", clientUserID);
    });
})

socket.on("turnUpdate", (userID:string, userName:string) => {
    var text = userID==clientUserID ? "Select a Column" : `Waiting for ${userName}...`
    document.getElementById("gameStatus")!.innerHTML = text
})