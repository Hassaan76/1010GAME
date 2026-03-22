/**
 * 1010! Interactive Game Engine - Core Logic
 */

class BitboardGame {
    constructor() {
        this.grid = 0n; 
        this.gridColors = new Array(100).fill(null); 
        this.score = 0;
        this.bestScore = parseInt(localStorage.getItem('bestScore')) || 0;
        this.initPieceDatabase();
    }

    initPieceDatabase() {
        const P = (rows) => {
            let mask = 0n;
            rows.forEach((row, r) => {
                for(let c = 0; c < row.length; c++) {
                    if(row[c] === '1') mask |= (1n << BigInt(r * 10 + c));
                }
            });
            return { mask, w: rowCount(mask), height: rows.length, width: rows[0].length };
        };

        const rowCount = (m) => {
            let count = 0;
            let temp = m;
            while(temp > 0n) {
                if(temp & 1n) count++;
                temp >>= 1n;
            }
            return count;
        };

        // Reference colors from 1010! original dark theme
        this.pieceDb = [
            { id: 'R', color: '#ff3b30', weight: 1, ...P(['111','100','100']) }, 
            { id: 'T', color: '#ff3b30', weight: 1, ...P(['111','001','001']) },
            { id: 'J', color: '#ff3b30', weight: 1, ...P(['100','100','111']) },
            { id: 'L', color: '#ff3b30', weight: 1, ...P(['001','001','111']) },
            { id: '.', color: '#ffcc00', weight: 2, ...P(['1']) },            
            { id: 'r', color: '#ff9500', weight: 2, ...P(['11','10']) },      
            { id: 't', color: '#ff9500', weight: 2, ...P(['11','01']) },
            { id: 'j', color: '#ff9500', weight: 2, ...P(['10','11']) },
            { id: 'l', color: '#ff9500', weight: 2, ...P(['01','11']) },
            { id: 'h', color: '#007aff', weight: 2, ...P(['1111']) },         
            { id: 'v', color: '#007aff', weight: 2, ...P(['1','1','1','1']) },
            { id: 'H', color: '#5856d6', weight: 2, ...P(['11111']) },        
            { id: 'V', color: '#5856d6', weight: 2, ...P(['1','1','1','1','1']) },
            { id: 'O', color: '#4cd964', weight: 2, ...P(['111','111','111']) }, 
            { id: 'i', color: '#af52de', weight: 3, ...P(['1','1']) },        
            { id: '-', color: '#af52de', weight: 3, ...P(['11']) },
            { id: 'I', color: '#5ac8fa', weight: 3, ...P(['1','1','1']) },    
            { id: '_', color: '#5ac8fa', weight: 3, ...P(['111']) },
            { id: 'o', color: '#34c759', weight: 6, ...P(['11','11']) }       
        ];

        this.totalWeight = this.pieceDb.reduce((acc, p) => acc + p.weight, 0);
    }

    getRandomPiece() {
        let r = Math.floor(Math.random() * this.totalWeight);
        for (const p of this.pieceDb) {
            if (r < p.weight) return { ...p, uid: Math.random().toString(36).substr(2, 9) };
            r -= p.weight;
        }
        return { ...this.pieceDb[0], uid: Math.random().toString(36).substr(2, 9) };
    }

    canPlace(piece, pos) {
        if (pos < 0 || pos >= 100) return false;
        const r = Math.floor(pos / 10);
        const c = pos % 10;
        if (r + piece.height > 10 || c + piece.width > 10) return false;
        const shiftedMask = piece.mask << BigInt(pos);
        return (this.grid & shiftedMask) === 0n;
    }

    applyMove(piece, pos) {
        this.grid |= (piece.mask << BigInt(pos));
        for (let r = 0; r < piece.height; r++) {
            for (let c = 0; c < piece.width; c++) {
                const bit = (piece.mask >> BigInt(r * 10 + c)) & 1n;
                if (bit) {
                    this.gridColors[pos + r * 10 + c] = piece.color;
                }
            }
        }
        this.score += piece.w;
        this.checkClears();
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            localStorage.setItem('bestScore', this.bestScore);
        }
    }

    checkClears() {
        let rowsToClear = 0n;
        let colsToClear = 0n;
        let clearCount = 0;

        for (let r = 0; r < 10; r++) {
            const rowMask = 0x3FFn << BigInt(r * 10);
            if ((this.grid & rowMask) === rowMask) {
                rowsToClear |= rowMask;
                clearCount++;
            }
        }

        const colBaseMask = 0x40100401004010040100401n;
        for (let c = 0; c < 10; c++) {
            const colMask = colBaseMask << BigInt(c);
            if ((this.grid & colMask) === colMask) {
                colsToClear |= colMask;
                clearCount++;
            }
        }

        if (clearCount > 0) {
            const clearMask = rowsToClear | colsToClear;
            for (let i = 0; i < 100; i++) {
                if ((clearMask >> BigInt(i)) & 1n) {
                    this.gridColors[i] = null;
                }
            }
            this.grid &= ~clearMask;
            this.score += (clearCount * (clearCount + 1) / 2) * 10;
        }
    }

    isGameOver(currentPieces) {
        const activePieces = currentPieces.filter(p => p !== null);
        if (activePieces.length === 0) return false;
        for (const p of activePieces) {
            for (let i = 0; i < 100; i++) {
                if (this.canPlace(p, i)) return false;
            }
        }
        return true;
    }
}

if (typeof module !== 'undefined') {
    module.exports = BitboardGame;
}
