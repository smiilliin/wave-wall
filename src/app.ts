import { Application, Container, FillGradient, Graphics } from "pixi.js";

const app = new Application();

class Vector2 {
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
  add(v: Vector2) {
    return new Vector2(this.x + v.x, this.y + v.y);
  }
  sub(v: Vector2) {
    return new Vector2(this.x - v.x, this.y - v.y);
  }
  mul(s: number) {
    return new Vector2(this.x * s, this.y * s);
  }
  div(s: number) {
    return new Vector2(this.x / s, this.y / s);
  }
  dot(v: Vector2) {
    return this.x * v.x + this.y * v.y;
  }
  norm() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }
  clone() {
    return new Vector2(this.x, this.y);
  }
}
class Generator {
  vector: Vector2;
  a: number;
  A: number;
  f: number;
  tw: number;
  static r: number;

  constructor(vector: Vector2, a: number, A: number, f: number, tw: number) {
    this.vector = vector;
    this.a = A;
    this.A = A;
    this.f = f;
    this.tw = tw;
  }
  getDisplacement(p: Vector2, t: number) {
    const distance = p.sub(this.vector).norm();
    const d =
      this.A *
      Math.sin(
        2 * Math.PI * this.f * (distance / Generator.r - this.tw * t) + this.a
      );

    return d;
  }
}
class Cell {
  vector: Vector2;
  constructor(vector: Vector2) {
    this.vector = vector;
  }
}

app.init({ background: "#000000", resizeTo: document.body }).then(() => {
  document.body.appendChild(app.canvas);

  const view = new Container();

  app.stage.addChild(view);

  app.stage.hitArea = app.screen;
  app.stage.eventMode = "static";

  const N = 40;
  const r = Math.floor(Math.min(app.screen.height, app.screen.width) / 2) * 0.8;
  Generator.r = r;
  const cellSize = r / N;
  const cellR = Math.floor(r / cellSize);
  const centerVector = new Vector2(app.screen.width / 2, app.screen.height / 2);

  const cells: Cell[] = [];
  for (let y = -cellR; y <= cellR; y++) {
    const xrange = Math.round(Math.sqrt(cellR * cellR - y * y));
    for (let x = -xrange; x <= xrange; x++) {
      cells.push(new Cell(new Vector2(x * cellSize, y * cellSize)));
    }
  }
  const cellsGraphic: Graphics = new Graphics();

  cellsGraphic.x = centerVector.x;
  cellsGraphic.y = centerVector.y;

  view.addChild(cellsGraphic);

  const gs: Generator[] = [];
  const gN = 30;
  for (let i = 0; i < gN; i++) {
    const theta = ((2 * Math.PI) / gN) * i;
    const vector = new Vector2(Math.cos(theta), Math.sin(theta)).mul(r);
    const a = Math.random() * 5;
    const A = Math.random() * 5 + 0.1;
    const f = Math.random() * 1.1 + 0.1;
    const tw = Math.random() * 1 + 0.1;

    gs.push(new Generator(vector, a, A, f, tw));
  }

  let currbase: number[] = [];
  let nextbase: number[] = [];

  currbase = [Math.random(), Math.random(), Math.random()];
  nextbase = [Math.random(), Math.random(), Math.random()];

  let startTime = Date.now();
  let colorTime = Date.now();

  const threshold = 4.0;
  app.ticker.add(() => {
    const t = (Date.now() - startTime) / 1000;
    let dt = (Date.now() - colorTime) / 1000;
    if (dt > threshold) {
      currbase = [...nextbase];
      nextbase = [Math.random(), Math.random(), Math.random()];
      colorTime = Date.now();
      dt = 0;
    }
    const base = currbase.map((curr, i) => {
      return curr * (1 - dt / threshold) + nextbase[i] * (dt / threshold);
    });
    app.renderer.background.color = [
      base[0] * 0.1,
      base[1] * 0.1,
      base[2] * 0.1,
    ];

    cellsGraphic.clear();
    cells.forEach((cell) => {
      const p = cell.vector.sub(new Vector2(cellSize / 2, cellSize / 2));

      let displacement =
        gs.reduce((prev, curr) => {
          return prev + curr.getDisplacement(p, t);
        }, 0) /
        (gN * 0.3);

      displacement = Math.max(Math.min(displacement, 1), 0);
      const color = [
        displacement * base[0],
        displacement * base[1],
        displacement * base[2],
      ];
      cellsGraphic.rect(p.x, p.y, cellSize, cellSize).fill(color);
    });
  });
});
