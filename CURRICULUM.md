# CURRICULUM.md — C × DSA Roadmap v3, Stage-by-Stage Specification

**Status:** Frozen at v3.0.0 — this prose spec is what `src/data/curriculum/` encodes; the typed data is canonical and CI-validated. Kept as the authoring reference for future stages.
**Audience:** Total beginner (very low C experience). Every stage defines its own vocabulary.
**Pacing reference:** ~3 h weekdays, ~6–7 h Sunday. Day budgets assume that rhythm.

**Per-stage template** (used for all 19 stages below):

- **You can…** — observable outcomes; the stage is "done" only when all are true
- **Path** — numbered topics in exact learning order; each topic = concept + primary resource (chapter/lecture) + viz companion + Torture Test ID(s)
- **Drills** — classic exercises, in order of difficulty
- **Flagship build** — the one substantial artifact that proves the stage
- **Torture Tests** — quiz blueprint: [format · what it targets · count]
- **Traps** — the mistakes beginners here actually make (feeds quiz variants + spaced review)
- **Boss gate** — what the phase-exit quiz covers (Phase-final stages only)
- **Days** — budget at default pace

Resource shorthand — **K** = King, *C Programming: A Modern Approach* 2e · **K&R** = Kernighan & Ritchie 2e · **CS:APP** = Bryant & O'Hallaron 3e · **W** = Weiss, *DS & Algorithm Analysis in C* 2e · **ADM** = Skiena, *Algorithm Design Manual* 3e · **CLRS** 4e · **CTCI** = Cracking the Coding Interview 6e · **EPI** = Elements of Programming Interviews (C++ variant) · **Erickson** = *Algorithms* free PDF · **MS** = mycodeschool · **AB** = Abdul Bari · **WF** = William Fiset · **JS** = Jacob Sorber · **PT** = Python Tutor · **VA** = VisuAlgo · **GT** = Galles/csvistool · **AV** = Algorithm Visualizer · **GE** = godbolt Compiler Explorer · **Exercism** = Exercism C track · **HR** = HackerRank C track · **CC** = CodeChef.

---

## PHASE 0 — LAUNCHPAD

### S00 · Toolchain & Workflow — *Days: 3*

**You can…** compile and run a C program entirely from the terminal; explain what preprocessing, compiling, assembling and linking each did; set a compiler breakpoint and step through code; run valgrind on a program and read its output; make and push a git commit.

**Path**
1. Install MSYS2/MinGW-w64 (Windows) or build-essential (Linux); verify `gcc --version` — *CS50 Week 0 notes; CC free C course setup unit*
2. VS Code + C/C++ extension + Code Runner alternative: terminal workflow only — *nothing to read, just do it*
3. Anatomy of a C program; the compile pipeline `hello.c → .i → .s → .o → a.out` — *K ch. 1–2 (skim), JS "Compiling your C code" video; **GE**: open hello.c in godbolt, watch the x86-64 appear; flag -O0 vs -O2*
4. Warnings are truth: compile with `-Wall -Wextra -Werror` forever — *JS warning hygiene video*
5. Terminal survival: cd, ls, mkdir, tab-completion, ↑ history — *in-build interactive terminal cheatsheet*
6. gdb first contact: break, run, next, print, step — *JS "Debugging with gdb"; trap: breakpoint before run*
7. valgrind first contact: run a leaky program, read "definitely lost" — *JS memory video*
8. git: init, add, commit, push, .gitignore — *in-build 10-minute guide*
9. Make first contact: a 5-line Makefile that builds one file — *full treatment in S05; here it's just "make works"*

**Drills:** Hello World from terminal · compile the same file with -O0/-O2 and diff godbolt output · introduce a deliberate warning, read it, fix it · set a gdb breakpoint and inspect one variable · leak 10 bytes on purpose, confirm with valgrind, fix, confirm clean.

**Flagship build:** **First Blood** — a greeting program that asks name + age and prints a formatted banner. Trivial output, but: compiled via Makefile, zero warnings, gdb-walked once, valgrind-clean, committed to git.

**Torture Tests:** [MCQ ×6 pipeline stages & flags] · [predict-output ×2 (printf, warnings)] · [tool-ordering ×2 (put gdb/valgrind/make steps in order)]

**Traps:** IDE-button dependence ("what's a terminal?") · ignoring warnings because "it ran anyway" · valgrind on Windows confusion (plan includes WSL/wine guidance) · never committing until "finished".

**Quizzes:** TT-S00-A, TT-S00-B (8 items).

---

## PHASE 1 — C FLUENCY · *Boss gate after S03*

### S01 · Fundamentals I — *Days: 6*

**You can…** declare and initialize every basic type; predict printf/scanf behavior incl. format-specifier mismatches; write branches and all three loop forms without syntax slips; trace any small program's output by hand.

**Path**
1. Variables, types, sizes (`int`, `float`, `double`, `char`), overflow first contact — *K ch. 7 (types), MS basics; **PT**: run a variables snippet step-by-step*
2. printf/scanf and format specifiers — *K ch. 3; trap: `%d` for double*
3. Operators: arithmetic, relational, logical, bitwise (recognition only — depth in S06), assignment vs equality — *K ch. 4–5*
4. Control flow: if/else, switch, break/continue — *K ch. 5*
5. Loops: for/while/do-while + off-by-one discipline — *K ch. 6; **VA/AV**: loop-trace animations*
6. Type conversions, casts, integer division surprise — *K ch. 7; trap: 5/2==2*

**Drills:** menu calculator · multiplication table · number-guessing game (attempt counter) · sum/reverse digits · FizzBuzz variant with a twist · **HR** first 10 C problems · **Exercism** first 3 easy exercises (submit for mentoring).

**Flagship build:** **Number Forge** — a console toolkit: primes, factorial, digit sums, tables, all behind a menu loop, input-validated (rejects garbage with scanf checks).

**Torture Tests:** [find-the-bug ×5: scanf &, =/==, missing break, infinite loop, specifier mismatch] · [predict-output ×6] · [fill-blank ×3: loop bounds, conditions] · [MCQ ×4]

**Traps:** `=` in conditions · uninitialized variables (garbage values — show, don't tell) · `scanf("%d", x)` missing `&` · float equality comparisons · integer division assumptions.

**Quizzes:** TT-S01-A/B/C (16 items).

### S02 · Fundamentals II — *Days: 6*

**You can…** decompose any small problem into functions; write recursive functions with correct base cases; manipulate 1D/2D arrays and strings with loops, no library calls.

**Path**
1. Functions: prototypes, parameters, return, scope, lifetime — *K ch. 9; trap: passing copies*
2. Recursion I: factorial, Fibonacci, the call stack picture — *K ch. 9; **PT**: watch stack frames stack up — this is the recursion aha-moment*
3. 1D arrays + passing arrays to functions (decay preview) — *K ch. 8*
4. 2D arrays, nested loops, matrix ops — *K ch. 8*
5. Strings as char[]: null terminator, manual strlen/strcpy/strcmp — *K ch. 13; trap: no '\0' → reads past the end*
6. string.h library + const-correctness intro — *K ch. 13*
7. Recursion II: power(x,n) both ways, is-palindrome — *MS recursion video*

**Drills:** reverse array & string manually · min/max in one pass · matrix add/multiply · palindrome checker · binary search on a sorted array (first contact) · **Exercism** next 3 · **HR** arrays & strings section.

**Flagship build:** **Text Lab** — a string-analysis tool: word count, palindrome detection, case conversion, vowel census, custom replace — all string ops hand-rolled (string.h only for verification asserts).

**Torture Tests:** [find-the-bug ×5: missing base case, array bounds, terminator overwrite, wrong param order, off-by-one] · [predict-output ×6: recursion traces, char arithmetic] · [fill-blank ×3: base cases, loop bounds] · [MCQ ×4]

**Traps:** forgetting the null terminator · recursion without base case → segfault · swapping via assignment confusion · passing arrays expecting copies · `char*` vs `char[]` in parameters.

**Quizzes:** TT-S02-A/B/C (16 items).

### S03 · The Memory Model ★ — *Days: 8 — the stage the whole roadmap bends around*

**You can…** draw the memory diagram (stack/heap/data/text) for any small program; explain exactly what `int *p = &x; *p = 5;` does at the machine level; do pointer arithmetic with confidence; implement swap/strlen via pointers; allocate, resize and free heap memory with zero leaks; recognize and name the four UB families that bite beginners.

**Path**
1. Memory layout: text, data, bss, stack, heap; addresses everywhere — *CS:APP ch. 3 (selected sections), K ch. 11; **PT**: C memory diagrams — THE visual, run every snippet here*
2. `&` and `*`: address-of and dereference; NULL — *K ch. 11; **GT** pointer animation*
3. Pointer arithmetic: p+1 moves by sizeof(*p); arrays decay — *K ch. 11–12; **GE**: look at the assembly for p[i] — it's *(p+i)*
4. Pointers & functions: pass-by-reference, return pointers safely — *K ch. 11; MS pointers series*
5. Pointers to pointers; pointers & const (3 combinations) — *K ch. 11, 17*
6. Function pointers: syntax, callbacks, qsort first contact — *K ch. 17*
7. Stack vs heap; malloc/calloc/realloc/free; ownership rules — *K ch. 16; CS:APP ch. 9.9 (allocator concept); **PT** heap-box visual*
8. Leaks, dangling pointers, double free, use-after-free — *JS memory-management videos; valgrind every drill from now on*
9. UB taxonomy for mortals: out-of-bounds, uninitialized reads, bad derefs, aliasing surprises — *in-build reference card; compile with `-fsanitize=address` and watch it catch you*
10. Dynamic arrays: grow-by-double pattern (the ammo for S08)

**Drills:** swap via pointers · max via pointer walk · hand-rolled strlen/strcpy (pointer-only) · dynamic int array with amortized doubling, stress-tested 10⁶ elements, valgrind-clean · N×M matrix via malloc of pointers + contiguous block variant · function-pointer-driven mini calculator.

**Flagship build:** **Arena & Vector** — a growable generic vector (void* + element size, memcpy) and a bump allocator (arena) with reset; a stress-test harness proving: zero leaks (valgrind), zero UB (ASan), O(1) amortized push.

**Torture Tests:** [find-the-bug ×6: missing free, use-after-free, double free, wrong sizeof, returning stack address, off-by-one malloc] · [predict-output ×6: pointer arithmetic, decay, ** PT-traceable traces] · [why-does-it-crash ×5: segfault causes w/ valgrind-style clues] · [fill-blank ×4: alloc/free pairs, guard conditions] · [MCQ ×5: stack vs heap, sizeof facts]

**Traps:** `int* p, q;` (q is an int) · sizeof on pointers vs arrays · freeing then using · forgetting free on realloc failure path · returning &local · thinking `p++` moves one byte.

**Quizzes:** TT-S03-A/B/C/D (24 items — largest stage).
**BOSS GATE 1 (Phase 1):** 20-item exam across S01–S03, ≥80% to unlock Phase 2 · includes 3 find-the-bug items drawn from the Traps lists and 1 live fix-the-code (leak + off-by-one in one program).

---

## PHASE 2 — SYSTEMS C · *Boss gate after S06*

### S04 · Structs & ADTs in C — *Days: 6*

**You can…** design struct-based types with clean APIs; use `->`, typedef, nested structs; implement an opaque type behind an interface; explain why self-referential structs make linked structures possible.

**Path**
1. struct basics: declaration, init, access, copy semantics — *K ch. 16*
2. typedef, nested structs, arrays of structs — *K ch. 16*
3. struct pointers + `->`; passing structs vs pointers (size matters) — *K ch. 16; **PT**: struct memory layout*
4. Self-referential structs — *K ch. 17 intro; the key to everything in Phase 3 — **PT**: draw the boxes and arrows*
5. Enums, unions, bit fields — *K ch. 16*
6. Design: header/impl split, opaque pointers, init/destroy pairs — *JS "Write good C libraries" videos; pattern used in every later build*
7. **File I/O & persistence**: fopen modes, text vs binary, fread/fwrite of struct records, fseek/ftell, why binary files aren't portable (padding) — *K ch. 22; **PT**-style trace of record buffers; this is where S04's structs become real databases*
8. Reading/writing CSV and line-based formats safely (fgets discipline, parsing) — *K ch. 13 + 22 combined*

**Drills:** student database (add/search/display, **persisted to file and reloaded**) · struct-based stack (array inside) · bank-account module with .h/.c split and opaque handle · enum-driven state machine · CSV export/import of the student DB · binary-dump a struct and hex-inspect the padding.

**Flagship build:** **Library System** — books + members + issue/return, each entity an ADT behind .h/.c with init/destroy, all valgrind-clean.

**Torture Tests:** [find-the-bug ×5: missing ->, returning stack struct pointer, shallow-copy aliasing, missing fclose, fread without checking return] · [predict-output ×4] · [MCQ ×4: copy vs pointer semantics, enum sizes, text vs binary modes] · [fill-blank ×3: self-referential declarations]

**Traps:** copying structs thinking it's a reference · freeing a struct but not its heap members (leak-in-a-struct) · self-reference without pointer (illegal) · union member misreads · forgetting fclose / never checking fopen returned NULL · assuming binary files are portable across compilers (struct padding).

**Quizzes:** TT-S04-A/B (14 items).

### S05 · Preprocessor & Builds — *Days: 5*

**You can…** structure a multi-file C project with proper headers and include guards; explain what #define/#include/#ifdef actually do to the text; write a Makefile with correct targets and dependencies; write and run your own assert-based tests.

**Path**
1. What the preprocessor really does (text substitution!) — *K ch. 14; **GE**: compile with -E and read the expanded output*
2. #define vs const vs enum; macros with args + their footguns — *K ch. 14; trap: MAX(a,b) with side effects*
3. Headers, include guards, extern, static — *K ch. 15; JS multi-file videos*
4. **Command-line programs**: argc/argv, argument parsing, exit codes — *K ch. 13.6 + K&R §5.10; every later build is a CLI — taught here once, used everywhere*
4. Make: targets, prerequisites, recipes, variables, clean — *in-build Makefile guide (best-of web tutorial verified at build)*
6. Static libraries: ar, rcs, linking order — *JS video*
7. **The C error-handling idiom**: return codes, errno, perror/strerror, fail-loud conventions — *K ch. (library sections) + in-build pattern card; used in every drill from here on*
8. Testing in C: assert, a tiny test harness, CI-lite script — *in-build pattern (test file per module, Makefile test target)*

**Drills:** split Text Lab into modules · convert Text Lab and Library System to accept argc/argv (filenames, flags) · macro MAX with side-effect bug demo · Makefile that builds the Library System · write 10 assert-tests for S03's vector · add errno/perror handling to every file operation in S04's builds · break the build on purpose: missing guard, wrong link order, undefined reference — diagnose each.

**Flagship build:** **Contacts CLI** — add/search/delete/list contacts, files: contact.c/h, store.c/h, main.c, tests; Makefile with debug/release targets; persists to disk; zero-warning build.

**Torture Tests:** [find-the-bug ×5: missing guard, macro parenthesization, header cycle, dependency omission, unchecked argv bounds] · [MCQ ×6: static/extern, include order, linking, exit codes, errno] · [ordering ×2: build steps] · [predict-output ×2: macro expansion]

**Traps:** double inclusion (no guards) · macros without parentheses around params and whole expr · forgetting to rebuild (stale .o) · defining functions in headers (multiple definition).

**Quizzes:** TT-S05-A/B (14 items).

### S06 · Bits & Low-Level Craft — *Days: 4*

**You can…** read/write any bit pattern confidently; explain two's complement and IEEE-754 at a beginner's depth; deploy the classic bit tricks from memory; compute with fixed-width types.

**Path**
1. Binary/hex fluency, fixed-width ints (`uint32_t` etc.), endianness — *K ch. 7 revisit + CS:APP ch. 2 (selected); **GE**: inspect memory bytes*
2. Two's complement, sign extension, overflow (UB!) — *CS:APP ch. 2; MS number systems video*
3. Bitwise operators & masks: set/clear/toggle/check — *K ch. 5 (bitwise section) deep dive*
4. Classic tricks: parity, power-of-2 check, single-bit isolation, swap-XOR (and why you shouldn't), count set bits — *in-build trick deck, one viz each*
5. IEEE-754 first contact: float precision surprise, 0.1+0.2 — *CS:APP ch. 2.4 skim; **GE**: float vs double output*
6. Bit fields & flag sets in structs — *K ch. 16*

**Drills:** implement set/clear/toggle/test API · count set bits 3 ways · detect power of two · swap nibbles · represent a tiny bitmap (8×8) as bits and render it · predict-and-verify float precision experiments.

**Flagship build:** **BitBoard** — an 8×8 pixel board engine where every cell is one bit: full set/clear/flip/query API, ASCII renderer, pattern loader (Glider), flood-fill on bitmaps. Zero non-bit storage for cells.

**Torture Tests:** [predict-output ×6: masks, shifts, sign] · [fill-blank ×4: mask expressions] · [MCQ ×5: endianness, two's complement, float precision] · [find-the-bug ×3: shift UB, signed shift traps]

**Traps:** shifting by ≥ width (UB) · signed right-shift assumptions · confusing `&`/`&&` · mask off-by-one · expecting float equality.

**Quizzes:** TT-S06-A/B (14 items).
**BOSS GATE 2 (Phase 2):** 20-item exam across S04–S06, ≥80% · includes 1 fix-the-code (broken macro + leaky struct API).

---

## PHASE 3 — DATA STRUCTURES · *Boss gate after S11*

### S07 · Complexity Toolkit — *Days: 3*

**You can…** Big-O/Θ/Ω any loop or recursion you meet; explain amortized (why doubling is O(1) amortized); reason with log n intuition ("halving"); trace recurrence costs on paper.

**Path**
1. Asymptotic notation + the common classes — *Erickson ch. 1 (first half) or AB complexity videos; W ch. 2*
2. **Space complexity + time-vs-space tradeoffs** (memo table vs recursion, hash vs array) — *W ch. 2; roadmap.sh cross-ref: time-vs-space-complexity node*
2. Analyzing loops: nested, dependent, early exit — *in-build drill generator (trace this loop, pick its cost)*
3. Recurrence relations for recursion — *AB recurrence videos; Erickson ch. 1*
4. Amortized analysis: dynamic arrays doubling — *W ch. 2 (amortized section); revisit S03 vector*
5. log/interview math: 2ⁿ↔n tables, series 1+2+…+n — *in-build math-for-CS primer (zero prerequisites, teaches the exponents/logs it uses)*
6. **VA**: sorting race — watch O(n²) vs O(n log n) with your eyes — *intuition before formulas*

**Drills:** Big-O classify 15 given loops · trace 5 recursions' cost on paper · prove-to-yourself doubling amortization with a counter experiment · estimate: n=10⁶ — which algorithms finish in a second?

**Flagship build:** **Complexity Bench** — benchmark harness timing the same task under naive vs optimized implementations (linear vs binary search, O(n²) vs O(n log n) dedup), printing measured-vs-theoretical tables.

**Torture Tests:** [match ×4: code↔complexity] · [predict ×4: which finishes?] · [MCQ ×6: amortized, classes, growth] 

**Traps:** claiming O(1) for hidden O(n) · ignoring constants entirely (n vs 100n matters at small n) · confusing worst/average case · log base confusion.

**Quizzes:** TT-S07-A/B (12 items).

### S08 · Linear DS I — *Days: 7*

**You can…** implement dynamic array, singly/doubly/circular linked lists, stack and queue from scratch — array AND linked variants — and recite each operation's complexity from understanding, not memory.

**Path**
1. Dynamic array (rebuild S03 vector consciously): push/pop/insert/remove — *W ch. 3.1–3.4; **VA/GT**: array animations*
2. Singly linked list: insert head/tail/middle, delete, traverse, search, reverse — *W ch. 3.2; MS linked list series (the best there is); **PT**: node-and-arrow diagrams live; **GT** list animations*
3. **Fast & slow pointers as a named pattern** (Floyd cycle detection, middle-in-one-pass, happy number) — *CTCI/NeetCode pattern card; roadmap.sh cross-ref: fast-and-slow-pointers*
3. Doubly + circular variants — *W ch. 3.2*
4. Stack: array + linked implementations; push/pop/peek — *W ch. 3.6; **VA** stack viz*
5. Queue + circular queue (the modulo trick) + deque — *W ch. 3.4; **VA** queue viz*
6. Applications: balanced parentheses (stack), infix→postfix (stack), job queue simulation — *classic drills below*

**Drills:** reverse list (iterative + recursive) · detect cycle (Floyd) · middle in one pass · parentheses checker · infix→postfix converter · circular-queue wraparound tests · implement all of it twice (array & linked).

**Flagship build:** **ListForge** — a header-only-ish linear-DS library (vector, slist, dlist, stack, queue, deque) with a single test harness per structure — every operation unit-tested, valgrind-clean, complexity documented in the header.

**Torture Tests:** [find-the-bug ×6: lost head pointer, broken links on delete, queue full/empty ambiguity, missing free of node data] · [predict-output ×5: traversal orders after ops] · [fill-blank ×4: pointer rewiring lines] · [MCQ ×5: complexities, implementation choices]

**Traps:** updating head incorrectly on delete-first · memory leak per deleted node · circular queue full-vs-empty confusion · tail pointer forgotten (O(n) inserts forever) · reversing with recursion losing nodes.

**Quizzes:** TT-S08-A/B/C/D (22 items).

### S09 · Linear DS II — *Days: 6*

**You can…** build a hash table from scratch (both collision strategies) and explain every design decision; choose hashing vs balanced structures; manipulate C strings safely at an advanced level; run simple pattern matching.

**Path**
1. Hash concept: O(1) average, load factor, why it works — *W ch. 5.1–5.2; **VA** hashing viz*
2. Hash functions for ints and strings (FNV/djb2) — *W ch. 5.2; in-build playground: watch collision counts change*
3. Collision strategy A: separate chaining — *W ch. 5.3; **GT** hash animations*
4. Collision strategy B: open addressing (linear/quadratic probing) — *W ch. 5.3; tombstones*
5. Rehashing & growth — *W ch. 5.3; revisit amortized analysis*
6. Strings II: tokenizing (strtok safety), building your own split/join, string allocation discipline — *K ch. 13 advanced sections*
7. Pattern matching: naive substring search; KMP concept (implement optional) — *Erickson/W; **VA** string viz*

**Drills:** word-frequency counter over a text file (your hash map) · spell-checker mini (dictionary load, lookup timing) · two-sum with hash (O(n²)→O(n) rewrite) · naive vs (optional) KMP benchmark.

**Flagship build:** **HashKV** — a string→string hash table with chaining, load-factor-driven rehash, stats mode (collisions per bucket, probe counts), and a CLI: put/get/del/stats. Benchmark: 10⁶ ops timed.

**Torture Tests:** [find-the-bug ×5: unbounded probe loops, missing tombstone handling, bad hash (all-same-bucket), leak on overwrite] · [predict ×4: probe sequences] · [MCQ ×5: chaining vs probing tradeoffs, load factor] · [fill-blank ×3: hash function pieces, rehash trigger]

**Traps:** hash function returning constant-ish values · forgetting to rehash → deadlock by load factor 1 · tombstone breaks "empty means stop" logic · leaking value strings on delete.

**Quizzes:** TT-S09-A/B/C (16 items).

### S10 · Non-Linear DS — *Days: 7*

**You can…** implement binary tree traversals, a complete BST with delete, a binary heap with both heapify directions, and a trie; explain when a heap beats a hash; sketch AVL rotations conceptually.

**Path**
1. Binary tree anatomy + the three DFS traversals (recursive, then iterative with your stack) — *W ch. 4.1; MS trees; **VA/GT** tree animations; **PT** recursion visuals*
2. Level-order traversal using your own S08 queue (BFS shape) — *W ch. 4.1*
3. BST: insert, search, min/max, successor — *W ch. 4.3; **VA** BST viz with your own inputs*
4. BST delete (the three cases) — *W ch. 4.3; the classic interview minefield — drill it 3×*
5. Heaps: array representation, heapify-up/down, priority queue — *W ch. 6; **VA** heap animations*
6. Heapsort — *W ch. 6.4*
7. Trie: insert/search/prefix — *ADM war stories; **GT** trie animation*
8. Balanced trees concept: why balance, single/double rotation sketches (AVL) — *W ch. 4.4 (concept level); **VA** AVL animations — implement only insert-rebalance (optional stretch)*

**Drills:** all traversals both ways · validate-BST · kth-smallest in BST · build heap from array then heapsort · level-order printing per line · trie autocomplete toy · BST delete every case ×3.

**Flagship build:** **WordIndex** — file indexer: reads text files, builds a BST (key: word) of occurrence lists + a heap-based top-K frequent-words query, trie-powered prefix completion. Fully valgrind-clean with a stress test on a big text.

**Torture Tests:** [find-the-bug ×6: wrong delete case, broken heapify loop, infinite recursion on duplicate insert, lost subtree on unlink] · [predict-output ×5: traversal outputs from diagrams] · [draw/trace ×4: give final tree after sequence] · [MCQ ×5: when-which-structure]

**Traps:** deleting a node with two children incorrectly · heapify loop indices · duplicate handling unstated · iterating a tree while mutating · forgetting to free subtrees recursively (leak forests).

**Quizzes:** TT-S10-A/B/C/D (22 items).

### S11 · Graphs — *Days: 6*

**You can…** represent graphs both ways and pick per-scenario; implement BFS and DFS from memory in three variants (queue/stack/recursion); run topo sort and cycle detection; implement Dijkstra; explain union-find and MST conceptually.

**Path**
1. Graph anatomy + representations: matrix vs list — *W ch. 9.1; **VA** graph viz*
2. BFS — *W ch. 9.3; WF graph series (best-in-class); **VA** BFS animation*
3. DFS: explicit stack + recursive — *W ch. 9.3; WF*
4. Applications: connected components, cycle detection (directed/undirected) — *WF*
5. Topological sort (Kahn's) — *W ch. 9.5; WF*
6. Weighted graphs → Dijkstra with your S10 heap — *W ch. 9.3; AB Dijkstra video; **VA** Dijkstra step-through*
7. **Bellman-Ford (concept level: negative weights, when Dijkstra can't)** — *W ch. 9.3 concept section; AB video; roadmap.sh cross-ref: bellman-ford*
7. Union-Find: find/union, path compression idea — *W ch. 9 (ADT section); WF union-find*
8. MST concept: Kruskal (with your union-find) + Prim sketch — *W ch. 9.5; AB; optional implement Kruskal*
9. **A\* search (optional stretch): Dijkstra + an admissible heuristic — the pathfinder upgrade** — *ADM; roadmap.sh cross-ref: a-algorithm*

**Drills:** build both representations of the same graph · BFS/DFS printouts · topo-sort a course-prerequisite graph · detect cycles both kinds · maze pathfinder prototype · Dijkstra on a weighted grid · **island-count on a binary grid (connected components in disguise — the classic interview opener)** · stretch: upgrade the pathfinder to A* and measure nodes-explored vs Dijkstra.

**Flagship build:** **Pathfinder** — grid maze loader → adjacency structure → BFS shortest-path + Dijkstra weighted variant → animated ASCII output of visited order and final path. Compare BFS vs Dijkstra paths on weighted mazes.

**Torture Tests:** [find-the-bug ×5: missing visited → infinite loop, queue/stack misuse, stale distances in Dijkstra] · [trace ×5: give traversal order from adjacency list] · [MCQ ×6: BFS vs DFS, representation choice, complexity] · [fill-blank ×3: visited handling, edge relaxation]

**Traps:** forgetting the visited set · marking visited at dequeue (BFS duplicates) · Dijkstra without a decrease-key strategy (fine — document why) · directed/undirected confusion · adjacency-list edge-count mistakes.

**Quizzes:** TT-S11-A/B/C/D (20 items).
**BOSS GATE 3 (Phase 3):** 25-item exam across S07–S11, ≥80% · heavy on trace-this-structure and when-which-DS; includes 2 fix-the-code (BST delete bug, Dijkstra visited bug).

---

## PHASE 4 — ALGORITHMS & INTERVIEW CORE · *Boss gate after S15*

### S12 · Sorting & Searching — *Days: 6*

**You can…** implement all six classic sorts from scratch and state each one's complexity/stability/in-place-ness from understanding; binary search in the modern robust form (half-open intervals) and its three famous variants; deploy two pointers and sliding windows.

**Path**
1. Bubble/selection/insertion — *W ch. 7.1–7.2; MS sorting series; **VA** race view*
2. Merge sort — *W ch. 7.4; recursion pays off — **PT** merge recursion visual*
3. Quick sort + partition schemes + pitfalls — *W ch. 7.7; MS*
4. **Quickselect (kth smallest) — partition without sorting** — *ADM; roadmap.sh cross-ref: kth-element*
4. Heapsort recap; counting sort concept — *W ch. 7 (non-comparison section)*
5. Binary search: canonical template, first/last occurrence, rotated-array search — *W ch. 7 + CTCI; **AV** binary search animation; the "mids and bounds" trap deck*
6. Two pointers & sliding window patterns — *CTCI/NeetCode pattern; in-build pattern cards*

**Drills:** implement all sorts + instrument comparisons · sort stability demo (structs with ties) · binary search variants ×3 each · two-sum sorted (two pointers) · longest substring without repeats (window) · **LeetCode** first 10 easy (search/sort tagged).

**Flagship build:** **SortLab** — all sorts behind one interface with a comparison-counting harness; exports a table (n vs comparisons/swaps per sort) and an ASCII bar race; stability and adaptivity demonstrated with data.

**Torture Tests:** [find-the-bug ×6: partition off-by-one, mid overflow ((lo+hi)/2!), bound drift, missing base case] · [trace ×5: array state after pass k] · [MCQ ×6: complexity/stability matrix] · [fill-blank ×4: bounds, window updates]

**Traps:** `(lo+hi)/2` overflow · infinite loop on duplicate-heavy quicksort partitions · off-by-one in half-open bounds · unstable assumptions · window shrink forgotten.

**Quizzes:** TT-S12-A/B/C/D (20 items).

### S13 · Recursion & Backtracking — *Days: 5*

**You can…** turn any "explore all options" problem into backtracking with correct pruning; trace and bound the search tree; implement subsets/permutations/N-Queens/Sudoku from patterns, not memorization.

**Path**
1. Recursion III: choose/explore/unchoose — the backtracking skeleton — *Erickson ch. on backtracking/recursion; **PT** tree-of-calls visuals*
2. Subsets & combinations — *in-build pattern card + CTCI*
3. Permutations — *CTCI; **AV** permutation tree animation*
4. Pruning: feasibility + bounding — why N-Queens finishes at all — *ADM; in-build pruning visual*
5. N-Queens — *classic; **VA** N-Queens animation*
6. Sudoku solver — *classic; constraint checks as prune*
7. Grid backtracking: rat-in-maze, path collecting — *transfers directly to S11-style pathfinding*

**Drills:** generate all subsets/permutations of small n with printouts · N-Queens with step-count comparison pruned/unpruned · Sudoku with difficulty-ranked boards · count paths in grid with obstacles.

**Flagship build:** **Backtrack Bench** — one CLI running N-Queens (n=4…12), Sudoku (3 graded boards), and maze pathfinding, each reporting nodes explored with/without pruning — makes pruning's value measurable.

**Torture Tests:** [find-the-bug ×5: missing un-choose, wrong prune condition, mutate-while-iterate] · [trace ×4: search tree counts] · [MCQ ×4: complexity of factorial vs exponential patterns] · [fill-blank ×3: choose/unchoose pairs]

**Traps:** forgetting to undo state (un-choose) · pruning condition inverted · returning a collected list while still mutating it · base-case placement errors.

**Quizzes:** TT-S13-A/B (14 items).

### S14 · Dynamic Programming — *Days: 6*

**You can…** decide "is this DP?" from problem shape; convert recursion→memo→table consciously; implement the core five families; reconstruct (not just count) optimal answers.

**Path**
1. Overlapping subproblems + optimal substructure; memoization intro — *Erickson ch. 2 (DP intro); AB DP videos; **PT** memo visual*
2. Fibonacci ladder: naive → memo → table → two variables (complexity collapse demo) — *the on-ramp everyone needs*
3. Grid paths (min path sum, unique paths) — *CTCI/NeetCode; **AV** grid DP animation*
4. Knapsack 0/1 — *Erickson; W ch. (Knapsack section); **VA** knapsack table animation*
5. Longest Common Subsequence — *Erickson; reconstruct the string, not just the length*
6. Longest Increasing Subsequence — *O(n²) then concept of O(n log n)*
7. Coin change (count + min) — *interview staple*
8. When NOT to DP (greedy works) — *bridge to S15*

**Drills:** climb stairs · house robber · coin change ×2 forms · knapsack with item reconstruction · LCS with actual sequence printout · LIS ×2 · memo-vs-table benchmark (same problem, timing + memory table).

**Flagship build:** **DPLab** — five solvers (knapsack, LCS, LIS, coin change, grid paths) each exposing: naive, memoized, tabulated variants + a table-tracer that prints the DP table filling step by step in ASCII. The tracer *is* the product.

**Torture Tests:** [find-the-bug ×5: wrong recurrence cell dependency, memo not consulted, off-by-one table dims] · [trace ×5: fill this DP row] · [MCQ ×5: identify the DP family from the problem statement] · [fill-blank ×4: recurrence lines]

**Traps:** table indices off by one (0-index vs 1-index semantics) · memo keyed wrongly · forgetting reconstruction pointer · choosing DP where greedy suffices (works but overkill) · recursion depth stack overflow — convert to table.

**Quizzes:** TT-S14-A/B/C (16 items).

### S15 · Greedy & Heaps in Anger — *Days: 4*

**You can…** recognize greedy-solvable problems and defend the choice; implement interval scheduling, Huffman sketch, and the PQ-driven patterns; justify greedy vs DP on a given problem.

**Path**
1. Greedy strategy + exchange-argument intuition (stay honest — greedy proof-lite) — *Erickson (greedy intro); ADM*
2. Interval scheduling & interval covering — *ADM; in-build sort-order playground (which order is optimal? test all!)*
3. Huffman coding sketch with your heap — *W/CLRS (Huffman section); **VA** Huffman animation*
4. PQ patterns: top-K, merge-K, two-heap median — *NeetCode pattern cards*
5. Greedy vs DP shootout — *in-build decision flowchart + drills*

**Drills:** meeting rooms / max overlapping intervals · fractional knapsack · Huffman encode/decode toy · top-K frequent via heap · streaming median (two heaps) · greedy-fail counterexample collection (when greedy breaks).

**Flagship build:** **GreedyLab** — interval tooling + Huffman codec (real file compress/decompress with your S10 heap) + two-heap median stream; each ships with its greedy-vs-DP comparison note.

**Torture Tests:** [find-the-bug ×4: wrong sort key, PQ ordering inverted] · [trace ×4: heap states, interval selections] · [MCQ ×5: greedy vs DP calls] · [predict ×2: Huffman tree shapes]

**Traps:** sorting by wrong endpoint · forgetting that greedy needs *a* reason (collect the counterexamples) · min-heap vs max-heap sign flips · two-heap invariant lost after removals.

**Quizzes:** TT-S15-A/B (12 items).
**BOSS GATE 4 (Phase 4):** 25-item exam S12–S15, ≥80% · pattern-recognition heavy; 1 fix-the-code (sliding window) + 1 trace-the-DP-table.

---

## PHASE 5 — INTERVIEW ENDGAME

### S16 · Interview Patterns Sprint — *Days: 10*

**You can…** map any unseen problem to a pattern within minutes, think out loud coherently, and pass mock interviews on the core 15 patterns; maintain a personal problem journal with revisit dates.

**Path**
1. The interview operating system: clarify → brute force → optimize → code → test — *Tech Interview Handbook (full read); CTCI ch. 7*
2. The 15+ core patterns mapped to problems — *NeetCode 150 roadmap as the problem source; in-build pattern cards with C-first templates; CTCI as drill source; EPI for depth. Pattern list explicitly includes: arrays/hashing, two pointers, **fast & slow pointers**, sliding window, **cyclic sort**, **merge intervals**, **kth-element/quickselect**, stack, binary search, linked list, trees, heaps, **two heaps**, backtracking, graphs, 1-D DP, greedy, **divide & conquer** (roadmap.sh cross-ref alignment)*
3. Language: C for interviews (what to do when C fights you — static buffers, helper structs) + when C++ is the pragmatic call — *in-build guidance*
4. Complexity-first communication: stating/applying Big-O out loud — *TIH*
5. Mock protocol: weekly timed mocks from day 3 — *in-build mock scripts; peer/mentor option via Exercism community*
6. Journal & spaced repetition: every solved problem gets a revisit date — *built into the app's review queue*

**Drills:** 60-problem cadence: NeetCode 150 subset (arrays/hashing → two pointers → stack → binary search → sliding window → linked list → trees → heaps → backtracking → graphs → 1-D DP → intervals → greedy), C-first; **CC Starters** Div 3/4 weekly (start contest cadence); **LC** in C by default.

**Flagship build:** **The Journal** — 60+ solved problems with your own written pattern notes + mistake tags (feeds spaced review); a personal "patterns cheat sheet" in your own words, generated from the journal.

**Torture Tests:** [pattern-ID MCQ ×10: problem statement → pattern] · [find-the-bug ×5: real interview-style buggy submissions] · [timed predict ×3] · [mock ×2: recorded self-mock checklists]

**Traps:** pattern memorization without re-derivation · silent coding (no thinking-out-loud practice) · C string/edge-case fumbles under time pressure · skipping the journal (the #1 regret).

**Quizzes:** TT-S16-A/B/C (18 items + 2 mock checklists).

### S17 · Capstone Portfolio Build — *Days: 8*

**You can…** ship one substantial, tested, documented system that survives a code review; explain every design decision in its README.

**Path**
1. Choose one: (a) **arena allocator library** with benchmark suite · (b) **mini key-value store** (your HashKV grown up: persistence + BST index) · (c) **graph pathfinder toolkit** (Pathfinder generalized: multiple algorithms + real map data) — *in-build project briefs with acceptance criteria*
2. Spec first: acceptance criteria, milestone split — *in-build project brief template*
3. Build in milestones with tests each — *S05 harness discipline*
4. Polish pass: profiling (gprof/perf intro), clang-format + clang-tidy for house style, README with design decisions, clean `make`, CI-style test script
5. Code review: self-review checklist + Exercism/mentor/peer review — *TIH*
6. Publish: repo with impeccable README + demo GIF

**Flagship build:** IS the stage. Acceptance: zero leaks under stress, zero warnings under `-Wall -Wextra -Werror -pedantic`, test suite green, README that explains *why*.

**Torture Tests:** [self-review checklist ×1] · [design-decision quiz ×5: justify your own choices — auto-generated from your README claims]

**Traps:** scope explosion (the brief caps it) · no tests until the end · README written last-minute (write it first, revisit at the end).

**Quizzes:** TT-S17-A (8 items).

### S18 · Maintain the Blade — *Days: ongoing*

**You can…** retain everything: spaced reviews keep old quizzes alive, weekly contests keep speed honest, and the habit system keeps the streak meaningful.

**Path**
1. Spaced review (SM-2-lite): the app resurfaces your weakest quizzes weekly — *built in*
2. **CC Starters** every week (Div 3/4 → climb) + occasional LC contests — *the cadence*
3. Re-implement one DS per month from scratch, timed — *the blade stays sharp*
4. Read one ADM "war story" per week — *keeps design intuition growing*
5. Streak health: use insurance tokens deliberately; tribunal reviews monthly, not just weekly

**Flagship build:** none — this stage is the metronome. Its "artifact" is a 90-day review heatmap you're proud of.

**Torture Tests:** weekly review quiz auto-composed from your spaced-review queue (dynamic).

**Advanced Horizons** (what exists beyond this roadmap — mapped to roadmap.sh's advanced branch; none are beginner requirements): Fenwick & segment trees (range queries) · B-trees & skip lists (databases) · suffix trees/arrays (string algorithms) · randomized algorithms · indexing/ISAM (DB internals) · **multithreading → the S19 concurrency & sockets extension**. When you finish S18, pick ONE horizon and go deep.

**Traps:** contest tilt (chasing rating over learning) · review decay ("I'll remember it") · habit collapse after the roadmap "ends" — that's what this stage exists to prevent.

**Quizzes:** dynamic (review-queue driven).

---

## Appendix A — Quiz inventory & volume

| Phase | Stages | Torture Tests | Boss Gates |
|---|---|---|---|
| 0 | S00 | 8 | — |
| 1 | S01–S03 | 56 | 20 |
| 2 | S04–S06 | 42 | 20 |
| 3 | S07–S11 | 92 | 25 |
| 4 | S12–S15 | 62 | 25 |
| 5 | S16–S18 | 26 + dynamic | — |
| **Total** | 19 | **≈286 authored items** | 4 exams (90 items) |

Formats across the inventory: find-the-bug (≈22%) · predict-output/trace (≈24%) · fill-the-blank (≈16%) · MCQ/match (≈24%) · why-crash (≈7%) · fix-the-code live (≈7% + boss exams). Every item links: the trap it targets, the micro-resource for failure, and its spaced-review schedule.

## Appendix B — Content acceptance criteria

A stage is "content-complete" when: every topic has concept+resource+viz links that resolve; drills compile and were actually run once by the author; flagship build has acceptance criteria met; quiz items pass the "explain the why in one sentence" test; Traps list ≥3 real beginner mistakes with variants authored for spaced review.
