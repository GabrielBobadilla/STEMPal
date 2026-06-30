import React, { useState, useCallback, useEffect } from 'react';

function buildGrid(puzzle) {
  let maxRow = 0;
  let maxCol = 0;
  puzzle.words.forEach(w => {
    if (w.direction === 'across') {
      maxRow = Math.max(maxRow, w.row + 1);
      maxCol = Math.max(maxCol, w.col + w.word.length);
    } else {
      maxRow = Math.max(maxRow, w.row + w.word.length);
      maxCol = Math.max(maxCol, w.col + 1);
    }
  });

  const size = Math.max(maxRow, maxCol) + 2;
  const grid = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => ({ char: '#', userLetter: '', number: null, wordIndices: [] }))
  );

  puzzle.words.forEach((word, idx) => {
    for (let i = 0; i < word.word.length; i++) {
      const row = word.direction === 'across' ? word.row : word.row + i;
      const col = word.direction === 'across' ? word.col + i : word.col;
      const cell = grid[row][col];
      if (cell.char === '#') {
        grid[row][col] = {
          char: word.word[i].toUpperCase(),
          userLetter: '',
          number: i === 0 ? idx + 1 : null,
          wordIndices: [idx],
        };
      } else {
        grid[row][col] = {
          ...cell,
          char: word.word[i].toUpperCase(),
          wordIndices: [...(cell.wordIndices || []), idx],
        };
      }
    }
  });

  return grid;
}

const CrosswordGrid = ({ puzzle, onComplete, onScoreUpdate, hintsUsed, onUseHint }) => {
  const [grid, setGrid] = useState(() => buildGrid(puzzle));
  const [activeCell, setActiveCell] = useState(null);
  const [direction, setDirection] = useState('across');
  const [completedWords, setCompletedWords] = useState(new Set());
  const [revealedCells, setRevealedCells] = useState(new Set());

  useEffect(() => {
    setGrid(buildGrid(puzzle));
    setActiveCell(null);
    setDirection('across');
    setCompletedWords(new Set());
    setRevealedCells(new Set());
  }, [puzzle]);

  const getWordCells = useCallback((word) => {
    const cells = [];
    for (let i = 0; i < word.word.length; i++) {
      if (word.direction === 'across') {
        cells.push({ row: word.row, col: word.col + i });
      } else {
        cells.push({ row: word.row + i, col: word.col });
      }
    }
    return cells;
  }, []);

  const handleCellClick = useCallback((row, col) => {
    if (grid[row][col].char === '#') return;
    if (activeCell && activeCell.row === row && activeCell.col === col) {
      setDirection(d => d === 'across' ? 'down' : 'across');
    } else {
      setActiveCell({ row, col });
    }
  }, [activeCell, grid]);

  const getNextCell = useCallback((row, col, dir) => {
    if (dir === 'across') {
      for (let c = col + 1; c < grid[0].length; c++) {
        if (grid[row][c].char !== '#') return { row, col: c };
      }
      for (let c = 0; c < grid[0].length; c++) {
        if (grid[row][c].char !== '#') return { row, col: c };
      }
    } else {
      for (let r = row + 1; r < grid.length; r++) {
        if (grid[r][col].char !== '#') return { row: r, col };
      }
      for (let r = 0; r < grid.length; r++) {
        if (grid[r][col].char !== '#') return { row: r, col };
      }
    }
    return null;
  }, [grid]);

  const handleKeyDown = useCallback((e) => {
    if (!activeCell) return;
    const key = e.key.toUpperCase();
    if ((key >= 'A' && key <= 'Z') && key.length === 1) {
      e.preventDefault();
      const newGrid = grid.map(r => r.map(c => ({ ...c })));
      newGrid[activeCell.row][activeCell.col].userLetter = key;
      setGrid(newGrid);
      const next = getNextCell(activeCell.row, activeCell.col, direction);
      if (next) setActiveCell(next);
    } else if (e.key === 'Backspace') {
      e.preventDefault();
      const newGrid = grid.map(r => r.map(c => ({ ...c })));
      newGrid[activeCell.row][activeCell.col].userLetter = '';
      setGrid(newGrid);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      setDirection(d => d === 'across' ? 'down' : 'across');
    }
  }, [activeCell, grid, direction, getNextCell]);

  useEffect(() => {
    const hasAnyLetter = grid.some(row => row.some(c => c.userLetter && c.userLetter !== ''));
    if (!hasAnyLetter) return;
    const timer = setTimeout(() => {
      let correct = 0;
      const total = puzzle.words.length;
      const newCompleted = new Set();
      puzzle.words.forEach((word, idx) => {
        const cells = getWordCells(word);
        const wordCompleted = cells.every(({ row, col }) => {
          const cell = grid[row][col];
          return cell.userLetter && cell.userLetter.toUpperCase() === cell.char;
        });
        if (wordCompleted) newCompleted.add(idx);
      });
      setCompletedWords(newCompleted);
      correct = newCompleted.size;
      if (onScoreUpdate) onScoreUpdate(correct, total);
      if (correct === total && onComplete) onComplete();
    }, 400);
    return () => clearTimeout(timer);
  }, [grid, puzzle.words, getWordCells, onComplete, onScoreUpdate]);

  useEffect(() => {
    if (hintsUsed === 0) return;
    setGrid(prev => prev.map(r => r.map(c => ({ ...c }))));
  }, [hintsUsed]);

  const revealHint = useCallback((wordIdx) => {
    const word = puzzle.words[wordIdx];
    if (!word || completedWords.has(wordIdx)) return;
    const cells = getWordCells(word);
    const unrevealed = cells.find(({ row, col }) => {
      const cell = grid[row][col];
      return !cell.userLetter || cell.userLetter.toUpperCase() !== cell.char;
    });
    if (unrevealed) {
      setRevealedCells(prev => {
        const next = new Set(prev);
        next.add(`${unrevealed.row}-${unrevealed.col}`);
        return next;
      });
      setGrid(prev => {
        const newGrid = prev.map(r => r.map(c => ({ ...c })));
        newGrid[unrevealed.row][unrevealed.col].userLetter = newGrid[unrevealed.row][unrevealed.col].char;
        return newGrid;
      });
      if (onUseHint) onUseHint();
    }
  }, [puzzle.words, completedWords, getWordCells, grid, onUseHint]);

  return (
    <div tabIndex={0} onKeyDown={handleKeyDown} className="outline-none focus:outline-none">
      <div className="grid gap-[2px] mx-auto" style={{ width: 'min(380px, 85vw)', gridTemplateColumns: `repeat(${grid[0].length}, 1fr)` }}>
        {grid.map((row, r) => row.map((cell, c) => {
          const isActive = activeCell && activeCell.row === r && activeCell.col === c;
          const isRevealed = revealedCells.has(`${r}-${c}`);
          const isRelatedToActive = (() => {
            if (!activeCell) return false;
            if (direction === 'across') return r === activeCell.row;
            return c === activeCell.col;
          })() && cell.char !== '#' &&
            (r !== activeCell.row || c !== activeCell.col);
          const isPartOfCompleted = cell.wordIndices && cell.wordIndices.some(idx => completedWords.has(idx));

          if (cell.char === '#') {
            return <div key={`${r}-${c}`} className="bg-gray-900/40 rounded-sm" style={{ aspectRatio: '1' }} />;
          }

          const displayChar = isRevealed ? cell.char : (cell.userLetter || '');

          return (
            <div
              key={`${r}-${c}`}
              onClick={() => handleCellClick(r, c)}
              className={`relative flex items-center justify-center text-base sm:text-lg font-bold rounded-sm cursor-pointer transition-all select-none
                ${isActive ? 'ring-2 ring-primary-400 bg-primary-500/25 z-10 scale-110 shadow-lg' : ''}
                ${isRelatedToActive ? 'bg-primary-500/10' : ''}
                ${isPartOfCompleted ? 'text-green-400' : cell.userLetter ? 'text-[var(--text-primary)]' : ''}
                ${!cell.userLetter && !isRevealed ? 'text-transparent' : ''}
                bg-[var(--bg-secondary)] hover:bg-primary-500/15`}
              style={{ minWidth: '30px', minHeight: '30px', aspectRatio: '1' }}
            >
              <span className={!cell.userLetter && !isRevealed ? 'opacity-0' : ''}>{displayChar || '_'}</span>
              {cell.number && (
                <span className="absolute top-[1px] left-[2px] text-[8px] leading-none text-[var(--text-secondary)] font-normal pointer-events-none">{cell.number}</span>
              )}
              </div>
          );
        }))}
      </div>
      <p className="text-center mt-2 text-[10px] text-[var(--text-secondary)]">Click cell & type. Click again to switch ↕↔. Tab to toggle.</p>
    </div>
  );
};

export default CrosswordGrid;