class Tile {
  constructor(i, j) {
    this.i = i;
    this.j = j;
    this.validTiles = [...Array(tileRules.length).keys()];
    this.backtrackInvalid = [];
    this.collapsed = false;
  }
  draw(i, j) {
    if (this.collapsed && this.validTiles.length > 0) {
      let tileRule = tileRules[this.validTiles[0]];
      if (tileRule != null) {
        let tileImage = tileImages[CURRENT_CONFIG][tileRule.image_idx];
        let rotation = tileRule.rotation;
        // Make grid tiles overlap edges
        let tileX =
          tileWidth * i -
          (tileWidth / settings[CURRENT_CONFIG].IMAGE_SIZE_PX) * i;
        let tileY =
          tileHeight * j -
          (tileHeight / settings[CURRENT_CONFIG].IMAGE_SIZE_PX) * j;
        imageMode(CENTER);
        translate(tileX + tileWidth / 2, tileY + tileHeight / 2);
        rotate((PI / 2) * rotation);
        image(tileImage, 0, 0, tileWidth, tileHeight);
        rotate((-PI / 2) * rotation);
        translate(-(tileX + tileWidth / 2), -(tileY + tileHeight / 2));
        imageMode(CORNER);
      }
    } else {
      if (SHOW_VALID_COUNT) {
        textSize(tileWidth / 2);
        text(
          this.validTiles.length.toString(),
          tileWidth * i +
            tileWidth / 2 -
            (tileWidth / settings[CURRENT_CONFIG].IMAGE_SIZE_PX) * i,
          tileHeight * j +
            tileHeight / 2 -
            (tileHeight / settings[CURRENT_CONFIG].IMAGE_SIZE_PX) * j
        );
      }
    }
  }
}

function checkNeighbors(x, y, resetBacktracking = true) {
  if (WRAP_AROUND) {
    if (x < 0) x = DIMX - 1;
    if (x >= DIMX) x = 0;
    if (y < 0) y = DIMY - 1;
    if (y >= DIMY) y = 0;
  }
  // Reduce the entropy of neighbors
  if (x >= 0 && x < DIMX && y >= 0 && y < DIMY) {
    let currentTile = tiles[y * DIMX + x];
    if (currentTile.collapsed == false) {
      currentTile.validTiles = [...Array(tileRules.length).keys()];
      if (resetBacktracking) currentTile.backtrackInvalid = [];
      currentTile.validTiles = currentTile.validTiles.filter((tile) => {
        for (let i = 0; i < currentTile.backtrackInvalid.length; i++) {
          if (tile == currentTile.backtrackInvalid[i]) return false;
        }
        return true;
      });
      let neighborX = x;
      let neighborY = y;

      neighborX = x;
      neighborY = y - 1;
      if (WRAP_AROUND && neighborY == -1) neighborY = DIMY - 1;
      if (neighborY >= 0) {
        let neighbor = tiles[neighborY * DIMX + neighborX];
        if (neighbor.collapsed) {
          let neighborRules = tileRules[neighbor.validTiles[0]];
          currentTile.validTiles = currentTile.validTiles.filter((tile) => {
            return neighborRules.down.includes(tile);
          });
        }
      }
      neighborX = x + 1;
      neighborY = y;
      if (WRAP_AROUND && neighborX == DIMX) neighborX = 0;
      if (neighborX < DIMX) {
        let neighbor = tiles[neighborY * DIMX + neighborX];
        if (neighbor.collapsed) {
          let neighborRules = tileRules[neighbor.validTiles[0]];
          currentTile.validTiles = currentTile.validTiles.filter((tile) => {
            return neighborRules.left.includes(tile);
          });
        }
      }
      neighborX = x;
      neighborY = y + 1;
      if (WRAP_AROUND && neighborY == DIMY) neighborY = 0;
      if (neighborY < DIMY) {
        let neighbor = tiles[neighborY * DIMX + neighborX];
        if (neighbor.collapsed) {
          let neighborRules = tileRules[neighbor.validTiles[0]];
          currentTile.validTiles = currentTile.validTiles.filter((tile) => {
            return neighborRules.up.includes(tile);
          });
        }
      }
      neighborX = x - 1;
      neighborY = y;
      if (WRAP_AROUND && neighborX == -1) neighborX = DIMX - 1;
      if (neighborX >= 0) {
        let neighbor = tiles[neighborY * DIMX + neighborX];
        if (neighbor.collapsed) {
          let neighborRules = tileRules[neighbor.validTiles[0]];
          currentTile.validTiles = currentTile.validTiles.filter((tile) => {
            return neighborRules.right.includes(tile);
          });
        }
      }
      if (currentTile.validTiles.length == 0) {
        return false;
      }
    }
  }
  return true;
}
