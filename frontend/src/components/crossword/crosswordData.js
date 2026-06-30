const crosswordData = {
  easy: [
    {
      id: 'easy_1',
      title: 'Basic Science',
      words: [
        { word: 'ATOM', clue: 'Smallest unit of matter', row: 0, col: 0, direction: 'across' },
        { word: 'DNA', clue: 'Genetic material molecule', row: 1, col: 0, direction: 'across' },
        { word: 'CELL', clue: 'Basic unit of life', row: 2, col: 0, direction: 'across' },
      ],
    },
    {
      id: 'easy_2',
      title: 'Simple Math',
      words: [
        { word: 'SUM', clue: 'Result of addition', row: 0, col: 0, direction: 'across' },
        { word: 'PI', clue: 'Circle constant ~3.14', row: 1, col: 0, direction: 'across' },
        { word: 'DIVIDE', clue: 'Split into equal parts', row: 2, col: 0, direction: 'across' },
      ],
    },
    {
      id: 'easy_3',
      title: 'Tech Basics',
      words: [
        { word: 'CPU', clue: 'Brain of a computer', row: 0, col: 0, direction: 'across' },
        { word: 'RAM', clue: 'Temporary computer memory', row: 1, col: 0, direction: 'across' },
        { word: 'BYTE', clue: 'Unit of digital info (8 bits)', row: 2, col: 0, direction: 'across' },
      ],
    },
    {
      id: 'easy_4',
      title: 'Earth Science',
      words: [
        { word: 'SUN', clue: 'Center of our solar system', row: 0, col: 0, direction: 'across' },
        { word: 'MOON', clue: 'Earth\'s natural satellite', row: 1, col: 0, direction: 'across' },
        { word: 'STAR', clue: 'Luminous celestial body', row: 2, col: 0, direction: 'across' },
      ],
    },
    {
      id: 'easy_5',
      title: 'Simple Machines',
      words: [
        { word: 'LEVER', clue: 'Bar that pivots on a fulcrum', row: 0, col: 0, direction: 'across' },
        { word: 'PULLEY', clue: 'Wheel with a rope used to lift', row: 1, col: 0, direction: 'across' },
        { word: 'WEDGE', clue: 'Triangular tool for splitting', row: 2, col: 0, direction: 'across' },
      ],
    },
  ],
  medium: [
    {
      id: 'medium_1',
      title: 'Chemistry',
      words: [
        { word: 'PROTON', clue: 'Positively charged particle in nucleus', row: 0, col: 0, direction: 'across' },
        { word: 'ELECTRON', clue: 'Negatively charged orbiting particle', row: 1, col: 0, direction: 'across' },
        { word: 'NEUTRON', clue: 'Neutral particle in nucleus', row: 2, col: 0, direction: 'across' },
        { word: 'ISOTOPE', clue: 'Atoms with same protons, different neutrons', row: 3, col: 0, direction: 'across' },
        { word: 'ION', clue: 'Atom with net electric charge', row: 4, col: 0, direction: 'across' },
      ],
    },
    {
      id: 'medium_2',
      title: 'Physics',
      words: [
        { word: 'FORCE', clue: 'Push or pull on an object', row: 0, col: 0, direction: 'across' },
        { word: 'ENERGY', clue: 'Capacity to do work', row: 1, col: 0, direction: 'across' },
        { word: 'VELOCITY', clue: 'Speed with direction', row: 2, col: 0, direction: 'across' },
        { word: 'MOMENTUM', clue: 'Mass times velocity', row: 3, col: 0, direction: 'across' },
        { word: 'GRAVITY', clue: 'Force attracting objects to Earth', row: 4, col: 0, direction: 'across' },
      ],
    },
    {
      id: 'medium_3',
      title: 'Biology',
      words: [
        { word: 'MITOSIS', clue: 'Cell division producing two identical cells', row: 0, col: 0, direction: 'across' },
        { word: 'NUCLEUS', clue: 'Control center of a cell', row: 1, col: 0, direction: 'across' },
        { word: 'RIBOSOME', clue: 'Cellular structure for protein synthesis', row: 2, col: 0, direction: 'across' },
        { word: 'ENZYME', clue: 'Biological catalyst', row: 3, col: 0, direction: 'across' },
        { word: 'CHROMOSOME', clue: 'DNA-containing threadlike structure', row: 4, col: 0, direction: 'across' },
      ],
    },
  ],
  hard: [
    {
      id: 'hard_1',
      title: 'Advanced Physics',
      words: [
        { word: 'ENTROPY', clue: 'Measure of disorder in a system', row: 0, col: 0, direction: 'across' },
        { word: 'WAVELENGTH', clue: 'Distance between wave peaks', row: 1, col: 0, direction: 'across' },
        { word: 'FREQUENCY', clue: 'Number of wave cycles per second', row: 2, col: 0, direction: 'across' },
        { word: 'QUANTUM', clue: 'Smallest discrete unit of energy', row: 3, col: 0, direction: 'across' },
        { word: 'RELATIVITY', clue: "Einstein's theory of spacetime", row: 4, col: 0, direction: 'across' },
        { word: 'PHOTON', clue: 'Particle of light', row: 5, col: 0, direction: 'across' },
      ],
    },
    {
      id: 'hard_2',
      title: 'Advanced Math',
      words: [
        { word: 'CALCULUS', clue: 'Study of continuous change', row: 0, col: 0, direction: 'across' },
        { word: 'INTEGRAL', clue: 'Area under a curve', row: 1, col: 0, direction: 'across' },
        { word: 'DERIVATIVE', clue: 'Rate of change of a function', row: 2, col: 0, direction: 'across' },
        { word: 'ALGORITHM', clue: 'Step-by-step problem-solving procedure', row: 3, col: 0, direction: 'across' },
        { word: 'LOGARITHM', clue: 'Inverse of exponentiation', row: 4, col: 0, direction: 'across' },
        { word: 'MATRIX', clue: 'Rectangular array of numbers', row: 5, col: 0, direction: 'across' },
      ],
    },
    {
      id: 'hard_3',
      title: 'Advanced CS',
      words: [
        { word: 'RECURSION', clue: 'Function calling itself', row: 0, col: 0, direction: 'across' },
        { word: 'ENCRYPTION', clue: 'Converting data into secret code', row: 1, col: 0, direction: 'across' },
        { word: 'COMPILER', clue: 'Translates source code to machine code', row: 2, col: 0, direction: 'across' },
        { word: 'ABSTRACTION', clue: 'Hiding complex implementation details', row: 3, col: 0, direction: 'across' },
        { word: 'BINARY', clue: 'Base-2 number system (0s and 1s)', row: 4, col: 0, direction: 'across' },
        { word: 'NEURAL', clue: 'Brain-inspired computing networks', row: 5, col: 0, direction: 'across' },
      ],
    },
  ],
};

export default crosswordData;