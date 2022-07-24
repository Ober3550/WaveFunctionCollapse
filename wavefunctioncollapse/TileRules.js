class TileRule {
  constructor(
    image_idx,
    edges = [[], [], [], []],
    rotation = 0,
    removeNeighbors = [],
    edgeOnly = [],
    probability = 1
  ) {
    this.image_idx = image_idx;
    this.edges = edges;
    this.rotation = rotation;
    this.removeNeighbors = removeNeighbors;
    this.edgeOnly = edgeOnly;
    this.probability = probability;
    if (rotation == 0) {
      // Generate edge definition from image pixels
      loadPixels();
      let loadImage = tileImages[CURRENT_CONFIG][image_idx];
      if (loadImage != null) {
        loadImage.loadPixels();
        for (let i = 1; i < loadImage.width - 1; i++) {
          this.edges[UP].push(loadImage.get(i, 0));
          this.edges[DOWN].push(loadImage.get(i, loadImage.height - 1));
        }
        for (let j = 1; j < loadImage.height - 1; j++) {
          this.edges[RIGHT].push(loadImage.get(loadImage.width - 1, j));
          this.edges[LEFT].push(loadImage.get(0, j));
        }
      }
    }
    // Create set of allowed adjacent tile sets
    this.up = [];
    this.right = [];
    this.down = [];
    this.left = [];
  }
  rotate(num) {
    let newEdges = [];
    for (let i = 0; i < this.edges.length; i++) {
      let newEdge = i;
      let oldEdge = (i - num + 4) % 4;
      // If the difference between the old edge and the new edge is on one of these boundaries
      // Reverse the order of the pixels
      if ((oldEdge < 2 && newEdge > 1) || (oldEdge > 1 && newEdge < 2)) {
        newEdges[newEdge] = [];
        for (let j = this.edges[oldEdge].length - 1; j >= 0; j--) {
          newEdges[newEdge].push(this.edges[oldEdge][j]);
        }
      } else {
        newEdges[newEdge] = this.edges[oldEdge];
      }
    }
    return new TileRule(
      this.image_idx,
      newEdges,
      num,
      this.removeNeighbors,
      this.edgeOnly,
      this.probability
    );
  }
  calculateAdjacency() {
    // Sets up the adjacency rules within the classes
    for (let i = 0; i < tileRules.length; i++) {
      if (tileRules[i] != null) {
        if (!this.removeNeighbors.includes(tileRules[i].image_idx)) {
          if (
            this.edgeOnly.includes(tileRules[i].image_idx) &&
            (this.rotation == 0 || this.rotation == 2) &&
            (tileRules[i].rotation == 0 || tileRules[i].rotation == 2)
          ) {
            // Back to back or front to front
          } else {
            if (checkArrays(this.edges[UP], tileRules[i].edges[DOWN])) {
              this.up.push(i);
            }
            if (checkArrays(this.edges[DOWN], tileRules[i].edges[UP])) {
              this.down.push(i);
            }
          }
          if (
            this.edgeOnly.includes(tileRules[i].image_idx) &&
            (this.rotation == 1 || this.rotation == 3) &&
            (tileRules[i].rotation == 1 || tileRules[i].rotation == 3)
          ) {
            // Back to Left to Right Back to Back or Front to Front
          } else {
            if (checkArrays(this.edges[RIGHT], tileRules[i].edges[LEFT])) {
              this.right.push(i);
            }
            if (checkArrays(this.edges[LEFT], tileRules[i].edges[RIGHT])) {
              this.left.push(i);
            }
          }
        }
      }
    }
  }
}

function checkArrays(arrA, arrB) {
  if (arrA.length != arrB.length) return false;
  for (let i = 0; i < arrA.length; i++) {
    if (arrA[i] instanceof Array) {
      if (checkArrays(arrA[i], arrB[i]) == false) return false;
    } else {
      if (arrA[i] != arrB[i]) return false;
    }
  }
  return true;
}
