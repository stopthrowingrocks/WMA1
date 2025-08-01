/**
 * A type for representing game positions.
 */
type Position = {
  readonly x: number
  readonly y: number
};
function eqPos(p1: Position, p2: Position): boolean {
  return p1.x === p2.x && p1.y === p2.y;
}

const floorTag = ".";
type FloorTag = typeof floorTag;

const staticEntityTags = [" ", "~", "^", "<", "v", ">", "O"] as const;
type StaticEntityTag = typeof staticEntityTags[number];
function isStaticEntityTag(s: string): s is StaticEntityTag {
  return staticEntityTags.includes(s as never);
}
type MaybeStaticEntity = {
  tag: StaticEntityTag | null
  pos: Position
}

const playerEntityTag = "@";
type PlayerEntityTag = typeof playerEntityTag;
type PlayerEntity = {
  readonly tag: PlayerEntityTag
  readonly pos: Position
};

const dynamicEntityTags = [playerEntityTag, "0"] as const;
type DynamicEntityTag = typeof dynamicEntityTags[number];
function isDynamicEntityTag(s: string): s is DynamicEntityTag {
  return dynamicEntityTags.includes(s as never);
}
type DynamicEntity = {
  readonly tag: DynamicEntityTag
  readonly pos: Position
};
type MaybeDynamicEntity = {
  readonly tag: DynamicEntityTag | null
  readonly pos: Position
};


type EntityTag = DynamicEntityTag | StaticEntityTag | FloorTag;

type GameState = {
  width: number
  height: number
  staticEntityMap: (StaticEntityTag | null)[][]
  dynamicEntityMap: (DynamicEntityTag | null)[][]
  playerEntities: PlayerEntity[]
};

function makeEmptyMap(height: number, width: number): null[][] {
  return Array(height).fill(undefined).map(() => Array<null>(width).fill(null));
}
function writeStaticEntityMap(state: GameState, ent: MaybeStaticEntity): void {
  state.staticEntityMap[ent.pos.y][ent.pos.x] = ent.tag
}
function writeDynamicEntityMap(state: GameState, ent: MaybeDynamicEntity): void {
  const oldTag = state.dynamicEntityMap[ent.pos.y][ent.pos.x];
  if (oldTag === "@") {
    const plyEntIndex = state.playerEntities.findIndex(plyEnt =>
      plyEnt.pos.x === ent.pos.x && plyEnt.pos.y === ent.pos.y
    );
    // plyEntIndex can but should not be -1
    state.playerEntities.splice(plyEntIndex, 1);
  }
  state.dynamicEntityMap[ent.pos.y][ent.pos.x] = ent.tag;
  if (ent.tag === "@") {
    state.playerEntities.push({
      tag: "@",
      pos: ent.pos,
    });
  }
}

/**
 * Make a copy of the existing GameState. Used when a modification to the GameState is required to preserve history.
 */
function copyState(state: GameState): GameState {
  return {
    width: state.width,
    height: state.height,
    staticEntityMap: state.staticEntityMap.map(a => a.map(v => v)),
    dynamicEntityMap: state.dynamicEntityMap.map(a => a.map(v => v)),
    playerEntities: state.playerEntities.map(ent => ent),
  };
}

type SoundTag = "sploosh";
type Move = {
  ent: DynamicEntity
  dir: Dir
};
type MoveContext = {
  remainingMoves: Move[]
  beenTo?: Position[]
};
type MoveResult = {
  type: "success"
  sounds?: SoundTag[]
  delayedMoves?: Move[]
} | {
  type: "reorder"
  moveIndex: number
} | {
  type: "failure"
  flashPositions: Position[]
}
/**
 * Calculates the result of moving the entity to the new location. Can kill or change either `move.ent` or the entity
 * at `move.ent.pos + move.dir`. The entity being moved should be absent from `state` in its current position.
 * @param state The GameState being modified
 * @param move The entity and direction to be moved
 * @param ctxt A context containing other information. The `beenTo` property can be modified by the function. As is this
 * means multiple moves cannot be tried at a time within the function, or the context needs to be somehow captured.
 */
function executeMove(state: GameState, move: Move, ctxt: MoveContext): MoveResult {
  const {dir, ent: {tag, pos}} = move;
  const movedPos: Position = {
    x: pos.x + dir.dx,
    y: pos.y + dir.dy,
  };

  if (!ctxt.beenTo) ctxt.beenTo = [];
  //// BEGIN Checks that we can move `ent`
  // If we come back to where we've already moved a DynamicEntity, disallow the move
  if (ctxt.beenTo.some(pos => eqPos(movedPos, pos))) {
    return {
      type: "failure",
      flashPositions: ctxt.beenTo.slice(0), // Copy all the positions
    };
  }
  ctxt.beenTo.push(movedPos);

  // Check if this would conflict with another DynamicEntity we want to move. It is ok to move into the path of another
  // entity that is going to be moved or to move an entity that would've been moved by another.
  const moveFirst = ctxt.remainingMoves.findIndex(move => eqPos(move.ent.pos, movedPos));
  if (moveFirst !== -1) {
    // We need to reorder
    return {
      type: "reorder",
      moveIndex: moveFirst,
    };
  }
  //// END

  //// BEGIN FINAL Now we know that we can actually move our `ent`.
  // The tag of whatever we would need to push. Could be null
  const pushedTag = state.dynamicEntityMap[movedPos.y][movedPos.x];
  // We now move the entity onto the location
  const movedEnt = {tag, pos: movedPos};
  writeDynamicEntityMap(state, movedEnt);
  // All dynamic entities can be pushed and otherwise it can try to go there.
  switch (pushedTag) {
    case "@":
    case "0": {
      // We can push it
      return executeMove(state, {
        dir,
        ent: {
          tag: pushedTag,
          pos: movedPos,
        },
      }, ctxt);
    }
    case null: {
      const staticTag = state.staticEntityMap[movedPos.y][movedPos.x];
      switch (staticTag) {
        case "O": {
          writeStaticEntityMap(state, {tag: null, pos: movedPos});
          writeDynamicEntityMap(state, {tag: null, pos: movedPos});
          return {
            type: "success",
          };
        }
        case "~": {
          // Entities slide on water
          if (tag === "0") {
            // Destroy the "0" and the "~". Pushing the rock in the water makes a lilypad to stand on.
            writeStaticEntityMap(state, {tag: null, pos: movedPos});
            writeDynamicEntityMap(state, {tag: null, pos: movedPos});
            return {
              type: "success",
              sounds: ["sploosh"],
            };
          }
          return {
            type: "success",
            delayedMoves: [{
              dir,
              ent: {
                tag,
                pos: movedPos,
              },
            }],
          };
        }
        case "^": {
          return {
            type: "success",
            delayedMoves: [{
              dir: DIRS.UP,
              ent: movedEnt,
            }],
          };
        }
        case "<": {
          return {
            type: "success",
            delayedMoves: [{
              dir: DIRS.LEFT,
              ent: movedEnt,
            }],
          };
        }
        case "v": {
          return {
            type: "success",
            delayedMoves: [{
              dir: DIRS.DOWN,
              ent: movedEnt,
            }],
          };
        }
        case ">": {
          return {
            type: "success",
            delayedMoves: [{
              dir: DIRS.RIGHT,
              ent: movedEnt,
            }],
          };
        }
        case " ": {
          // Walls prevent movement
          return {
            type: "failure",
            flashPositions: [movedPos],
          };
        }
        case null: {
          return {
            type: "success",
          };
        }
      }
    }
  }
}

/**
 * Calculates an update when the player moves. Moves all player entities in the corresponding direction. If any move
 * fails, the whole operation fails.
 * @returns `null` if nothing happened
 * @returns `newState`, the new game state. The input argument `state` is never modified.
 * @returns `delayedMoves` for any subsequent delayed moves that need to happen. If the length of this array is zero,
 * control can be immediately returned to the player.
 */
function playerUpdate(state: GameState, dir: Dir): {
  newState: GameState
  delayedMoves: Move[]
  sounds: SoundTag[]
} | null {
  // Return values
  const newState = copyState(state);
  const delayedMoves: Move[] = [];
  const sounds: SoundTag[] = [];

  // Execute moves
  const moves: Move[] = state.playerEntities.map(ent => ({ent, dir}));
  for (let i = 0; i < moves.length; i++) {
    const move: Move = moves[i];
    const moveResult = executeMove(newState, move, {
      remainingMoves: moves
    });
    if (moveResult.type === "failure") return null; // If any move fails, the entire operation fails
    if (moveResult.type === "reorder") {
      // TODO. For now, just fail to satisfy the type system
      return null;
    }
    if (moveResult.delayedMoves) delayedMoves.push(...moveResult.delayedMoves);
    if (moveResult.sounds) sounds.push(...moveResult.sounds);
  }
  return {newState, delayedMoves, sounds};
}
function delayedUpdate(state: GameState, moves: Move[]): {
  newState: GameState
  delayedMoves: Move[]
  sounds: SoundTag[]
} {
  // Return values
  let newState = state;
  const delayedMoves : Move[] = [];
  const sounds: SoundTag[] = [];

  // Execute moves
  for (let i = 0; i < moves.length; i++) {
    const move: Move = moves[i];
    const testState = copyState(newState);
    const moveResult = executeMove(testState, move, {
      remainingMoves: moves
    });
    if (moveResult.type === "failure") break;
    if (moveResult.type === "reorder") {
      // TODO. For now, just fail to satisfy the type system
      break;
    }
    newState = testState;
    if (moveResult.delayedMoves) delayedMoves.push(...moveResult.delayedMoves);
    if (moveResult.sounds) sounds.push(...moveResult.sounds);
  }
  return {newState, delayedMoves, sounds};
}

type DOM = {
  description: HTMLElement
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
};

function getVisibleEntityAt(state: GameState, pos: Position): EntityTag {
  // Trust me bro I checked that it works like [y][x]
  return state.dynamicEntityMap[pos.y][pos.x]
      || state.staticEntityMap[pos.y][pos.x]
      || floorTag;
}
const entityColors: {[e in EntityTag]: string} = {
  ".": "#641",
  "@": "#0f0",
  "0": "#c99",
  " ": "#fff",
  "~": "#22f",
  "O": "#3df",
  "^": "#ec3",
  "<": "#ec3",
  "v": "#ec3",
  ">": "#ec3",
};
const tileWidth = 19;
const tileHeight = 27;
function posToCoords(pos: Position, state: GameState): {x: number, y: number} {
  return {
    x: (pos.x - state.width / 2) * tileWidth + canvasWidth / 2,
    y: (pos.y - state.height / 2) * tileHeight + canvasHeight / 2,
  };
}

const canvasWidth = 500;
const canvasHeight = 350;
function drawState(DOM: DOM, state: GameState): void {
  DOM.description.innerText = "<DESCRIPTION>";
  DOM.ctx.fillStyle = "black";
  DOM.ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  for (let y = 0; y < state.height; y++) {
    for (let x = 0; x < state.width; x++) {
      const pos: Position = {x, y};
      const cpos = posToCoords(pos, state);
      const entityTag = getVisibleEntityAt(state, pos);
      DOM.ctx.fillStyle = entityColors[entityTag];
      DOM.ctx.fillText(entityTag, cpos.x, cpos.y);
    }
  }
}
function draw(DOM: DOM, Game: Game): void {
  drawState(DOM, Game.state);
}

type Level = {
  title: string
  map: string[]
};

/**
 * Converts an abstract level description into a playable GameState
 */
function levelToState(level: Level): GameState {
  const height = level.map.length;
  const width = level.map[0].length;
  const state: GameState = {
    height,
    width,
    staticEntityMap: makeEmptyMap(height, width),
    dynamicEntityMap: makeEmptyMap(height, width),
    playerEntities: [],
  };
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const entityTag = level.map[y][x];
      const pos: Position = {x, y};
      if (isStaticEntityTag(entityTag)) {
        writeStaticEntityMap(state, {tag: entityTag, pos});
      }
      if (isDynamicEntityTag(entityTag)) {
        writeDynamicEntityMap(state, {tag: entityTag, pos});
      }
    }
  }
  return state;
}

/**
 * Cardinal directions in the form `[dy, dx]`
 */
const KEYS = [ // There is no consistency check that KEYS has a value for every player action
  {
    name: "UP",
    keys: ["w", "ArrowUp"],
  },
  {
    name: "LEFT",
    keys: ["a", "ArrowLeft"],
  },
  {
    name: "DOWN",
    keys: ["s", "ArrowDown"],
  },
  {
    name: "RIGHT",
    keys: ["d", "ArrowRight"],
  },
  {
    name: "RESTART",
    keys: ["r"],
  }
] as const;
type PlayerAction = "UP" | "LEFT" | "DOWN" | "RIGHT";
type KeyName = typeof KEYS[number]["name"];

const DIRS = {
  UP: {dx: 0, dy: -1},
  LEFT: {dx: -1, dy: 0},
  DOWN: {dx: 0, dy: 1},
  RIGHT: {dx: 1, dy: 0},
} as const;
type Dir = typeof DIRS[PlayerAction];

async function fetchLevel(_levelNumber: number): Promise<Level> {
  return {
		"title": "Move to the right",
		"map": [
			"                    ",
			" .................. ",
			" .................. ",
			" .@..............O. ",
			" .................. ",
			" .................. ",
			"                    "
		]
	};
}

type Game = {
  levelNumber: number
  level: Level
  state: GameState
  actionQueue: PlayerAction[]
}
// I dislike that the functions loadFirstLevel and loadLevel do effectively the same computations but have different
// formats
async function loadFirstLevel(): Promise<Game> {
  const levelNumber = 1;
  const level = await fetchLevel(levelNumber);
  const state = levelToState(level);
  return {
    levelNumber,
    level,
    state,
    actionQueue: [],
  };
}
async function loadLevel(Game: Game, levelNumber: number): Promise<void> {
  Game.levelNumber = levelNumber;
  Game.level = await fetchLevel(Game.levelNumber);
  Game.state = levelToState(Game.level);
  Game.actionQueue = [];
}

const UPDATE_TIMEOUT_MS = 70;

window.addEventListener("load", async function () {
  document.body.style.background = "linear-gradient(#000, #000414)";
  document.getElementById("load")!.hidden = true;
  document.getElementById("gm-container")!.hidden = false;
  const canvas = document.getElementsByTagName("canvas")[0];
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const DOM: DOM = {
    canvas,
    ctx: canvas.getContext("2d", {alpha: false})!,
    description: document.getElementById("gm-description")!,
  };

  DOM.ctx.textBaseline = "top";
  await document.fonts.load("25px Share Tech Mono");
  DOM.ctx.font = "25px Share Tech Mono";

  const Game = await loadFirstLevel();
  let delayedMoves: Move[] = [];
  let lastUpdateTimestamp: number = 0;
  // Don't draw or accept key presses until the fonts have loaded
  draw(DOM, Game);

  const keyQueue: KeyName[] = [];
  document.addEventListener("keydown", function (e) {
    const keyObj = KEYS.find(keyObj => (keyObj.keys as readonly string[]).includes(e.key));
    if (!keyObj) return;
    keyQueue.push(keyObj.name);
  });
  //   switch (keyObj.name) {
  //     case "RESTART":
  //       if (timeoutHandle) clearTimeout(timeoutHandle);
  //       Game.state = levelToState(Game.level);
  //       Game.actionQueue = [];
  //       setTimeoutHandle(null);
  //       break;
  //     default:
  //       Game.actionQueue.push(keyObj.name);
  //       if (timeoutHandle === null) {
  //         const playerAction = Game.actionQueue.shift()!;
  //         const playerDir: Dir = DIRS[playerAction];
  //         const playerMoveResult = playerUpdate(Game.state, playerDir);
  //         if (playerMoveResult) {
  //           handleUpdateResult(DOM, Game, playerMoveResult).then(value => {
              
  //           });
  //         }
  //       }
  //       break;
  //   }
  // });

  function step(timestamp: number): void {
    const firstKey = keyQueue[0];
    if (firstKey === "RESTART") {
      keyQueue.shift();
      loadLevel(Game, Game.levelNumber);
      return draw(DOM, Game);
    } else {
      if (delayedMoves.length > 0) {
        if (timestamp >= lastUpdateTimestamp + UPDATE_TIMEOUT_MS) {
          const updateResult = delayedUpdate(Game.state, delayedMoves);
          lastUpdateTimestamp = timestamp;
          Game.state = updateResult.newState;
          if (Game.state.playerEntities.length === 0) {
            // We win the level and need to move up a level
            loadLevel(Game, Game.levelNumber + 1);
            return draw(DOM, Game);
          } else {
            delayedMoves = updateResult.delayedMoves;
          }
        }
      } else {
        
      }
    }
  }

  window.requestAnimationFrame(step);
});

declare async function delay();

/**
 * Produces side effects in Game and DOM
 */
function handleUpdateResult(DOM: DOM, Game: Game, updateResult: {
  newState: GameState
  delayedMoves: Move[]
}): Promise<any> {
  Game.state = updateResult.newState;
  if (Game.state.playerEntities.length === 0) {
    // We win the level and need to move up a level
    loadLevel(Game, Game.levelNumber + 1);
    return Promise.resolve(null);
  }
  if (updateResult.delayedMoves.length > 0) {
    Game.timeoutHandle = setTimeout(function () {
      const newResult = delayedUpdate(Game.state, updateResult.delayedMoves);
      handleUpdateResult(DOM, Game, newResult); // This can exceed call stack
    }, UPDATE_TIMEOUT_MS);
  }
  draw(DOM, Game);
}
