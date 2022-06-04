import React, { useState } from 'react';
import { IKeyboardEventHandler, useKeyboardEvent } from '@react-hookz/web';
import _ from 'lodash';
import { HiOutlineBackspace, HiOutlineCode } from 'react-icons/hi';
import { getWord, isAllowedGuess } from './api';
import { Board, DEFAULT_BOARD, Result } from './constants';

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
  const [debug, setDebug] = useState(false);

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

  const handleKeyboardEvent: IKeyboardEventHandler<EventTarget> = (
    e: KeyboardEvent
  ) => {
    const { key } = e;
    handleKey(key);
  };

  const handleKey = (key: string) => {
    if (!gameStatus.active) return;
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

  useKeyboardEvent(true, handleKeyboardEvent);

  const newGame = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.blur();
    setGameStatus({ active: true, gameOverMessage: '' });
    setBoard(DEFAULT_BOARD);
    setWord(getWord());
    setRowIndex(0);
    setColIndex(0);
  };

  return (
    <div className="flex flex-col items-center h-screen gap-4 p-4">
      <h1 className="text-4xl mb-4">Eordle</h1>

      {!gameStatus.active && (
        <div className="absolute top-24 p-4 rounded-lg text-2xl bg-neutral-600 shadow-2xl">
          {gameStatus.gameOverMessage}
        </div>
      )}

      <div className="flex flex-col h-full justify-center gap-2">
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
      <div className="flex-grow" />
      <Keyboard board={board} handleKey={handleKey} />

      <button
        type="button"
        onClick={() => setDebug((debug) => !debug)}
        className="px-4 py-2 bg-neutral-500 text-xl rounded"
      >
        <HiOutlineCode />
      </button>
      {debug && (
        <Debug
          state={{ word, rowIndex, colIndex, boardEffects, gameStatus, board }}
        />
      )}
    </div>
  );
};

const Debug = ({ state }: { state: any }) => (
  <div className="flex p-4 bg-neutral-800 text-xs">
    <pre className="text-xs">{JSON.stringify(state, null, 2)}</pre>
  </div>
);

const resultMap = {
  unknown: `bg-neutral-900 border-neutral-600`,
  correct: 'bg-green-500 border-neutral-900 duration-1000',
  wrong_location: 'bg-yellow-500 border-neutral-900 duration-1000',
  not_present: 'bg-neutral-700 border-neutral-900 duration-700',
};

interface CellProps {
  letter: string;
  result: Result;
  index?: number;
}
const Cell = ({ letter, result, index }: CellProps) => {
  const base = `flex items-center justify-center w-10 h-10 border rounded-sm text-xl font-bold`;

  const unknownBorder = letter ? 'border-neutral-500' : 'border-neutral-600';

  // TODO: transitions work with guess result feedback but not unknown border change
  return (
    <div
      className={`${base} ${resultMap[result]} ${result === 'unknown' ? unknownBorder : ''}`}
      style={{ transitionDelay: `${(index || 0) * 400}ms`,
       transitionProperty: 'color, background-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter',
       transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
       transitionDuration: '150ms',
      }}
    >
      {letter.toUpperCase()}
    </div>
  );
};

const kbResultMap = {
  not_present: `bg-neutral-700`,
  correct: 'bg-green-500 duration-1000',
  wrong_location: 'bg-yellow-500 duration-1000',
  unknown: 'bg-neutral-500 duration-700',
};

const RESULT_PRIORITIES: Record<Result, number> = {
  correct: 0,
  wrong_location: 1,
  not_present: 2,
  unknown: 3,
};

interface KeyboardProps {
  board: Board;
  handleKey: (key: string) => void;
}
const Keyboard = ({ board, handleKey }: KeyboardProps) => {
  const letterResults = board
    .flat()
    .sort(
      ({ result: r1 }, { result: r2 }) =>
        RESULT_PRIORITIES[r2] - RESULT_PRIORITIES[r1]
    )
    .reduce(
      (agg, curr) => ({ ...agg, [curr.letter]: curr.result }),
      {} as Record<string, Result>
    );
  return (
    <div className="flex flex-col gap-1.5">
      {[
        ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
        ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
        ['Enter', 'z', 'x', 'c', 'v', 'b', 'n', 'm', 'Backspace'],
      ].map((row) => (
        <div className="flex justify-center gap-1.5">
          {row.map((key) => {
            const renderKey =
              key === 'Backspace' ? (
                <HiOutlineBackspace size={24} />
              ) : (
                key.toUpperCase()
              );
            const base ='flex items-center justify-center px-2 h-10 rounded text-sm font-bold';
            const letterResult = letterResults[key] || 'unknown';
            const resultStyle = kbResultMap[letterResult];
            return (
              <button
                type="button"
                className={`${base} ${resultStyle}`}
                onClick={(e) => {
                  e.currentTarget.blur();
                  handleKey(key);
                }}
              >
                {renderKey}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default App;
