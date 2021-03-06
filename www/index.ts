import init, { World, Direction, GameStatus } from "../pkg/snake_game";
import { rnd } from "./utils/rnd";

init().then((wasm : any) => {
  const CELL_SIZE = 20;
  const WORLD_WIDTH = 8;
  const snakeSpawnIdx = rnd(WORLD_WIDTH * WORLD_WIDTH);

  const world = World.new(WORLD_WIDTH, snakeSpawnIdx);
  const worldWidth = world.width();

  const points = document.getElementById("points");
  const gameStatus = document.getElementById("game-status");
  const gameControlBtn = document.getElementById("game-control-btn");
  const canvas = <HTMLCanvasElement> document.getElementById("snake-canvas");
  const ctx = canvas.getContext("2d");

  canvas.height = worldWidth * CELL_SIZE;
  canvas.width = worldWidth * CELL_SIZE;

  gameControlBtn.addEventListener("click", _ => {
    const status = world.game_status();

    if (status === undefined) {
      gameControlBtn.textContent = "Playing..";
      world.start_game();
      play();
    } else {
      location.reload();
    }
  })

  const snakeCellPtr = world.snake_cells();
  const snakeLen = world.snake_length();

  const snakeCells = new Uint32Array(
    wasm.memory.buffer,
    snakeCellPtr,
    snakeLen
  )

  console.log(snakeCells);

  document.addEventListener("keydown", (e) => {
    switch(e.code) {
      case "ArrowUp":
        world.change_snake_dir(Direction.Up);
        break;
      case "ArrowRight":
        world.change_snake_dir(Direction.Right);
        break;
      case "ArrowDown":
        world.change_snake_dir(Direction.Down);
        break;
      case "ArrowLeft":
        world.change_snake_dir(Direction.Left);
        break;
    }
  })

  function drawWorld() {
    ctx.beginPath();

    for (let x = 0; x < worldWidth + 1; x++) {
      ctx.moveTo(CELL_SIZE * x, 0);
      ctx.lineTo(CELL_SIZE * x, worldWidth * CELL_SIZE)
    }

    for (let y = 0; y < worldWidth + 1; y++) {
      ctx.moveTo(0, CELL_SIZE * y);
      ctx.lineTo(worldWidth * CELL_SIZE, CELL_SIZE * y)
    }

    ctx.stroke();
  }

  function drawReward() {
    const idx = world.reward_cell();
    const col = idx % worldWidth;
    const row = Math.floor(idx / worldWidth);

    ctx.beginPath();
    ctx.fillStyle = "#FF0000";
    ctx.fillRect(
      col * CELL_SIZE,
      row * CELL_SIZE,
      CELL_SIZE,
      CELL_SIZE
    )
    ctx.stroke();

    if (idx == 1000) {
      alert("You Won!");
    }
  }

  function drawSnake() {
    
    const snakeCells =new Uint32Array(
      wasm.memory.buffer,
      world.snake_cells(),
      world.snake_length()
    )

    // filter out duplicates
    // reverse array

    snakeCells
      // .filter((cellIdx, i) => !(i > 0 && cellIdx === snakeCells[0]))
      .slice().reverse()
      .forEach((cellIdx, i) => {
      const col = cellIdx % worldWidth;
      const row = Math.floor(cellIdx / worldWidth);

      // we are overriding snake head color by body when we crash
      ctx.fillStyle = i === snakeCells.length - 1 ? "#7878db" : "#000000";

      ctx.beginPath();
      ctx.fillRect(
        col * CELL_SIZE,
        row * CELL_SIZE,
        CELL_SIZE,
        CELL_SIZE
      );
    })
    ctx.stroke();
  }

  function drawGameStatus() { 
    gameStatus.textContent = world.game_status_text();
    points.textContent = world.points().toString(); 
  }

  function paint() {
    drawWorld();
    drawSnake();
    drawReward();
    drawGameStatus();
  }

  function play() {
    const status = world.game_status();

    if (status == GameStatus.Won || status == GameStatus.Lost) {
      gameControlBtn.textContent = "Replay"
    }

    const fps = 10;
    setTimeout(() => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      world.step();
      paint();
      // the method takes a callback to invoked before the next repaint
      requestAnimationFrame(play)
    }, 1000 / fps)
  }

  paint();
})