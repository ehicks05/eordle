import React, { useState } from 'react';
import { IKeyboardEventHandler, useKeyboardEvent } from '@react-hookz/web';
import _ from 'lodash';
import { getWord, isAllowedGuess } from './api';
import { DEFAULT_BOARD, Result } from './constants';

const App = () => {
  const [gameStatus, setGameStatus] = useState({
    active: true,
    gameOverMessage: '',
  });
  const [word, setWord] = useState(getWord());
  const [board, setBoard] = useState(DEFAULT_BOARD);
  const [boardEffects, setBoardEffects] = useState(['', '', '', '', '', '']);
  const [rowIndex, setRowIndex] = useState(0);
  const [colIndex, setColIndex] = useState(0);

  const updateLetter = (val: string, letterIndex: number) =>
    board.map((guess, i) =>
      guess.map((letter, j) => {
        if (i === rowIndex && j === letterIndex)
          return { ...letter, letter: val };
        return letter;
      })
    );

  const checkRow = (rowIndex: number) =>
    board.map((row, i) => {
      if (i !== rowIndex) return row;
      // check each letter
      const w = word.split('');
      return row
        .map((cell, j) => {
          let result: Result = 'unknown';
          if (!w.includes(cell.letter)) result = 'not_present';
          else if (w[j] === cell.letter) {
            result = 'correct';
            w[j] = '';
          }

          return {
            ...cell,
            result,
          };
        })
        .map((cell) => {
          if (cell.result !== 'unknown') return cell;

          const result: Result = w.includes(cell.letter)
            ? 'wrong_location'
            : 'not_present';
          if (result === 'wrong_location') {
            w[w.indexOf(cell.letter)] = '';
          }

          return {
            ...cell,
            result,
          };
        });
    });

  const handleInvalidGuess = () => {
    setBoardEffects((boardEffects) =>
      boardEffects.map((cell, i) => (i === rowIndex ? 'animate-shake' : cell))
    );
    setTimeout(
      () =>
        setBoardEffects((boardEffects) =>
          boardEffects.map((cell, i) => (i === rowIndex ? '' : cell))
        ),
      830
    );
  };

  const handleKey: IKeyboardEventHandler<EventTarget> = (e: KeyboardEvent) => {
    if (!gameStatus.active) return;

    const { key } = e;
    console.log(key);

    if (key === 'Enter' && colIndex === 5) {
      const guess = board[rowIndex].map((cell) => cell.letter).join('');
      const isValidGuess = isAllowedGuess(guess);
      if (isValidGuess) {
        const updatedBoard = checkRow(rowIndex);
        setBoard(updatedBoard);

        const isCorrect = _.every(
          updatedBoard[rowIndex],
          ({ result }) => result === 'correct'
        );
        if (isCorrect) {
          setGameStatus({ active: false, gameOverMessage: 'Great job!' });
        }
        if (!isCorrect && rowIndex === 5) {
          setGameStatus({ active: false, gameOverMessage: 'Sorry!' });
        }

        setRowIndex((i) => i + 1);
        setColIndex(0);
      } else {
        handleInvalidGuess();
      }
    } else if (key === 'Backspace' && colIndex > 0) {
      setBoard(updateLetter('', colIndex - 1));
      setColIndex((j) => j - 1);
    } else if (/^[a-zA-Z]$/.test(key) && colIndex < 5) {
      setBoard(updateLetter(key.toLowerCase(), colIndex));
      setColIndex((j) => j + 1);
    }
  };

  useKeyboardEvent(true, handleKey);

  const newGame = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.blur();
    setGameStatus({ active: true, gameOverMessage: '' });
    setBoard(DEFAULT_BOARD);
    setWord(getWord());
    setRowIndex(0);
    setColIndex(0);
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <h1 className="text-4xl mb-4">Eordle</h1>

      {!gameStatus.active && (
        <div className="absolute top-24 p-4 rounded-lg text-2xl bg-neutral-600 shadow-2xl">
          {gameStatus.gameOverMessage}
        </div>
      )}

      <div className="flex flex-col gap-2">
        {board.map((row, a) => (
          <div key={a} className={`flex gap-2 ${boardEffects[a]}`}>
            {row.map((cell, b) => (
              <Cell
                key={b}
                letter={cell.letter}
                result={cell.result}
                index={b}
              />
            ))}
          </div>
        ))}
      </div>

      {!gameStatus.active && (
        <button
          type="button"
          onClick={(e) => newGame(e)}
          className="px-4 py-2 bg-green-500 text-xl rounded"
        >
          New Game
        </button>
      )}
      <Debug
        state={{ word, rowIndex, colIndex, boardEffects, gameStatus, board }}
      />
    </div>
  );
};

const Debug = ({ state }: { state: any }) => (
  <div className="flex p-4 bg-neutral-800 text-xs">
    <pre className="text-xs">{JSON.stringify(state, null, 2)}</pre>
  </div>
);

interface CellProps {
  letter: string;
  result: Result;
  index: number;
}
const Cell = ({ letter, result, index }: CellProps) => {
  const base = `flex items-center justify-center w-10 h-10 rounded-sm text-xl font-bold transition`;
  const resultMap = {
    unknown: 'bg-neutral-900 border border-neutral-600',
    correct: 'bg-green-500 duration-1000',
    wrong_location: 'bg-yellow-500 duration-1000',
    not_present: 'bg-neutral-700 duration-700',
  };
  return (
    <div
      className={`${base} ${resultMap[result]}`}
      style={{ transitionDelay: `${400 + index * 400}ms` }}
    >
      {letter.toUpperCase()}
    </div>
  );
};

export default App;
