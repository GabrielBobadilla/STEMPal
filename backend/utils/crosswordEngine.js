const GRID_SIZE = 25;
const EMPTY = null;

function createEmptyGrid(size = GRID_SIZE) {
  return Array.from({ length: size }, () =>
    Array.from({ length: size }, () => ({ char: null, number: null, acrossWord: null, downWord: null }))
  );
}

function canPlaceWord(grid, word, row, col, direction) {
  const len = word.length;
  const size = grid.length;

  if (direction === 'across') {
    if (col + len > size) return false;
    if (row < 0 || row >= size) return false;

    if (col > 0 && grid[row][col - 1].char !== null) return false;
    if (col + len < size && grid[row][col + len].char !== null) return false;

    for (let i = 0; i < len; i++) {
      const c = grid[row][col + i];
      if (c.char !== null && c.char !== word[i]) return false;

      if (c.char === null) {
        if (row > 0 && grid[row - 1][col + i].char !== null && grid[row - 1][col + i].acrossWord === null) return false;
        if (row < size - 1 && grid[row + 1][col + i].char !== null && grid[row + 1][col + i].acrossWord === null) return false;
      }
    }
  } else {
    if (row + len > size) return false;
    if (col < 0 || col >= size) return false;

    if (row > 0 && grid[row - 1][col].char !== null) return false;
    if (row + len < size && grid[row + len][col].char !== null) return false;

    for (let i = 0; i < len; i++) {
      const c = grid[row + i][col];
      if (c.char !== null && c.char !== word[i]) return false;

      if (c.char === null) {
        if (col > 0 && grid[row + i][col - 1].char !== null && grid[row + i][col - 1].downWord === null) return false;
        if (col < size - 1 && grid[row + i][col + 1].char !== null && grid[row + i][col + 1].downWord === null) return false;
      }
    }
  }

  return true;
}

function placeWord(grid, word, row, col, direction, wordIndex) {
  const cells = [];
  for (let i = 0; i < word.length; i++) {
    const r = direction === 'across' ? row : row + i;
    const c = direction === 'across' ? col + i : col;
    grid[r][c].char = word[i];
    if (direction === 'across') grid[r][c].acrossWord = wordIndex;
    else grid[r][c].downWord = wordIndex;
    cells.push({ row: r, col: c });
  }
  return cells;
}

function findIntersections(grid, word, row, col, direction) {
  const intersections = [];
  for (let i = 0; i < word.length; i++) {
    const r = direction === 'across' ? row : row + i;
    const c = direction === 'across' ? col + i : col;
    if (grid[r][c].char === word[i]) {
      intersections.push(i);
    }
  }
  return intersections;
}

function scorePlacement(grid, word, row, col, direction) {
  let score = 0;
  let intersections = 0;
  let adjacencies = 0;
  const size = grid.length;

  for (let i = 0; i < word.length; i++) {
    const r = direction === 'across' ? row : row + i;
    const c = direction === 'across' ? col + i : col;

    if (grid[r][c].char === word[i]) {
      intersections++;
      score += 10;
    }

    const perpDir = direction === 'across' ? 'down' : 'across';
    const pr = perpDir === 'across' ? r : r;
    const pc = perpDir === 'across' ? c : c;
    if (perpDir === 'across') {
      if (c > 0 && grid[r][c - 1].char !== null) adjacencies++;
      if (c < size - 1 && grid[r][c + 1].char !== null) adjacencies++;
    } else {
      if (r > 0 && grid[r - 1][c].char !== null) adjacencies++;
      if (r < size - 1 && grid[r + 1][c].char !== null) adjacencies++;
    }
  }

  if (intersections === 0 && hasWordsOnGrid(grid)) return -1;
  score -= adjacencies * 2;

  const centerR = direction === 'across' ? row : row + word.length / 2;
  const centerC = direction === 'across' ? col + word.length / 2 : col;
  const distFromCenter = Math.abs(centerR - size / 2) + Math.abs(centerC - size / 2);
  score -= distFromCenter;

  return score;
}

function hasWordsOnGrid(grid) {
  return grid.some(row => row.some(cell => cell.char !== null));
}

function findBestPlacement(grid, word) {
  let bestScore = -Infinity;
  let bestPlacements = [];
  const directions = ['across', 'down'];

  for (const direction of directions) {
    for (let row = 0; row < grid.length; row++) {
      for (let col = 0; col < grid[0].length; col++) {
        if (canPlaceWord(grid, word, row, col, direction)) {
          const score = scorePlacement(grid, word, row, col, direction);
          if (score > bestScore) {
            bestScore = score;
            bestPlacements = [{ row, col, direction }];
          } else if (score === bestScore && score > -1) {
            bestPlacements.push({ row, col, direction });
          }
        }
      }
    }
  }

  if (bestPlacements.length === 0 || bestScore <= -1) return null;
  return bestPlacements[Math.floor(Math.random() * bestPlacements.length)];
}

function getTrimBounds(grid) {
  let minRow = grid.length, maxRow = 0, minCol = grid[0].length, maxCol = 0;
  let hasContent = false;
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[0].length; c++) {
      if (grid[r][c].char !== null) {
        hasContent = true;
        minRow = Math.min(minRow, r);
        maxRow = Math.max(maxRow, r);
        minCol = Math.min(minCol, c);
        maxCol = Math.max(maxCol, c);
      }
    }
  }
  if (!hasContent) return { minRow: 0, minCol: 0, maxRow: grid.length - 1, maxCol: grid[0].length - 1 };
  const pad = 1;
  return {
    minRow: Math.max(0, minRow - pad),
    minCol: Math.max(0, minCol - pad),
    maxRow: Math.min(grid.length - 1, maxRow + pad),
    maxCol: Math.min(grid[0].length - 1, maxCol + pad),
  };
}

function trimGrid(grid) {
  const { minRow, minCol, maxRow, maxCol } = getTrimBounds(grid);
  return grid.slice(minRow, maxRow + 1).map(row => row.slice(minCol, maxCol + 1));
}

function assignNumbers(grid) {
  let num = 1;
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[0].length; c++) {
      const cell = grid[r][c];
      if (cell.char === null) continue;
      const startsAcross = cell.acrossWord !== null && (c === 0 || grid[r][c - 1].acrossWord === null);
      const startsDown = cell.downWord !== null && (r === 0 || grid[r - 1][c].downWord === null);
      if (startsAcross || startsDown) {
        cell.number = num++;
      }
    }
  }
}

function buildCrossword(wordEntries, maxRetries = 5) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const grid = createEmptyGrid();
    const placed = [];
    const shuffled = [...wordEntries].sort(() => Math.random() - 0.5);

    const first = shuffled[0];
    const firstWord = first.answer.toUpperCase().replace(/[^A-Z]/g, '');
    const startRow = Math.floor(GRID_SIZE / 2);
    const startCol = Math.floor((GRID_SIZE - firstWord.length) / 2);
    placeWord(grid, firstWord, startRow, startCol, 'across', 0);
    placed.push({ ...first, word: firstWord, row: startRow, col: startCol, direction: 'across', index: 0 });

    for (let i = 1; i < shuffled.length; i++) {
      const entry = shuffled[i];
      const word = entry.answer.toUpperCase().replace(/[^A-Z]/g, '');
      if (word.length < 2) continue;

      const placement = findBestPlacement(grid, word);
      if (placement) {
        placeWord(grid, word, placement.row, placement.col, placement.direction, placed.length);
        placed.push({ ...entry, word, row: placement.row, col: placement.col, direction: placement.direction, index: placed.length });
      }
    }

    if (placed.length >= Math.min(4, wordEntries.length)) {
      const bounds = getTrimBounds(grid);
      const trimmed = trimGrid(grid);
      assignNumbers(trimmed);

      const offR = bounds.minRow;
      const offC = bounds.minCol;

      const numberMap = {};
      for (let r = 0; r < trimmed.length; r++) {
        for (let c = 0; c < trimmed[0].length; c++) {
          if (trimmed[r][c].number !== null && trimmed[r][c].char !== null) {
            numberMap[`${r}-${c}`] = trimmed[r][c].number;
          }
        }
      }

      const across = [];
      const down = [];

      for (const p of placed) {
        const adjRow = p.row - offR;
        const adjCol = p.col - offC;
        const num = numberMap[`${adjRow}-${adjCol}`] || (p.index + 1);

        const entry = {
          number: num,
          answer: p.word,
          clue: p.clue,
          row: adjRow,
          col: adjCol,
          direction: p.direction,
        };

        if (p.direction === 'across') across.push(entry);
        else down.push(entry);
      }

      across.sort((a, b) => a.number - b.number);
      down.sort((a, b) => a.number - b.number);

      return {
        rows: trimmed.length,
        cols: trimmed[0].length,
        grid: trimmed.map(row => row.map(cell => ({
          char: cell.char,
          number: cell.number,
          acrossWord: cell.acrossWord,
          downWord: cell.downWord,
        }))),
        across,
        down,
        totalWords: placed.length,
      };
    }
  }

  const grid = createEmptyGrid(8);
  const fallback = wordEntries.slice(0, 5);
  const across = [];
  for (let i = 0; i < fallback.length; i++) {
    const word = fallback[i].answer.toUpperCase().replace(/[^A-Z]/g, '');
    const row = i;
    const col = 0;
    for (let j = 0; j < word.length && col + j < 8; j++) {
      grid[row][col + j] = { char: word[j], number: j === 0 ? i + 1 : null, acrossWord: i, downWord: null };
    }
    across.push({ number: i + 1, answer: word, clue: fallback[i].clue, row, col, direction: 'across' });
  }

  return { rows: 8, cols: 8, grid: grid.map(row => row.map(c => ({ ...c }))), across, down: [], totalWords: fallback.length };
}

function validateCrossword(crossword) {
  const { grid, across, down } = crossword;
  const issues = [];
  if (!grid || grid.length === 0) return { valid: false, issues: ['Empty grid'] };

  for (const entry of across) {
    const { answer, row, col } = entry;
    for (let i = 0; i < answer.length; i++) {
      const c = col + i;
      if (row < 0 || row >= grid.length || c < 0 || c >= grid[0].length) {
        issues.push(`Across #${entry.number}: out of bounds at position ${i}`);
        continue;
      }
      if (grid[row][c].char !== answer[i]) {
        issues.push(`Across #${entry.number}: mismatch at position ${i}`);
      }
    }
  }

  for (const entry of down) {
    const { answer, row, col } = entry;
    for (let i = 0; i < answer.length; i++) {
      const r = row + i;
      if (r < 0 || r >= grid.length || col < 0 || col >= grid[0].length) {
        issues.push(`Down #${entry.number}: out of bounds at position ${i}`);
        continue;
      }
      if (grid[r][col].char !== answer[i]) {
        issues.push(`Down #${entry.number}: mismatch at position ${i}`);
      }
    }
  }

  return { valid: issues.length === 0, issues };
}

module.exports = { buildCrossword, validateCrossword, createEmptyGrid, placeWord, canPlaceWord };
