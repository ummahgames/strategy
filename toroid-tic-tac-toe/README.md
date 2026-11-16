# Toroid Tic-Tac-Toe

A single-player, static browser game. Open `index.html` or serve this folder with a static web server. Choose a 3×3, 4×4, or 5×5 board and Easy, Medium, or Hard in settings. Place a mark or spend a turn shifting the whole board; marks wrap around the edges. Winning lines remain within the displayed board. Threefold repetition and simultaneous wins are draws.

The computer searches in a Web Worker when available. If workers cannot be created, it falls back to a bounded search on the main thread.
