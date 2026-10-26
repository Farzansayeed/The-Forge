import type { Resource } from './types';

/**
 * The resource canon (CURRICULUM.md).
 * Every stage references these by id — one place to verify URLs.
 */
export const RESOURCES = {
  // ── Books ──
  king: {
    id: 'king',
    label: 'K.N. King — C Programming: A Modern Approach, 2e',
    url: 'https://knking.com/books/c2',
    kind: 'book',
    note: 'primary C book',
  },
  knr: {
    id: 'knr',
    label: 'Kernighan & Ritchie — The C Programming Language, 2e',
    url: 'https://en.wikipedia.org/wiki/The_C_Programming_Language',
    kind: 'book',
    note: 'idiom + terseness',
  },
  csapp: {
    id: 'csapp',
    label: "Bryant & O'Hallaron — Computer Systems: A Programmer's Perspective, 3e",
    url: 'https://csapp.cs.cmu.edu/',
    kind: 'book',
    note: 'the memory book',
  },
  seacord: {
    id: 'seacord',
    label: 'Robert Seacord — Effective C',
    url: 'https://nostarch.com/effectivec',
    kind: 'book',
    note: 'modern secure C',
  },
  gustedt: {
    id: 'gustedt',
    label: 'Jens Gustedt — Modern C (free PDF)',
    url: 'https://gustedt.gitlabpages.inria.fr/modern-c/',
    kind: 'book',
    note: 'free, current',
  },
  beejC: {
    id: 'beejC',
    label: "Beej's Guide to C Programming (free)",
    url: 'https://beej.us/guide/bgc/',
    kind: 'book',
    note: 'free companion',
  },
  weiss: {
    id: 'weiss',
    label: 'Mark Allen Weiss — Data Structures & Algorithm Analysis in C, 2e',
    url: 'https://www.pearson.com/en-us/subject-catalog/p/data-structures-and-algorithm-analysis-in-c/P200000003461',
    kind: 'book',
    note: 'DSA taught in C',
  },
  skiena: {
    id: 'skiena',
    label: 'Steven Skiena — The Algorithm Design Manual, 3e',
    url: 'https://www.algorist.com/',
    kind: 'book',
    note: 'how to actually solve',
  },
  clrs: {
    id: 'clrs',
    label: 'Cormen et al. — Introduction to Algorithms, 4e',
    url: 'https://mitpress.mit.edu/9780262046305/introduction-to-algorithms/',
    kind: 'book',
    note: 'the reference',
  },
  erickson: {
    id: 'erickson',
    label: 'Jeff Erickson — Algorithms (free PDF)',
    url: 'http://jeffe.cs.illinois.edu/teaching/algorithms/',
    kind: 'book',
    note: 'rigorous + free',
  },
  ctci: {
    id: 'ctci',
    label: 'Gayle Laakmann McDowell — Cracking the Coding Interview, 6e',
    url: 'https://www.crackingthecodinginterview.com/',
    kind: 'book',
    note: 'interview bible',
  },
  epi: {
    id: 'epi',
    label: 'Aziz et al. — Elements of Programming Interviews (C++ variant)',
    url: 'https://elementsofprogramminginterviews.com/',
    kind: 'book',
    note: 'C-close drills',
  },

  // ── Video spine ──
  cs50: {
    id: 'cs50',
    label: 'CS50x — Harvard (weeks 1–5)',
    url: 'https://cs50.harvard.edu/x/',
    kind: 'video',
  },
  mycodeschool: {
    id: 'mycodeschool',
    label: 'mycodeschool (pointers, lists, sorting)',
    url: 'https://www.youtube.com/@mycodeschool',
    kind: 'video',
  },
  abdulBari: {
    id: 'abdulBari',
    label: 'Abdul Bari — algorithms',
    url: 'https://www.youtube.com/@abdul_bari',
    kind: 'video',
  },
  williamFiset: {
    id: 'williamFiset',
    label: 'William Fiset — DSA + graph theory',
    url: 'https://www.youtube.com/@WilliamFiset-videos',
    kind: 'video',
  },
  jacobSorber: {
    id: 'jacobSorber',
    label: 'Jacob Sorber — systems C',
    url: 'https://www.youtube.com/@jacobgsorber',
    kind: 'video',
  },
  neetcode: {
    id: 'neetcode',
    label: 'NeetCode — pattern walkthroughs + 150',
    url: 'https://neetcode.io/roadmap',
    kind: 'video',
  },

  // ── Visualization ("watch it move") ──
  pythonTutor: {
    id: 'pythonTutor',
    label: 'Python Tutor — step-through C memory diagrams',
    url: 'https://pythontutor.com/c.html',
    kind: 'viz',
    note: 'THE pointer teacher',
  },
  visualgo: {
    id: 'visualgo',
    label: 'VisuAlgo — animated DSA suite',
    url: 'https://visualgo.net/en',
    kind: 'viz',
  },
  galles: {
    id: 'galles',
    label: 'USF/CS1332 — Galles interactive DS animations',
    url: 'https://csvistool.com/',
    kind: 'viz',
  },
  algoViz: {
    id: 'algoViz',
    label: 'Algorithm Visualizer — code + animation',
    url: 'https://algorithm-visualizer.org/',
    kind: 'viz',
  },
  godbolt: {
    id: 'godbolt',
    label: 'Compiler Explorer — your C as assembly',
    url: 'https://godbolt.org/',
    kind: 'viz',
  },

  // ── Practice platforms ──
  hackerrank: {
    id: 'hackerrank',
    label: 'HackerRank — C track',
    url: 'https://www.hackerrank.com/domains/c',
    kind: 'practice',
    note: 'Phases 1–2 reps',
  },
  exercism: {
    id: 'exercism',
    label: 'Exercism — C track (free human mentoring)',
    url: 'https://exercism.org/tracks/c',
    kind: 'practice',
    note: 'real code review',
  },
  codechef: {
    id: 'codechef',
    label: 'CodeChef — course + weekly Starters (Div 3/4)',
    url: 'https://www.codechef.com/',
    kind: 'practice',
    note: 'contest cadence',
  },
  leetcode: {
    id: 'leetcode',
    label: 'LeetCode — interview problems',
    url: 'https://leetcode.com/problemset/',
    kind: 'practice',
    note: 'Phases 4–5',
  },

  // ── Sites / references ──
  cppreference: {
    id: 'cppreference',
    label: 'cppreference — C library reference',
    url: 'https://en.cppreference.com/w/c',
    kind: 'site',
  },
  cpAlgorithms: {
    id: 'cpAlgorithms',
    label: 'cp-algorithms.com',
    url: 'https://cp-algorithms.com/',
    kind: 'site',
  },
  tiH: {
    id: 'tiH',
    label: 'Tech Interview Handbook (free)',
    url: 'https://www.techinterviewhandbook.org/',
    kind: 'site',
  },
  gdb: {
    id: 'gdb',
    label: 'GDB — the GNU debugger',
    url: 'https://www.sourceware.org/gdb/documentation/',
    kind: 'tool',
  },
  valgrind: {
    id: 'valgrind',
    label: 'Valgrind — memory error detector',
    url: 'https://valgrind.org/docs/manual/quick-start.html',
    kind: 'tool',
  },
  asan: {
    id: 'asan',
    label: 'AddressSanitizer — -fsanitize=address',
    url: 'https://github.com/google/sanitizers/wiki/AddressSanitizer',
    kind: 'tool',
  },
  msys2: {
    id: 'msys2',
    label: 'MSYS2 — MinGW-w64 toolchain',
    url: 'https://www.msys2.org/',
    kind: 'tool',
  },
  vscodeCpp: {
    id: 'vscodeCpp',
    label: 'VS Code + C/C++ extension setup',
    url: 'https://code.visualstudio.com/docs/cpp/config-mingw',
    kind: 'tool',
  },
  make: {
    id: 'make',
    label: 'GNU Make manual',
    url: 'https://www.gnu.org/software/make/manual/',
    kind: 'tool',
  },
} as const satisfies Record<string, Resource>;

export type ResourceId = keyof typeof RESOURCES;

export function res(id: ResourceId, noteOverride?: string): Resource {
  const r = RESOURCES[id];
  return noteOverride ? { ...r, note: noteOverride } : r;
}
