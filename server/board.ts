import { Room } from "./room";
export class Board{
    grid: number[][]
    room: Room
    turnIndex: number
    winState: boolean

    constructor(room : Room){
        this.room = room
        this.turnIndex = 0
        this.grid = Array.from({ length: 7 }, () => Array.from({ length: 6 }, () => -1))
        this.winState = false
    }

    //return false if not able to place in that column, true otherwise.
    dropPiece(col : number, player : number): {win : boolean; placed : boolean; col : number; row : number}{
        if(this.winState)
            return {win: false, placed: false, col : -1, row : -1};
        let r = this.grid[col].length-1;
        while(r >= 0){
            if(this.grid[col][r] == -1){
                this.grid[col][r] = player
                if(this.checkForWin(col, r, player)){
                    return {win: true, placed: true, col : col, row : r}
                }else{
                    return {win: false, placed: true, col : col, row : r}
                }
            }
            r--
        }
        return {win: false, placed: false, col : -1, row : -1};
    }

    //return true if the checked piece leads to a win
    checkForWin(col : number, row : number, player : number): boolean{
        //4 directions to check
        //x:-1,y:1 and x:1,y:-1
        var diag1 = this.checkForWinRecurse(col, row, player, -1, 1, 1) + this.checkForWinRecurse(col, row, player, 1, -1, 1)
        //x:1,y:1 and x-1,y:-1
        var diag2 = this.checkForWinRecurse(col, row, player, 1, 1, 1) + this.checkForWinRecurse(col, row, player, -1, -1, 1)
        //x:0,y:1 and x:0,y:-1
        var vert = this.checkForWinRecurse(col, row, player, 0, 1, 1) + this.checkForWinRecurse(col, row, player, 0, -1, 1)
        //x:1,y:0 and x-1,y:0
        var hor = this.checkForWinRecurse(col, row, player, 1, 0, 1) + this.checkForWinRecurse(col, row, player, -1, 0, 1)

        return Math.max(diag1, diag2, vert, hor) >= 5
    }

    checkForWinRecurse(col : number, row : number, player : number, xDirection : number, yDirection : number, count : number): number{
        var c = col + xDirection
        var r = row + yDirection
        if(c >= this.grid.length || c < 0 || r >= this.grid[0].length || r < 0 || this.grid[c][r] != player) return count;
        else{
            return this.checkForWinRecurse(c, r, player, xDirection, yDirection, count+1)
        }
    }
}