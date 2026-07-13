import React, { useState, useCallback, useEffect, useRef } from 'react';

const CrosswordGrid = ({
  puzzle,
  onCellChange,
  onWordCompleted,
  onHintReveal,
  revealedCells,
  completedWords,
  activeCellOverride,
  onCellClick: onCellClickProp,
  direction: directionProp,
  onDirectionChange,
  readOnly = false,
  cellHighlights,
  userId,
}) => {
  const [grid, setGrid] = useState([]);
  const [activeCell, setActiveCell] = useState(null);
  const [direction, setDirection] = useState('across');
  const [revealed, setRevealed] = useState(new Set());
  const [completed, setCompleted] = useState(new Set());
  const gridRef = useRef(null);

  useEffect(() => {
    if (!puzzle || !puzzle.grid) return;
    const newGrid = puzzle.grid.map(row =>
      row.map(cell => ({
        ...cell,
        userLetter: '',
      }))
    );
    setGrid(newGrid);
    setActiveCell(null);
    setRevealed(new Set());
    setCompleted(new Set());
  }, [puzzle]);

  useEffect(() => {
    if (revealedCells) {
      setRevealed(new Set(revealedCells));
    }
  }, [revealedCells]);

  useEffect(() => {
    if (completedWords) {
      setCompleted(new Set(completedWords));
    }
  }, [completedWords]);

  useEffect(() => {
    if (activeCellOverride) {
      setActiveCell(activeCellOverride);
    }
  }, [activeCellOverride]);

  const dir = directionProp || direction;

  const getWordCells = useCallback((entry) => {
    const cells = [];
    if (!entry) return cells;
    for (let i = 0; i < entry.answer.length; i++) {
      const r = entry.direction === 'across' ? entry.row : entry.row + i;
      const c = entry.direction === 'across' ? entry.col + i : entry.col;
      cells.push({ row: r, col: c });
    }
    return cells;
  }, []);

  const getActiveEntries = useCallback(() => {
    if (!activeCell || !puzzle) return { across: null, down: null };
    const { row, col } = activeCell;

    let acrossEntry = null;
    let downEntry = null;

    for (const entry of puzzle.across || []) {
      const cells = getWordCells(entry);
      if (cells.some(c => c.row === row && c.col === col)) {
        acrossEntry = entry;
        break;
      }
    }

    for (const entry of puzzle.down || []) {
      const cells = getWordCells(entry);
      if (cells.some(c => c.row === row && c.col === col)) {
        downEntry = entry;
        break;
      }
    }

    return { acrossEntry, downEntry };
  }, [activeCell, puzzle, getWordCells]);

  const isCellInActiveWord = useCallback((row, col) => {
    if (!activeCell) return false;
    const { acrossEntry, downEntry } = getActiveEntries();
    const activeEntry = dir === 'across' ? acrossEntry : downEntry;
    if (!activeEntry) {
      const otherEntry = dir === 'across' ? downEntry : acrossEntry;
      if (!otherEntry) return false;
      const cells = getWordCells(otherEntry);
      return cells.some(c => c.row === row && c.col === col);
    }
    const cells = getWordCells(activeEntry);
    return cells.some(c => c.row === row && c.col === col);
  }, [activeCell, dir, getActiveEntries, getWordCells]);

  const handleCellClick = useCallback((row, col) => {
    if (readOnly) return;
    if (grid[row][col].char === null) return;

    if (activeCell && activeCell.row === row && activeCell.col === col) {
      const newDir = dir === 'across' ? 'down' : 'across';
      setDirection(newDir);
      if (onDirectionChange) onDirectionChange(newDir);
    } else {
      setActiveCell({ row, col });
      if (onCellClickProp) onCellClickProp({ row, col });
    }
  }, [activeCell, grid, dir, readOnly, onCellClickProp, onDirectionChange]);

  const getNextCell = useCallback((row, col, d) => {
    if (!grid.length) return null;
    const rows = grid.length;
    const cols = grid[0].length;

    if (d === 'across') {
      for (let c = col + 1; c < cols; c++) {
        if (grid[row][c].char !== null) return { row, col: c };
      }
    } else {
      for (let r = row + 1; r < rows; r++) {
        if (grid[r][col].char !== null) return { row: r, col };
      }
    }
    return null;
  }, [grid]);

  const getPrevCell = useCallback((row, col, d) => {
    if (!grid.length) return null;

    if (d === 'across') {
      for (let c = col - 1; c >= 0; c--) {
        if (grid[row][c].char !== null) return { row, col: c };
      }
    } else {
      for (let r = row - 1; r >= 0; r--) {
        if (grid[r][col].char !== null) return { row: r, col };
      }
    }
    return null;
  }, [grid]);

  const checkWordCompletion = useCallback((newGrid, row, col) => {
    if (!puzzle) return;

    const checkEntry = (entry) => {
      if (!entry) return false;
      for (let i = 0; i < entry.answer.length; i++) {
        const r = entry.direction === 'across' ? entry.row : entry.row + i;
        const c = entry.direction === 'across' ? entry.col + i : entry.col;
        const cell = newGrid[r]?.[c];
        if (!cell || !cell.userLetter || cell.userLetter.toUpperCase() !== entry.answer[i]) {
          return false;
        }
      }
      return true;
    };

    const { acrossEntry, downEntry } = (() => {
      let ae = null, de = null;
      for (const e of puzzle.across || []) {
        const cells = getWordCells(e);
        if (cells.some(cc => cc.row === row && cc.col === col)) { ae = e; break; }
      }
      for (const e of puzzle.down || []) {
        const cells = getWordCells(e);
        if (cells.some(cc => cc.row === row && cc.col === col)) { de = e; break; }
      }
      return { acrossEntry: ae, downEntry: de };
    })();

    if (acrossEntry && checkEntry(acrossEntry)) {
      const key = `across-${acrossEntry.number}`;
      setCompleted(prev => {
        const next = new Set(prev);
        if (!next.has(key)) {
          next.add(key);
          if (onWordCompleted) onWordCompleted(acrossEntry);
          return next;
        }
        return prev;
      });
    }

    if (downEntry && checkEntry(downEntry)) {
      const key = `down-${downEntry.number}`;
      setCompleted(prev => {
        const next = new Set(prev);
        if (!next.has(key)) {
          next.add(key);
          if (onWordCompleted) onWordCompleted(downEntry);
          return next;
        }
        return prev;
      });
    }
  }, [puzzle, getWordCells, onWordCompleted]);

  const handleKeyDown = useCallback((e) => {
    if (!activeCell || readOnly) return;
    const { row, col } = activeCell;

    const key = e.key.toUpperCase();
    if (key.length === 1 && key >= 'A' && key <= 'Z') {
      e.preventDefault();
      setGrid(prev => {
        const newGrid = prev.map(r => r.map(c => ({ ...c })));
        newGrid[row][col].userLetter = key;
        if (onCellChange) onCellChange(row, col, key);
        checkWordCompletion(newGrid, row, col);
        return newGrid;
      });
      const next = getNextCell(row, col, dir);
      if (next) {
        setActiveCell(next);
        if (onCellClickProp) onCellClickProp(next);
      }
    } else if (e.key === 'Backspace') {
      e.preventDefault();
      const currentLetter = grid[row]?.[col]?.userLetter;
      if (currentLetter) {
        setGrid(prev => {
          const newGrid = prev.map(r => r.map(c => ({ ...c })));
          newGrid[row][col].userLetter = '';
          if (onCellChange) onCellChange(row, col, '');
          return newGrid;
        });
      } else {
        const prev = getPrevCell(row, col, dir);
        if (prev) {
          setActiveCell(prev);
          if (onCellClickProp) onCellClickProp(prev);
          setGrid(g => {
            const newGrid = g.map(r => r.map(c => ({ ...c })));
            newGrid[prev.row][prev.col].userLetter = '';
            if (onCellChange) onCellChange(prev.row, prev.col, '');
            return newGrid;
          });
        }
      }
    } else if (e.key === 'Delete') {
      e.preventDefault();
      setGrid(prev => {
        const newGrid = prev.map(r => r.map(c => ({ ...c })));
        newGrid[row][col].userLetter = '';
        if (onCellChange) onCellChange(row, col, '');
        return newGrid;
      });
    } else if (e.key === 'Tab') {
      e.preventDefault();
      e.shiftKey ? null : null;
      const newDir = dir === 'across' ? 'down' : 'across';
      setDirection(newDir);
      if (onDirectionChange) onDirectionChange(newDir);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      const next = getNextCell(row, col, 'across');
      if (next) { setActiveCell(next); setDirection('across'); if (onDirectionChange) onDirectionChange('across'); }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prev = getPrevCell(row, col, 'across');
      if (prev) { setActiveCell(prev); setDirection('across'); if (onDirectionChange) onDirectionChange('across'); }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = getNextCell(row, col, 'down');
      if (next) { setActiveCell(next); setDirection('down'); if (onDirectionChange) onDirectionChange('down'); }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = getPrevCell(row, col, 'down');
      if (prev) { setActiveCell(prev); setDirection('down'); if (onDirectionChange) onDirectionChange('down'); }
    }
  }, [activeCell, grid, dir, readOnly, getNextCell, getPrevCell, onCellChange, onCellClickProp, onDirectionChange, checkWordCompletion]);

  useEffect(() => {
    const el = gridRef.current;
    if (el) {
      el.focus();
    }
  }, []);

  if (!grid || grid.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500" />
      </div>
    );
  }

  const rows = grid.length;
  const cols = grid[0].length;
  const cellSize = Math.min(Math.floor(380 / Math.max(rows, cols)), 40);

  return (
    <div
      ref={gridRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="outline-none focus:outline-none mx-auto"
      style={{ width: 'fit-content' }}
    >
      <div
        className="inline-grid gap-[1px] rounded-xl overflow-hidden shadow-lg"
        style={{
          gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
          background: 'var(--glass-border)',
        }}
      >
        {grid.map((row, r) =>
          row.map((cell, c) => {
            const isActive = activeCell && activeCell.row === r && activeCell.col === c;
            const isInWord = isCellInActiveWord(r, c);
            const isRevealed = revealed.has(`${r}-${c}`);
            const wordKey = (() => {
              if (cell.acrossWord !== null) return `across-${cell.acrossWord}`;
              if (cell.downWord !== null) return `down-${cell.downWord}`;
              return null;
            })();
            const isCompletedWord = completed.has(`across-${puzzle?.across?.find(a => a.row === r && a.col === c)?.number}`) ||
              completed.has(`down-${puzzle?.down?.find(d => d.row === r && d.col === c)?.number}`);

            const highlightKey = `${r}-${c}`;
            const highlight = cellHighlights?.[highlightKey];

            if (cell.char === null) {
              return (
                <div
                  key={`${r}-${c}`}
                  className="bg-[var(--bg-primary)]"
                  style={{ width: cellSize, height: cellSize }}
                />
              );
            }

            const displayChar = isRevealed
              ? cell.char
              : (cell.userLetter || '');

            let bgClass = 'bg-[var(--glass-bg)]';
            if (isActive) bgClass = 'bg-primary-500/30 ring-2 ring-primary-400 z-10';
            else if (isInWord) bgClass = 'bg-primary-500/10';
            else if (highlight) bgClass = 'bg-primary-500/15';

            let textClass = 'text-[var(--text-primary)]';
            if (isCompletedWord && cell.userLetter) textClass = 'text-emerald-500 font-bold';
            else if (isRevealed) textClass = 'text-amber-500';
            else if (!cell.userLetter) textClass = 'text-transparent';

            return (
              <div
                key={`${r}-${c}`}
                onClick={() => handleCellClick(r, c)}
                className={`relative flex items-center justify-center font-bold cursor-pointer transition-all duration-150 select-none ${bgClass} ${textClass} hover:brightness-110`}
                style={{
                  width: cellSize,
                  height: cellSize,
                  fontSize: Math.max(cellSize * 0.45, 12),
                }}
              >
                <span className={isActive ? 'animate-pulse' : ''}>
                  {displayChar}
                </span>
                {cell.number && (
                  <span
                    className="absolute top-[1px] left-[2px] leading-none text-[var(--text-secondary)] font-normal pointer-events-none"
                    style={{ fontSize: Math.max(cellSize * 0.22, 7) }}
                  >
                    {cell.number}
                  </span>
                )}
                {isActive && (
                  <div className="absolute inset-0 border-2 border-primary-400 rounded-sm pointer-events-none animate-pulse" />
                )}
              </div>
            );
          })
        )}
      </div>
      <p className="text-center mt-3 text-[10px] text-[var(--text-secondary)]">
        Click to type | Click again to switch direction | Tab/Arrows to navigate
      </p>
    </div>
  );
};

export default CrosswordGrid;
