import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, HostListener } from '@angular/core';
import {
  Application,
  Assets,
  Graphics,
  Point,
  RenderTexture,
  Sprite,
} from 'pixi.js';
import * as PIXI from 'pixi.js';
const symbolImages = {
  '🍒': '../assets/casino.png',
  '🍋': '../assets/lemon.png',
  '⭐': '../assets/plum.png',
  '💎': '../assets/seven.png',
  '7️⃣': '../assets/watermelon.png',
};
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements AfterViewInit {
  screenHeight: number;
  screenWidth: number;

  constructor() {
    this.getScreenSize();
  }

  @HostListener('window:resize', ['$event'])
  getScreenSize(event?) {
    this.screenHeight = window.innerHeight;
    this.screenWidth = window.innerWidth;
    console.log(this.screenHeight, this.screenWidth);
  }
  getGameSize() {}

  revealedMatrix: string[][] = []; // Store revealed symbols

  ngAfterViewInit(): void {
    this.scratchGame();
  }

  restart(): void {
    console.log('Revealed matrix before restart:', this.revealedMatrix);

    // Remove the existing Pixi.js canvas
    const gameContainer = document.getElementById('game-container');
    if (gameContainer) {
      gameContainer.innerHTML = ''; // Clear the container
    }

    // Reset the revealed matrix and restart the game
    this.revealedMatrix = [];
    this.scratchGame();
  }

  async scratchGame() {
    const app = new PIXI.Application();
    await app.init({
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: 0xffffff,
    });
    const gameContainer = document.getElementById('game-container');
    if (gameContainer) {
      gameContainer.innerHTML = ''; // Clear any existing content
      gameContainer.appendChild(app.canvas); // Append the canvas
    } else {
      console.error('Game container not found');
      return;
    }

    const rows = 3,
      cols = 3;
    const cellSize = app.screen.width / 3;

    const gridContainer = new PIXI.Container();
    app.stage.addChild(gridContainer);

    // Map symbols to image file paths
    const symbolImages = {
      casino: '../assets/casino.png',
      lemon: '../assets/lemon.png',
      plum: '../assets/plum.png',
      seven: '../assets/seven.png',
      watermelon: '../assets/watermelon.png',
    };
    const symbols = Object.keys(symbolImages);

    // Load all textures
    const textures: Record<string, PIXI.Texture> = {};
    for (const [key, path] of Object.entries(symbolImages)) {
      textures[key] = await PIXI.Assets.load(path);
    }

    this.revealedMatrix = [];

    for (let row = 0; row < rows; row++) {
      this.revealedMatrix[row] = [];
      for (let col = 0; col < cols; col++) {
        // Randomly pick a symbol
        const symbol = symbols[Math.floor(Math.random() * symbols.length)];
        this.revealedMatrix[row][col] = symbol;

        // Create scratchable cell
        const cell = new PIXI.Graphics();
        cell.beginFill(0x808080); // Scratch-off color
        cell.drawRect(0, 0, cellSize, cellSize);
        cell.endFill();
        cell.x = col * cellSize;
        cell.y = row * cellSize;
        cell.interactive = true;

        // Create a sprite using the loaded texture
        const sprite = new PIXI.Sprite(textures[symbol]);
        sprite.width = cellSize * 0.8; // Adjust size to fit the cell
        sprite.height = cellSize * 0.8;
        sprite.x = cell.x + cellSize * 0.1; // Center within the cell
        sprite.y = cell.y + cellSize * 0.1;
        sprite.visible = false; // Initially hidden

        // Reveal the sprite on click
        cell.on('pointerdown', () => {
          cell.clear(); // Remove scratch-off layer
          sprite.visible = true; // Show the image
        });

        gridContainer.addChild(cell);
        gridContainer.addChild(sprite);
      }
    }
    console.log('Loaded textures:', textures);
    gridContainer.x = (app.screen.width - cols * cellSize) / 2;
    gridContainer.y = (app.screen.height - rows * cellSize) / 2;

  //   function onResize() {
  //     // Adjust the width and height of the PixiJS application
  //     app.renderer.resize(window.innerWidth, window.innerHeight);

  //     // Update any elements based on new screen size
  //     graphics.x = app.screen.width / 2 - 50; // Re-center horizontally
  //     graphics.y = app.screen.height / 2 - 50; // Re-center vertically
  // }

  // Attach the resize event to the window
      // window.addEventListener('resize', onResize);
  }
}
