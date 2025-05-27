import { Board } from "./board"
export class Room{
    roomID: string
    users: string[]
    userNumbers: Record<string, number> = {}
    board: Board

    constructor(newRoomID:string){
        this.roomID = newRoomID
        this.users = []
        this.board = new Board(this)
    }

    addUser(user:string): void{
        this.users.push(user)
        this.userNumbers[user] = this.users.length-1
    }

    dropPiece(col : number, id : number): {win : boolean; placed : boolean; col : number; row : number}{
        let player = this.userNumbers[id]
        if(this.board.turnIndex != player){
            return {win: false, placed: false, col: -1, row: -1}
        }
        var result = this.board.dropPiece(col, player)
        if(result.placed){
            console.log(this.board.turnIndex)
            this.board.turnIndex++;
            this.board.turnIndex %= 2;
        }
        return result
    }
}