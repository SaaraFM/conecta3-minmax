// ==========================================================
// CONECTA 3 - HUMANO vs IA COM ALGORITMO MINMAX
// ==========================================================

const ROWS = 4;
const COLS = 4;
const WIN_COUNT = 3;

const EMPTY = 0;
const HUMAN = 1;
const IA = 2;

const DIRECTIONS = [[0, 1], [1, 0], [1, 1], [1, -1]];

let gameBoard = [];
let currentPlayer = HUMAN;
let gameActive = true;
let soundEnabled = true;
let animationInProgress = false;

let scoreHuman = 0;
let scoreIA = 0;

let nodesEvaluated = 0;
let maxDepthReached = 0;

document.addEventListener('DOMContentLoaded', () => {
    initializeGame();
    setupEventListeners();
});

function initializeGame() {
    gameBoard = createEmptyBoard();
    currentPlayer = HUMAN;
    gameActive = true;
    animationInProgress = false;
    renderBoard();
    updateTurnIndicator();
    clearMessageBox();
    clearAnalysisPanel();
}

function createEmptyBoard() {
    return Array(ROWS).fill(null).map(() => Array(COLS).fill(EMPTY));
}

function setupEventListeners() {
    document.getElementById('btnNewGame').addEventListener('click', startNewGame);
    document.getElementById('btnResetScore').addEventListener('click', resetScore);
    document.getElementById('btnSound').addEventListener('click', toggleSound);
    document.getElementById('btnHowItWorks').addEventListener('click', openMinMaxModal);
    document.getElementById('btnCloseModal').addEventListener('click', closeMinMaxModal);
    document.getElementById('btnCloseModalBottom').addEventListener('click', closeMinMaxModal);
    document.getElementById('btnPlayAgain').addEventListener('click', playAgain);
    setupCellEventListeners();
}

function setupCellEventListeners() {
    const cells = document.querySelectorAll('.cell');
    cells.forEach((cell, index) => {
        const column = index % COLS;
        cell.addEventListener('click', () => handleCellClick(column));
        cell.addEventListener('mouseenter', () => showColumnPreview(column));
        cell.addEventListener('mouseleave', hideColumnPreview);
    });
}

// LÓGICA DO JOGO
function getValidMoves(board) {
    const validMoves = [];
    for (let col = 0; col < COLS; col++) {
        if (board[0][col] === EMPTY) {
            validMoves.push(col);
        }
    }
    return validMoves;
}

function getAvailableRow(board, column) {
    for (let row = ROWS - 1; row >= 0; row--) {
        if (board[row][column] === EMPTY) {
            return row;
        }
    }
    return -1;
}

function makeMove(board, column, player) {
    const newBoard = board.map(row => [...row]);
    const row = getAvailableRow(newBoard, column);
    if (row !== -1) {
        newBoard[row][column] = player;
    }
    return newBoard;
}

function isBoardFull(board) {
    return getValidMoves(board).length === 0;
}

function isTerminalState(board) {
    return checkWinner(board, HUMAN) || checkWinner(board, IA) || isBoardFull(board);
}

function checkWinner(board, player) {
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            if (board[row][col] === player) {
                for (const [dirRow, dirCol] of DIRECTIONS) {
                    const sequence = checkDirection(board, row, col, dirRow, dirCol, player);
                    if (sequence.length >= WIN_COUNT) {
                        return sequence.slice(0, WIN_COUNT);
                    }
                }
            }
        }
    }
    return null;
}

function checkDirection(board, startRow, startCol, dirRow, dirCol, player) {
    const sequence = [];
    let row = startRow;
    let col = startCol;

    while (row >= 0 && row < ROWS && col >= 0 && col < COLS && board[row][col] === player) {
        sequence.push([row, col]);
        row += dirRow;
        col += dirCol;
    }

    return sequence;
}

function evaluateTerminal(board, depth) {
    const humanWin = checkWinner(board, HUMAN);
    const iaWin = checkWinner(board, IA);

    if (iaWin) {
        return 100 - depth;
    } else if (humanWin) {
        return -100 + depth;
    } else {
        return 0;
    }
}

// MINMAX
function minimax(board, depth, isMaximizing, alpha = -Infinity, beta = Infinity) {
    nodesEvaluated++;
    maxDepthReached = Math.max(maxDepthReached, depth);

    if (isTerminalState(board)) {
        return evaluateTerminal(board, depth);
    }

    const validMoves = getValidMoves(board);

    if (isMaximizing) {
        let bestValue = -Infinity;

        for (const column of validMoves) {
            const newBoard = makeMove(board, column, IA);
            const value = minimax(newBoard, depth + 1, false, alpha, beta);
            bestValue = Math.max(bestValue, value);
            alpha = Math.max(alpha, bestValue);

            if (beta <= alpha) {
                break;
            }
        }

        return bestValue;
    } else {
        let bestValue = Infinity;

        for (const column of validMoves) {
            const newBoard = makeMove(board, column, HUMAN);
            const value = minimax(newBoard, depth + 1, true, alpha, beta);
            bestValue = Math.min(bestValue, value);
            beta = Math.min(beta, bestValue);

            if (beta <= alpha) {
                break;
            }
        }

        return bestValue;
    }
}

function getBestMove(board) {
    nodesEvaluated = 0;
    maxDepthReached = 0;
    const analysisStartTime = performance.now();

    const validMoves = getValidMoves(board);
    const moveValues = {};

    for (const column of validMoves) {
        const newBoard = makeMove(board, column, IA);
        const value = minimax(newBoard, 1, false);
        moveValues[column] = value;
    }

    const analysisEndTime = performance.now();
    const processingTime = Math.round(analysisEndTime - analysisStartTime);

    let bestValue = -Infinity;
    let bestMove = validMoves[0];

    for (const column of validMoves) {
        if (moveValues[column] > bestValue) {
            bestValue = moveValues[column];
            bestMove = column;
        }
    }

    displayAnalysis(moveValues, bestMove, processingTime);

    return bestMove;
}

function displayAnalysis(moveValues, bestMove, processingTime) {
    const analysisContent = document.getElementById('analysisContent');
    let html = '';

    html += '<div class="analysis-section-title">Avaliação de Colunas</div>';

    for (let col = 0; col < COLS; col++) {
        if (col in moveValues) {
            const value = moveValues[col];
            const isBest = col === bestMove;
            const className = isBest ? 'best' : '';

            html += `
                <div class="analysis-item ${className}">
                    <span class="analysis-column">Coluna ${col}</span>
                    <span class="analysis-number">${value > 0 ? '+' : ''}${value}</span>
                </div>
            `;
        }
    }

    html += '<div class="analysis-section-title">Resultado</div>';
    html += `
        <div class="analysis-line">
            <span class="analysis-label">Melhor coluna:</span>
            <span class="analysis-value">${bestMove}</span>
        </div>
    `;

    html += '<div class="analysis-section-title">Estatísticas</div>';
    html += `
        <div class="analysis-line">
            <span class="analysis-label">Nós avaliados:</span>
            <span class="analysis-value">${nodesEvaluated}</span>
        </div>
        <div class="analysis-line">
            <span class="analysis-label">Profundidade máxima:</span>
            <span class="analysis-value">${maxDepthReached}</span>
        </div>
        <div class="analysis-line">
            <span class="analysis-label">Tempo (ms):</span>
            <span class="analysis-value">${processingTime}</span>
        </div>
    `;

    analysisContent.innerHTML = html;
}

// RENDERIZAÇÃO
function renderBoard() {
    const boardElement = document.getElementById('gameBoard');
    boardElement.innerHTML = '';

    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.id = `cell-${row}-${col}`;
            cell.setAttribute('data-column', col);

            if (gameBoard[0][col] !== EMPTY) {
                cell.classList.add('cell-disabled');
            }

            if (gameBoard[row][col] !== EMPTY) {
                const disc = createDiscElement(gameBoard[row][col]);
                cell.appendChild(disc);
            }

            boardElement.appendChild(cell);
        }
    }
}

function createDiscElement(player) {
    const disc = document.createElement('div');
    disc.className = `disc ${player === HUMAN ? 'human' : 'ia'}`;
    return disc;
}

function updateTurnIndicator() {
    const turnIndicator = document.getElementById('turnIndicator');
    if (currentPlayer === HUMAN) {
        turnIndicator.textContent = 'SUA VEZ';
        turnIndicator.style.color = 'var(--success-green)';
    } else {
        turnIndicator.textContent = 'IA ANALISANDO...';
        turnIndicator.style.color = 'var(--ia-red)';
    }
}

function setMessage(text, type = 'info') {
    const messageBox = document.getElementById('messageBox');
    messageBox.textContent = text;
    messageBox.className = `message-box message-${type}`;
}

function clearMessageBox() {
    const messageBox = document.getElementById('messageBox');
    messageBox.textContent = '';
    messageBox.className = 'message-box';
}

function clearAnalysisPanel() {
    const analysisContent = document.getElementById('analysisContent');
    analysisContent.innerHTML = '<p class="placeholder">A análise aparecerá aqui durante a jogada da IA...</p>';
}

// INTERAÇÃO
function handleCellClick(column) {
    if (!gameActive || animationInProgress || currentPlayer !== HUMAN) {
        return;
    }

    const row = getAvailableRow(gameBoard, column);
    if (row === -1) {
        setMessage('Coluna cheia! Escolha outra.', 'error');
        return;
    }

    hideColumnPreview();
    playHumanMove(column);
}

function showColumnPreview(column) {
    if (currentPlayer !== HUMAN || !gameActive) {
        return;
    }

    const row = getAvailableRow(gameBoard, column);
    if (row === -1) {
        return;
    }

    const cells = document.querySelectorAll('.cell');
    const firstCellInColumn = cells[column];

    document.querySelectorAll('.cell-preview').forEach(p => p.remove());

    const preview = document.createElement('div');
    preview.className = 'cell-preview';
    firstCellInColumn.appendChild(preview);
}

function hideColumnPreview() {
    document.querySelectorAll('.cell-preview').forEach(p => p.remove());
}

function playHumanMove(column) {
    animationInProgress = true;
    const row = getAvailableRow(gameBoard, column);

    animateDiscFalling(row, column, HUMAN, () => {
        gameBoard[row][column] = HUMAN;
        renderBoard();
        checkGameState();
    });
}

function playIAMove() {
    animationInProgress = true;
    setMessage('IA está analisando as possibilidades...', 'info');
    updateTurnIndicator();

    setTimeout(() => {
        const bestColumn = getBestMove(gameBoard);
        const row = getAvailableRow(gameBoard, bestColumn);

        animateDiscFalling(row, bestColumn, IA, () => {
            gameBoard[row][bestColumn] = IA;
            renderBoard();
            checkGameState();
        });
    }, 600);
}

// ANIMAÇÕES
function animateDiscFalling(targetRow, column, player, callback) {
    const cells = document.querySelectorAll('.cell');
    const firstCell = cells[column];

    const holeSize = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--hole-size'));
    const boardGap = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--board-gap'));
    const distance = (targetRow + 1) * (holeSize + boardGap);

    const disc = document.createElement('div');
    disc.className = `disc ${player === HUMAN ? 'human' : 'ia'}`;
    disc.style.position = 'absolute';
    disc.style.top = '0';
    disc.style.left = '0';
    disc.style.zIndex = '100';

    firstCell.appendChild(disc);

    const fallDuration = 300 + targetRow * 100;

    disc.style.setProperty('--fall-distance', `${distance}px`);
    disc.style.setProperty('--fall-duration', `${fallDuration}ms`);
    disc.classList.add('falling');

    setTimeout(() => {
        disc.classList.remove('falling');
        disc.classList.add('bounce');

        setTimeout(() => {
            disc.remove();
            animationInProgress = false;
            callback();
        }, 200);
    }, fallDuration);
}

function animateReleaseDiscs() {
    const boardBase = document.querySelector('.board-base');

    boardBase.classList.add('opening');
    playSound('release');

    const discs = document.querySelectorAll('.disc:not(.falling-out)');
    const discArray = Array.from(discs);

    setTimeout(() => {
        discArray.forEach((disc, index) => {
            const delay = index * 50;
            const duration = 600 + Math.random() * 300;
            const rotation = 180 + Math.random() * 180;

            disc.style.setProperty('--fall-out-distance', `${400 + Math.random() * 200}px`);
            disc.style.setProperty('--fall-out-duration', `${duration}ms`);
            disc.style.setProperty('--fall-out-rotation', `${rotation}deg`);
            disc.style.transitionDelay = `${delay}ms`;
            disc.classList.add('falling-out');

            playSound('drop');
        });
    }, 200);

    setTimeout(() => {
        boardBase.classList.remove('opening');
        playSound('close');
    }, 800);
}

// VERIFICAÇÃO
function checkGameState() {
    const humanWin = checkWinner(gameBoard, HUMAN);
    const iaWin = checkWinner(gameBoard, IA);

    if (humanWin) {
        endGame('VOCÊ VENCEU!', 'human', humanWin);
        return;
    }

    if (iaWin) {
        endGame('A IA VENCEU!', 'ia', iaWin);
        return;
    }

    if (isBoardFull(gameBoard)) {
        endGame('EMPATE!', 'draw', null);
        return;
    }

    if (currentPlayer === HUMAN) {
        currentPlayer = IA;
        updateTurnIndicator();
        playIAMove();
    } else {
        currentPlayer = HUMAN;
        clearMessageBox();
        updateTurnIndicator();
        animationInProgress = false;
    }
}

function endGame(result, type, winningSequence) {
    gameActive = false;
    playSound('victory');

    if (winningSequence) {
        highlightWinningSequence(winningSequence);
    }

    setTimeout(() => {
        showGameOverModal(result, type);

        setTimeout(() => {
            animateReleaseDiscs();

            setTimeout(() => {
                if (type === 'human') {
                    scoreHuman++;
                } else if (type === 'ia') {
                    scoreIA++;
                }
                updateScore();
            }, 1200);
        }, 1800);
    }, 500);
}

function highlightWinningSequence(sequence) {
    const cells = document.querySelectorAll('.cell');
    for (const [row, col] of sequence) {
        const index = row * COLS + col;
        const cell = cells[index];
        const disc = cell.querySelector('.disc');
        if (disc) {
            disc.classList.add('pulse');
        }
    }
}

function showGameOverModal(result, type) {
    const modal = document.getElementById('modalGameOver');
    const title = document.getElementById('gameOverTitle');
    const content = document.getElementById('gameOverContent');

    title.textContent = result;

    if (type === 'human') {
        title.style.color = 'var(--player-yellow-dark)';
        content.innerHTML = `
            <p>Parabéns! Você conseguiu conectar 3 peças antes da IA.</p>
            <div class="game-over-winner">Função de Utilidade: -100</div>
            <p>A IA avaliou diversos cenários, mas você encontrou uma estratégia melhor.</p>
        `;
    } else if (type === 'ia') {
        title.style.color = 'var(--ia-red)';
        content.innerHTML = `
            <p>A Inteligência Artificial conseguiu conectar 3 peças primeiro.</p>
            <div class="game-over-winner">Função de Utilidade: +100</div>
            <p>O algoritmo MinMax avaliou os cenários possíveis e escolheu a melhor estratégia.</p>
        `;
    } else {
        title.style.color = 'var(--text-light)';
        content.innerHTML = `
            <p>O tabuleiro foi preenchido sem vencedor!</p>
            <div class="game-over-winner">Função de Utilidade: 0</div>
            <p>Ambos os jogadores jogaram otimamente.</p>
        `;
    }

    modal.classList.add('active');
}

// CONTROLES
function startNewGame() {
    const modal = document.getElementById('modalGameOver');
    modal.classList.remove('active');
    initializeGame();
}

function playAgain() {
    const modal = document.getElementById('modalGameOver');
    modal.classList.remove('active');
    initializeGame();
}

function resetScore() {
    scoreHuman = 0;
    scoreIA = 0;
    updateScore();
}

function updateScore() {
    document.getElementById('scoreHuman').textContent = scoreHuman;
    document.getElementById('scoreIA').textContent = scoreIA;
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    const btn = document.getElementById('btnSound');
    btn.style.opacity = soundEnabled ? '1' : '0.5';
}

// MODAIS
function openMinMaxModal() {
    const modal = document.getElementById('modalMinMax');
    modal.classList.add('active');
}

function closeMinMaxModal() {
    const modal = document.getElementById('modalMinMax');
    modal.classList.remove('active');
}

document.addEventListener('click', (event) => {
    const modalMinMax = document.getElementById('modalMinMax');
    if (event.target === modalMinMax) {
        closeMinMaxModal();
    }
});

// ÁUDIO
function playSound(type) {
    if (!soundEnabled) return;

    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const now = audioContext.currentTime;

    switch (type) {
        case 'drop':
            playTone(audioContext, 400, 0.05, 0.1);
            break;
        case 'release':
            playTone(audioContext, 600, 0.1, 0.2);
            break;
        case 'close':
            playTone(audioContext, 300, 0.05, 0.1);
            break;
        case 'victory':
            playVictorySound(audioContext);
            break;
    }
}

function playTone(audioContext, frequency, duration, volume) {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
}

function playVictorySound(audioContext) {
    const notes = [262, 294, 330, 392];
    notes.forEach((frequency, index) => {
        setTimeout(() => {
            playTone(audioContext, frequency, 0.2, 0.3);
        }, index * 150);
    });
}
