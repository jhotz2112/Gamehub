import React, { useState, useEffect, useRef } from "react";
import "./styles.css";
import "./ConnectFour.css";

const boardSettings = {
  rows: 6,
  columns: 7,
  dropAnimationRate: 50,
  flashAnimationRate: 600,
  colors: {
    empty: "#7fc3ff",
    // above is light-blue
    p1: "#BB2222",
    // above is red
    p2: "#000000"
    // above is black
  }
};

const winTypes = {
  vertical: 0,
  horizontal: 1,
  forwardsDiagonal: 2,
  backwardsDiagonal: 3
};

let redScore = 0,
  blackScore = 0;

export default function ConnectFour() {
  const [board, setBoard] = useState(createBoard());
  const [currentPlayer, setCurrentPlayer] = useState(getFirstPlayerTurn());
  const [win, setWin] = useState(null);
  const [flashTimer, setFlashTimer] = useState(null);
  const [dropping, setDropping] = useState(false);
  const domBoard = useRef(null);

  /**
   * Helper function to get the index in the board using row and column.
   * @param {number} row - row in board
   * @param {number} column - column in board
   */
  function getIndex(row, column) {
    const index = row * boardSettings.columns + column;
    if (index > boardSettings.rows * boardSettings.colums) return null;
    return index;
  }
  function getRowAndColumn(index) {
    if (index > boardSettings.rows * boardSettings.colums) return null;
    const row = Math.floor(index / boardSettings.columns);
    const column = Math.floor(index % boardSettings.columns);
    return {
      row,
      column
    };
  }

  function createBoard() {
    return new Array(boardSettings.rows * boardSettings.columns).fill(
      boardSettings.colors.empty
    );
  }

  function getFirstPlayerTurn() {
    return boardSettings.colors.p1;
  }

  function restartGame() {
    getScore();
    setCurrentPlayer(getFirstPlayerTurn());
    setWin(null);
    setBoard(createBoard());
  }

  function getScore() {
    console.log("Getting Score:");
    console.log(win);

    if (win.winner === "#BB2222") {
      redScore++;
    } else if (win.winner === "#000000") {
      blackScore++;
    }
  }

  function getDomBoardCell(index) {
    if (!domBoard.current) return;
    const board = domBoard.current;
    const blocks = board.querySelectorAll(".board-block");
    return blocks[index];
  }

  function findFirstEmptyRow(column) {
    let { empty } = boardSettings.colors;
    let { rows } = boardSettings;
    for (let i = 0; i < rows; i++) {
      if (board[getIndex(i, column)] !== empty) {
        return i - 1;
      }
    }
    return rows - 1;
  }

  async function handleDrop(column) {
    if (dropping || win) return;
    const row = findFirstEmptyRow(column);
    if (row < 0) return;
    setDropping(true);
    await animateDrop(row, column, currentPlayer);
    setDropping(false);
    const newBoard = board.slice();
    newBoard[getIndex(row, column)] = currentPlayer;
    setBoard(newBoard);

    setCurrentPlayer(
      currentPlayer === boardSettings.colors.p1
        ? boardSettings.colors.p2
        : boardSettings.colors.p1
    );
  }

  async function animateDrop(row, column, color, currentRow) {
    if (currentRow === undefined) {
      currentRow = 0;
    }
    return new Promise((resolve) => {
      if (currentRow > row) {
        return resolve();
      }
      if (currentRow > 0) {
        let c = getDomBoardCell(getIndex(currentRow - 1, column));
        c.style.backgroundColor = boardSettings.colors.empty;
      }
      let c = getDomBoardCell(getIndex(currentRow, column));
      c.style.backgroundColor = color;
      setTimeout(
        () => resolve(animateDrop(row, column, color, ++currentRow)),
        boardSettings.dropAnimationRate
      );
    });
  }

  /**
   * End game animation.
   */
  useEffect(() => {
    if (!win) {
      return;
    }

    function flashWinningCells(on) {
      const { empty } = boardSettings.colors;
      const { winner } = win;
      for (let o of win.winningCells) {
        let c = getDomBoardCell(getIndex(o.row, o.column));
        c.style.backgroundColor = on ? winner : empty;
      }
      setFlashTimer(
        setTimeout(
          () => flashWinningCells(!on),
          boardSettings.flashAnimationRate
        )
      );
    }

    flashWinningCells(false);
  }, [win, setFlashTimer]);

  /**
   * Clears the end game animation timeout when game is restarted.
   */
  useEffect(() => {
    if (!win) {
      if (flashTimer) clearTimeout(flashTimer);
    }
  }, [win, flashTimer]);

  /**
   * Check for win when the board changes.
   */
  useEffect(() => {
    if (dropping || win) return;

    function isWin() {
      return (
        isForwardsDiagonalWin() ||
        isBackwardsDiagonalWin() ||
        isHorizontalWin() ||
        isVerticalWin() ||
        null
      );
    }

    function createWinState(start, winType) {
      const win = {
        winner: board[start],
        winningCells: []
      };

      let pos = getRowAndColumn(start);

      while (true) {
        let current = board[getIndex(pos.row, pos.column)];
        if (current === win.winner) {
          win.winningCells.push({ ...pos });
          if (winType === winTypes.horizontal) {
            pos.column++;
          } else if (winType === winTypes.vertical) {
            pos.row++;
          } else if (winType === winTypes.backwardsDiagonal) {
            pos.row++;
            pos.column++;
          } else if (winType === winTypes.forwardsDiagonal) {
            pos.row++;
            pos.column--;
          }
        } else {
          return win;
        }
      }
    }
    function isHorizontalWin() {
      const { rows } = boardSettings;
      const { columns } = boardSettings;
      const { empty } = boardSettings.colors;
      for (let row = 0; row < rows; row++) {
        for (let column = 0; column <= columns - 4; column++) {
          let start = getIndex(row, column);
          if (board[start] === empty) continue;
          let counter = 1;
          for (let k = column + 1; k < column + 4; k++) {
            if (board[getIndex(row, k)] === board[start]) {
              counter++;
              if (counter === 4)
                return createWinState(start, winTypes.horizontal);
            }
          }
        }
      }
    }
    function isVerticalWin() {
      const { rows } = boardSettings;
      const { columns } = boardSettings;
      const { empty } = boardSettings.colors;
      for (let column = 0; column < columns; column++) {
        for (let row = 0; row <= rows - 4; row++) {
          let start = getIndex(row, column);
          if (board[start] === empty) continue;
          let counter = 1;
          for (let k = row + 1; k < row + 4; k++) {
            if (board[getIndex(k, column)] === board[start]) {
              counter++;
              if (counter === 4)
                return createWinState(start, winTypes.vertical);
            }
          }
        }
      }
    }
    function isBackwardsDiagonalWin() {
      const { rows } = boardSettings;
      const { columns } = boardSettings;
      const { empty } = boardSettings.colors;
      for (let row = 0; row <= rows - 4; row++) {
        for (let column = 0; column <= columns - 4; column++) {
          let start = getIndex(row, column);
          if (board[start] === empty) continue;
          let counter = 1;
          for (let i = 1; i < 4; i++) {
            if (board[getIndex(row + i, column + i)] === board[start]) {
              counter++;
              if (counter === 4)
                return createWinState(start, winTypes.backwardsDiagonal);
            }
          }
        }
      }
    }
    function isForwardsDiagonalWin() {
      const { rows } = boardSettings;
      const { columns } = boardSettings;
      const { empty } = boardSettings.colors;
      for (let row = 0; row <= rows - 4; row++) {
        for (let column = 3; column <= columns; column++) {
          let start = getIndex(row, column);
          if (board[start] === empty) continue;
          let counter = 1;
          for (let i = 1; i < 4; i++) {
            if (board[getIndex(row + i, column - i)] === board[start]) {
              counter++;
              if (counter === 4)
                return createWinState(start, winTypes.forwardsDiagonal);
            }
          }
        }
      }
    }
    setWin(isWin());
  }, [board, dropping, win]);

  function createDropButtons() {
    const btns = [];
    for (let i = 0; i < boardSettings.columns; i++) {
      btns.push(
        <button
          key={i}
          className="cell drop-button"
          onClick={() => handleDrop(i)}
          style={{
            backgroundColor: currentPlayer
          }}
        />
      );
    }
    return btns;
  }

  const cells = board.map((c, i) => (
    <button
      key={"c" + i}
      className="cell board-block"
      style={{
        backgroundColor: c
      }}
    />
  ));

  function getGridTemplateColumns() {
    let gridTemplateColumns = "";
    for (let i = 0; i < boardSettings.columns; i++) {
      gridTemplateColumns += "auto ";
    }
    return gridTemplateColumns;
  }

  // if (win) {
  //   redScore++;
  // }

  return (
    <div>
      <div
        className={`board ${
          currentPlayer === boardSettings.colors.p1 ? "p1-turn" : "p2-turn"
        } `}
        ref={domBoard}
        style={{
          gridTemplateColumns: getGridTemplateColumns()
        }}
      >
        {createDropButtons()}
        {cells}
      </div>
      {/* if win is null do this */}
      {!win && (
        <span className="infoDisplay">
          <span>
            <span className="redScore"> {redScore} </span>
            <span className="scoreBreak">:</span>
            <span className="blackScore"> {blackScore} </span>
          </span>
          <span style={{ color: currentPlayer }}>
            {currentPlayer === boardSettings.colors.p1
              ? "RED's Turn"
              : "BLACK's Turn"}
          </span>
        </span>
      )}
      {/* if winner is truthy do this */}

      {win && (
        <>
          {/* <p>Winner winner chicken dinner</p> */}
          <h1 style={{ color: win.winner }}>
            {" "}
            {win.winner === boardSettings.colors.p1 ? "RED" : "BLACK"} WON!
          </h1>
          <button className="winButton" onClick={restartGame}>
            Play Again
          </button>

          <br />
          <br />
        </>
      )}
    </div>
  );
}
