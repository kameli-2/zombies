class Game {
  constructor(width = 14, height = 14) {
    this.level = 0;
    this.levels = [
      {
        zombies: 1,
        bombs: 7
      },
      {
        zombies: 2,
        bombs: 7
      },
      {
        zombies: 3,
        bombs: 7
      },
      {
        zombies: 3,
        bombs: 6
      },
      {
        zombies: 4,
        bombs: 6
      },
      {
        zombies: 5,
        bombs: 6
      },
      {
        zombies: 6,
        bombs: 6
      },
      {
        zombies: 7,
        bombs: 7
      },
      {
        zombies: 7,
        bombs: 6
      },
      {
        zombies: 7,
        bombs: 5
      },
      {
        zombies: 7,
        bombs: 4
      },
      {
        zombies: 7,
        bombs: 3
      },
      {
        zombies: 7,
        bombs: 2
      },
      {
        zombies: 7,
        bombs: 1
      },
      {
        zombies: 7,
        bombs: 0
      },
      {
        zombies: 8,
        bombs: 0
      },
      {
        zombies: 9,
        bombs: 0
      }
    ]; 
    this.container = document.getElementById('game');
    this.width = width;
    this.height = height;
    this.container.style.width = this.width + 'em';
    this.container.style.height = this.height + 'em';
    this.activateMouseControllers();
    this.startGame();
  }

  activateMouseControllers() {
    document.getElementById('controls').addEventListener('click', (ev) => {
      if (ev.target.classList.contains('control-arrow')) {
        document.dispatchEvent(new CustomEvent('keydown', { detail: ev.target.dataset.code }));
      }
    });

    document.addEventListener('keydown', (ev) => {
      if (ev.code === 'Space') this.container.click();
    });
  }

  startGame() {
    this.level++;
    document.getElementById('info-level').innerHTML = this.level;
    const levelSettings = this.levels[this.level - 1];
    this.spawnPlayer();
    this.spawnHome();
    this.spawnZombies(levelSettings.zombies);
    this.spawnBombs(levelSettings.bombs);
    this.listenToMovements();
  }

  listenToMovements() {
    this.movementListener = this.checkGameStatus.bind(this);
    document.addEventListener('move', this.movementListener);
  }

  checkGameStatus() {
    // Check if someone touches a bomb
    this.bombs.forEach(bomb => {
      if (bomb.touches(this.player)) {
        this.lose();
        this.player.die();
        this.handleBombExplosion(bomb);
      }

      this.zombies.forEach(zombie => {
        if (bomb.touches(zombie)) {
          this.killZombie(zombie);
          this.handleBombExplosion(bomb);
        }
      });
    });

    // Check if a Zombie has reached the player
    if (this.zombies.some(zombie => zombie.touches(this.player))) this.lose();
    else if (this.home.touches(this.player)) this.win();
  }

  killZombie(zombie) {
    this.zombies = this.zombies.filter(z => z.el !== zombie.el);
    zombie.die();
  }

  win() {
    this.container.classList.add('win');
    this.endGame();
  }

  lose() {
    this.container.classList.add('lose');
    this.level = 0;
    this.endGame();
  }

  endGame() {
    if (this.gameEnded) return;

    this.gameEnded = true;
    document.removeEventListener('keydown', this.playerControlsEventListener);
    delete this.playerControlsEventListener;
    
    this.container.addEventListener('click', this.restart.bind(this), { once: true });

    document.removeEventListener('move', this.movementListener);
    delete this.movementListener;
  }

  restart() {
    this.player.destroy();
    this.home.destroy();
    this.zombies.forEach(zombie => zombie.destroy());
    this.bombs.forEach(bomb => bomb.destroy());
    this.container.classList.remove('win');
    this.container.classList.remove('lose');
    delete this.gameEnded;
    this.startGame();
  }

  spawnPlayer() {
    this.player = new Player(0, 0, this);
    this.spawnCharacter(this.player);
    this.addPlayerControls();
  }

  spawnHome() {
    this.home = new Home(this.width - 1, this.height - 1, this);
    this.spawnCharacter(this.home);
  }

  addPlayerControls() {
    this.playerControlsEventListener = (ev) => {
      switch (ev.code || ev.detail) {
        case 'ArrowUp':
          this.player.move(0, -1);
          break;
        case 'ArrowDown':
          this.player.move(0, 1);
          break;
        case 'ArrowLeft':
          this.player.move(-1, 0);
          break;
        case 'ArrowRight':
          this.player.move(1, 0);
          break;
        default:
          return;
      }

      this.createSound(this.player.position[0], this.player.position[1]);
    };

    document.addEventListener('keydown', this.playerControlsEventListener);
  }

  spawnZombies(n) {
    this.zombies = [];
    
    for (let i = 0; i < n; i++) {
      const position = this.generateRandomPosition();
      this.zombies.push(new Zombie(...position, this));
    }

    this.zombies.forEach(this.spawnCharacter, this);
  }

  generateRandomPosition() {
    let position;

    do {
      position = [
        Math.floor(Math.random() * this.width),
        Math.floor(Math.random() * this.height)
      ];
    } while (
      [ this.player, this.home, ...(this.zombies || []), ...(this.bombs || []) ].some(character => character.position.join() === position.join())
    );

    return position;
  }

  spawnBombs(n) {
    this.bombs = [];
    
    for (let i = 0; i < n; i++) {
      const position = this.generateRandomPosition();
      this.bombs.push(new Bomb(...position, this));
    }

    this.bombs.forEach(this.addBombControls, this);
    this.bombs.forEach(this.spawnCharacter, this);
  }

  addBombControls(bomb) {
    bomb.explodeEvent = this.handleBombExplosion.bind(this, bomb);
    bomb.el.addEventListener('click', bomb.explodeEvent, { once: true });
  }

  handleBombExplosion(bomb) {
    bomb.explode();
    this.bombs = this.bombs.filter(b => b.el !== bomb.el);
    this.createSound(bomb.position[0], bomb.position[1]);
  }

  spawnCharacter(character) {
    this.container.appendChild(character.el);
  }

  createSound(x, y) {
    this.zombies.forEach(zombie => zombie.approach(x, y));
  }
}

class Character {
  constructor(x, y, type, game) {
    this.position = [x, y];
    this.type = type;
    this.game = game;
    this.createElement();
  }

  createElement() {
    this.el = document.createElement('span');
    this.el.classList.add('character');
    this.el.classList.add(this.type);
    this.updatePosition();
    return this.el;
  }

  move(x, y) {
    this.position[0] += x;
    this.position[1] += y;

    this.containInBoundaries();
    this.updatePosition();

    document.dispatchEvent(new Event('move'));
  }

  approach(x, y) {
    const deltaX = this.position[0] - x;
    const deltaY = this.position[1] - y;

    if (deltaX === 0 && deltaY === 0) return this.move(0, 0);
    if (Math.abs(deltaX) > Math.abs(deltaY)) return this.move(-deltaX / Math.abs(deltaX), 0);
    if (Math.abs(deltaX) < Math.abs(deltaY)) return this.move(0, -deltaY / Math.abs(deltaY));

    // Move randomly either in X or Y direction
    if (Math.random() < 0.5) return this.move(-deltaX / Math.abs(deltaX), 0);
    return this.move(0, -deltaY / Math.abs(deltaY));
  }

  touches(character) {
    return this.position[0] === character.position[0] && this.position[1] === character.position[1];
  }

  containInBoundaries() {
    if (this.position[0] < 0) this.position[0] = 0;
    if (this.position[1] < 0) this.position[1] = 0;
    if (this.position[0] >= this.game.width) this.position[0] = this.game.width - 1;
    if (this.position[1] >= this.game.height) this.position[1] = this.game.height - 1;
  }

  updatePosition() {
    this.el.style.left = this.position[0] + 'em';
    this.el.style.top = this.position[1] + 'em';
  }

  destroy() {
    this.el?.parentElement?.removeChild(this.el);
  }

  die() {
    this.el.classList.add('dead');
    window.setTimeout(this.destroy.bind(this), 1000);
  }
}

class Player extends Character {
  constructor(x, y, game) {
    super(x, y, 'player', game);
  }

  createElement() {
    super.createElement();
    this.el.id = 'player';
    return this.el;
  }
}

class Home extends Character {
  constructor(x, y, game) {
    super(x, y, 'home', game);
  }

  createElement() {
    super.createElement();
    this.el.id = 'home';
    return this.el;
  }
}

class Zombie extends Character {
  constructor(x, y, game) {
    super(x, y, 'zombie', game);

    if (Math.random() < 0.34) this.el.classList.add('zombie-male');
    else if (Math.random() < 0.5) this.el.classList.add('zombie-female');
  }
}

class Bomb extends Character {
  constructor(x, y, game) {
    super(x, y, 'bomb', game);
  }

  explode() {
    this.el.classList.add('exploded');
    window.setTimeout(this.destroy.bind(this), 2000);
  }
}

new Game(14, 14);