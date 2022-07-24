const tileImages = {};
let settings = {
  circuit: {
    IMAGE_COUNT: 9,
    IMAGE_SIZE_PX: 14,
  },
  coast: {
    IMAGE_COUNT: 8,
    IMAGE_SIZE_PX: 10,
  },
  maze_tiles: {
    IMAGE_COUNT: 4,
    IMAGE_SIZE_PX: 15,
  },
  pipe_tiles: {
    IMAGE_COUNT: 5,
    IMAGE_SIZE_PX: 15,
  },
};
let CURRENT_CONFIG = "circuit";
let QUEUE_CONFIG = "";
let LAST_CHANGED = Date.now();
const DIMX = 50;
const DIMY = 50;
const TILES_PER_FRAME = 50;
const SHOW_VALID_COUNT = false;
const CANVAS_WIDTH = 700;
const CANVAS_HEIGHT = 700;
const UP = 0;
const RIGHT = 1;
const DOWN = 2;
const LEFT = 3;
const LOGGING = false;
const WRAP_AROUND = false;
const MOUSE_DEBUG = true;
let running = true;
let tileWidth;
let tileHeight;

let tiles = [];
let tileRules = [];
let eventStack = [];

function preload() {
  let imageSets = Object.keys(settings);
  for (let j = 0; j < imageSets.length; j++) {
    tileImages[imageSets[j]] = [];
    for (let i = 0; i <= settings[imageSets[j]].IMAGE_COUNT; i++) {
      tileImages[imageSets[j]].push(
        loadImage(`wavefunctioncollapse/${imageSets[j]}/${i}.png`)
      );
    }
  }
}

function setup() {
  createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
  noSmooth();
  setupRules();
}

function draw() {
  background(100);
  // Draw all the tiles
  for (let j = 0; j < DIMY; j++) {
    for (let i = 0; i < DIMX; i++) {
      if (j * DIMX + i < tiles.length) {
        tiles[j * DIMX + i].draw(i, j);
      }
    }
  }
  for (let f = 0; f < TILES_PER_FRAME; f++) {
    update();
  }
}

function setupRules() {
  tileRules = [];
  tiles = [];
  eventStack = [];
  allValid = true;
  valid = [];
  for (let i = 0; i <= settings[CURRENT_CONFIG].IMAGE_COUNT; i++) {
    tileRules[i] = new TileRule(i);
  }
  switch (CURRENT_CONFIG) {
    case "circuit": {
      tileRules[6].probability = 4;
      tileRules[7].probability = 10;
      tileRules[6].removeNeighbors = [6];
      tileRules[9].removeNeighbors = [9];
      break;
    }

    case "coast": {
      tileRules[2].edgeOnly = [2];
      tileRules[7].edgeOnly = [7];
      tileRules[2].removeNeighbors = [7];
      tileRules[7].removeNeighbors = [2];
      tileRules[3].removeNeighbors = [3, 4];
      tileRules[4].removeNeighbors = [3, 4];
      tileRules[5].removeNeighbors = [5, 6];
      tileRules[6].removeNeighbors = [5, 6];
      tileRules[8].removeNeighbors = [8];
      tileRules[0].probability = 100;
      tileRules[1].probability = 100;
      tileRules[2].probability = 10;
      tileRules[7].probability = 10;
      //tileRules[3].probability = 3;
      //tileRules[4].probability = 3;
      break;
    }
  }

  for (let i = 0; i < tileImages[CURRENT_CONFIG].length; i++) {
    for (let j = 1; j <= 3; j++) {
      switch (CURRENT_CONFIG) {
        case "coast": {
          switch (tileRules[i].image_idx) {
            case 2: {
              break;
            }
            case 7: {
              if (j != 2) {
                tileRules.push(tileRules[i].rotate(j));
              }
              break;
            }
            default: {
              tileRules.push(tileRules[i].rotate(j));
              break;
            }
          }
          break;
        }
        default: {
          tileRules.push(tileRules[i].rotate(j));
          break;
        }
      }
    }
  }
  for (let i = 0; i < tileRules.length; i++) {
    if (tileRules[i] != null) {
      tileRules[i].calculateAdjacency();
    }
  }
  let fill = 1 + 1 / settings[CURRENT_CONFIG].IMAGE_SIZE_PX;
  tileWidth = (width * fill) / DIMX;
  tileHeight = (height * fill) / DIMY;
  for (let j = 0; j < DIMY; j++) {
    for (let i = 0; i < DIMX; i++) {
      tiles.push(new Tile(i, j));
    }
  }
  console.log(tileImages);
  console.log(tiles);
  console.log(tileRules);
}

function mousePressed() {
  let timeSinceLast = Date.now() - LAST_CHANGED;
  if (timeSinceLast > 1000) {
    LAST_CHANGED = Date.now();
    let configs = Object.keys(settings);
    let currIdx = 0;
    for (let i = 0; i < configs.length; i++) {
      if (configs[i] == CURRENT_CONFIG) {
        currIdx = i;
      }
    }
    let nextIdx = (currIdx + 1) % configs.length;
    QUEUE_CONFIG = configs[nextIdx];
  }
}

function probabilityBucket(validTiles) {
  let bucket = [];
  for (let i = 0; i < validTiles.length; i++) {
    for (let j = 0; j < tileRules[validTiles[i]].probability; j++) {
      bucket.push(validTiles[i]);
    }
  }
  return bucket;
}

let valid = [];
let allValid = true;
function update() {
  if(QUEUE_CONFIG != ""){
    CURRENT_CONFIG = QUEUE_CONFIG;
    QUEUE_CONFIG = "";
    setupRules();
  }
  if (running) {
    if (allValid) {
      // Pick a random tile to collapse
      let tilesCopy = tiles.slice();
      tilesCopy = tilesCopy.filter((element) => {
        return element.validTiles.length > 1 || element.collapsed == false;
      });
      let minCount = Infinity;
      for (let i = 0; i < tilesCopy.length; i++) {
        if (tilesCopy[i].validTiles.length < minCount) {
          minCount = tilesCopy[i].validTiles.length;
        }
      }
      tilesCopy = tilesCopy.filter((element) => {
        return element.validTiles.length <= minCount + 2;
      });
      if (tilesCopy.length > 0) {
        // Backtracking has been having alot of problems
        // because of two paths being evaluated at the same time
        // making edge generation fail over and over
        // We should prioritise the tiles that are closest to the last edge that was generated
        let last = eventStack[eventStack.length - 1];
        if (last != null) {
          tilesCopy = tilesCopy.sort((a, b) => {
            let distA = Math.abs(last.i - a.i) + Math.abs(last.j - a.j);
            let distB = Math.abs(last.i - b.i) + Math.abs(last.j - b.j);
            return distA - distB;
          });
        }
        let tile = random(tilesCopy.slice(0, 2));
        let selectedTile = random(probabilityBucket(tile.validTiles));
        if (selectedTile != null) {
          tile.validTiles = [selectedTile];
          tile.collapsed = true;
          eventStack.push({
            i: tile.i,
            j: tile.j,
            selected: selectedTile,
          });
          if (LOGGING)
            console.log(
              `Pushed: ${JSON.stringify(eventStack[eventStack.length - 1])}`
            );
        } else {
          tile.validTiles = [];
        }
        valid = [
          checkNeighbors(tile.i, tile.j, false),
          checkNeighbors(tile.i, tile.j - 1),
          checkNeighbors(tile.i, tile.j + 1),
          checkNeighbors(tile.i - 1, tile.j),
          checkNeighbors(tile.i + 1, tile.j),
        ];
        allValid = true;
        for (let i = 0; i < valid.length; i++) {
          if (valid[i] == false) {
            allValid = false;
          }
        }
      }
    } else {
      // Revert previous changes
      event = eventStack.pop();
      if (LOGGING) console.log(`Reversed: ${JSON.stringify(event)}`);
      let lastTile = tiles[event.j * DIMX + event.i];
      lastTile.collapsed = false;
      let alreadyAdded = false;
      for (let i = 0; i < lastTile.backtrackInvalid.length; i++) {
        if (lastTile.backtrackInvalid[i] == event.selected) {
          alreadyAdded = true;
        }
      }
      if (!alreadyAdded) lastTile.backtrackInvalid.push(event.selected);
      valid = [
        checkNeighbors(event.i, event.j, false),
        checkNeighbors(event.i, event.j - 1),
        checkNeighbors(event.i, event.j + 1),
        checkNeighbors(event.i - 1, event.j),
        checkNeighbors(event.i + 1, event.j),
      ];
      allValid = true;
      for (let i = 0; i < valid.length; i++) {
        if (valid[i] == false) {
          allValid = false;
        }
      }
    }
  }
}
