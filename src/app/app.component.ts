import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, HostListener } from '@angular/core';
import * as PIXI from 'pixi.js';

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
  }


  revealedMatrix: string[][] = []; 

  ngAfterViewInit(): void {
    this.scratchGame();
  }

  async scratchGame() {
    const app = new PIXI.Application();
    await app.init({ width: 800, height: 600, background: '#fc5e5e' });

    document.body.appendChild(app.canvas);

    const { width, height } = app.screen;
    const stageSize = { width, height };
    await PIXI.Assets.load('../assets/bg.jpg');
    await PIXI.Assets.load('../assets/cellBG.png');
    await PIXI.Assets.load('../assets/cellBgFront.png');

    const background = Object.assign(
      PIXI.Sprite.from('../assets/bg.jpg'),
      stageSize
    );
    PIXI.Assets.addBundle('fonts', [
      { alias: 'Inkfree', src: '../assets/Inkfree.ttf' },
    ]);
    await PIXI.Assets.loadBundle('fonts');

    app.stage.addChild(background);

    // Game state
    let balance = 10000;
    let betValue = 1.0;
    const betValues = [0.1, 0.25, 0.5, 1.0, 2.0];
    const payTable = [
      { symbol: 9, cards: 1, prize: 10000 },
      { symbol: 8, cards: 4, prize: 2000 },
      { symbol: 7, cards: 10, prize: 400 },
      { symbol: 6, cards: 25, prize: 200 },
      { symbol: 5, cards: 50, prize: 50 },
      { symbol: 4, cards: 200, prize: 10 },
      { symbol: 3, cards: 400, prize: 5 },
      { symbol: 2, cards: 2000, prize: 2 },
      { symbol: 1, cards: 10000, prize: 1 },
    ];
    const history = [];

    const cardDeck: number[] = [];

    payTable.forEach((symbol) => {
      const occurrences = Math.min(symbol.cards, 3);
      for (let i = 0; i < occurrences; i++) {
        cardDeck.push(symbol.prize);
      }
    });

    function shuffleDeck(deck: number[]): number[] {
      for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
      }
      return deck;
    }

    function createScratchOffMatrix(): number[] {
      const shuffledDeck = shuffleDeck([...cardDeck]);
      const matrix: number[] = [];
      for (let i = 0; i < 9; i++) {
        matrix.push(shuffledDeck[i]);
      }
      return matrix;
    }

    createScratchOffMatrix();

    const balanceText = new PIXI.Text({
      text: `Balance: €${balance.toFixed(2)}`,
    });
    balanceText.style.fontSize = 35;
    balanceText.style.fill = 0x002b59;
    balanceText.style.fontFamily = 'Inkfree';
    balanceText.position.set(10, 550);
    app.stage.addChild(balanceText);

    const gridSize = 3;
    const cellSize = 150;
    const grid = new PIXI.Container();
    grid.position.set(180, 50);
    app.stage.addChild(grid);

    const cells = [];
    const cellBGs = [];
    const revealedSymbols = Array(9).fill(null);
    let symbols = [];

    const cellBgTexture = PIXI.Texture.from('../assets/cellBG.png');
    const cellBgFrontTexture = PIXI.Texture.from('../assets/cellBgFront.png');
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const cellBG = new PIXI.Sprite(cellBgFrontTexture);
        cellBG.width = cellSize; 
        cellBG.height = cellSize;
        cellBG.x = col * cellSize;
        cellBG.y = row * cellSize;
        grid.addChild(cellBG); 
        cellBGs.push(cellBG);

        const cell = new PIXI.Graphics();
        cell.setStrokeStyle(0x000000);
        cell.fill(0x000000, 0);
        cell.rect(0, 0, cellSize, cellSize);
        cell.fill();
        cell.x = col * cellSize;
        cell.y = row * cellSize;

        grid.addChild(cell);

        cell.interactive = true;
        cell.cursor = 'default';
        cells.push(cell);
      }
    }

    // Generate random symbols based on paytable probabilities
    function generateSymbols() {
      const symbols = createScratchOffMatrix();

      return symbols;
    }

    // Initialize symbols for the round
    function initializeRound() {
      if (balance >= betValue) {
        balance -= betValue;
        balanceText.text = `Balance: €${balance.toFixed(2)}`;
        symbols = generateSymbols();
        revealedSymbols.fill(null);
        cellBGs.forEach((cell) => {
          cell.texture = cellBgFrontTexture;
        });
        cells.forEach((cell) => {
          cell.removeChildren();
          cell.cursor = 'pointer';
        });
        startReveal.text = 'Reveal';
        startReveal.off('pointerdown');
        startReveal.on('pointerdown', () => {
          wager();
        });
        app.stage.addChild(startReveal);

        cells.every((cell) => cell.off('pointerdown'));
        cells.every((cell, index) =>
          cell.on('pointerdown', () => revealSymbol(index, true))
        );
      } else {
        alert('Insufficient balance');
      }
    }

    // Display a single symbol on the grid
    function revealSymbol(index, justReveal: boolean) {
      cells[index].cursor = 'default';
      cellBGs[index].texture = cellBgTexture;
      if (revealedSymbols[index] !== null) return; 

      revealedSymbols[index] = symbols[index];

      const cell = cells[index];
      cell.removeChildren();
      const symbolText = new PIXI.Text({
        text: `${(symbols[index] * betValue).toFixed(2)} €`,
      });
      symbolText.style.fontSize = 28;
      (symbolText.style.fill = 0x002b59),
        (symbolText.style.fontFamily = 'Inkfree');
      symbolText.anchor.set(0.5);
      symbolText.position.set(cellSize / 2, cellSize / 2);
      cell.addChild(symbolText);

      if (justReveal && revealedSymbols.every((symbol) => symbol !== null)) {
        wager();
      }
    }

    // Calculate winnings
    function calculateWinnings(symbols) {
      const counts = {};
      symbols.forEach((symbol) => (counts[symbol] = (counts[symbol] || 0) + 1));

      for (const { symbol, prize } of payTable) {
        if (counts[symbol] >= 3) {
          return prize * betValue;
        }
      }
      return 0;
    }

    // Handle wager
    function wager() {
      for (let i = 0; i < 9; i++) revealSymbol(i, false);
      startReveal.text = 'Start';
      startReveal.off('pointerdown');
      startReveal.on('pointerdown', () => {
        initializeRound();
      });
      const winnings = calculateWinnings(revealedSymbols);
      balance += winnings;
      balanceText.text = `Balance: €${balance.toFixed(2)}`;

      if (winnings > 0) {
        console.log(`You won: €${winnings.toFixed(2)}!`);
      } else {
        console.log('You lost!');
      }

      // Add to history
      updateHistory({
        time: new Date().toLocaleString(),
        betValue: `€${betValue.toFixed(2)}`,
        symbols: revealedSymbols,
        outcome: winnings > 0 ? `Win: €${winnings.toFixed(2)}` : 'Loss',
      });
    }

    function updateHistory(round) {
      const hContainer = new PIXI.Container();

      const hMatrix = new PIXI.Container();
      hMatrix.position.set(5, 20);

      for (let i = 0; i < 3; i++)
        for (let j = 0; j < 3; j++) {
          const hSymbol = new PIXI.Text({
            text: `${round.symbols[i + 3 * j]}€`,
          });
          hSymbol.style = {
            fontSize: 13,
            fill: 0x002b59,
            fontFamily: 'Inkfree',
          };
          hSymbol.position.set(i * 50, j * 15);
          hMatrix.addChild(hSymbol);
        }

      const hTime = new PIXI.Text({ text: round.time });
      hTime.style = { fontSize: 13, fill: 0x002b59, fontFamily: 'Inkfree' };
      hTime.position.set(0, 0);
      const hSymbols1 = new PIXI.Text({
        text: `${round.symbols[0]}${round.symbols[1]}${round.symbols[2]}`,
      });
      const hOutcome = new PIXI.Text({
        text: `${round.betValue}   ${round.outcome}  `,
      });
      hOutcome.style = { fontSize: 16, fill: 0x002b59, fontFamily: 'Inkfree' };
      hOutcome.position.set(0, 80);

      hContainer.addChild(hTime, hMatrix, hOutcome);
      historyItems.push(hContainer);
      historyContainer.addChild(hContainer);
      historyContainer.children.every((child, index) =>
        child.position.set(
          5,
          historyContainer.children.length * 120 - 120 * index - 120
        )
      );

      if (historyContainer.children.length > 5)
        historyContainer.children.shift();
    }

    //////////// History ///////////////////
    const historyItems = [];
    const historyContainer = new PIXI.Container();
    historyContainer.position.set(640, 60);

    const historyTitle = new PIXI.Text({ text: `History` });
    historyTitle.style.fontSize = 34;
    historyTitle.style.fill = 0x002b59;
    historyTitle.style.fontFamily = 'Inkfree';
    historyTitle.position.set(665, 10);

    app.stage.addChild(historyContainer);
    app.stage.addChild(historyTitle);

    //////////// Buttons ///////////////////
    const betText = new PIXI.Text({ text: `Bet: €${betValue.toFixed(2)}` });
    betText.style.fontSize = 34;
    (betText.style.fill = 0x002b59), (betText.style.fontFamily = 'Inkfree');
    betText.position.set(10, 260);
    app.stage.addChild(betText);

    const increaseBet = new PIXI.Text({ text: '+' });
    increaseBet.style.fontSize = 54;
    (increaseBet.style.fill = 0x002b59),
      (increaseBet.style.fontFamily = 'Inkfree');
    increaseBet.interactive = true;
    increaseBet.cursor = 'pointer';
    increaseBet.position.set(75, 200);
    increaseBet.on('pointerdown', () => {
      const currentIndex = betValues.indexOf(betValue);
      if (currentIndex < betValues.length - 1) {
        betValue = betValues[currentIndex + 1];
        betText.text = `Bet: €${betValue.toFixed(2)}`;
      }
    });
    app.stage.addChild(increaseBet);

    const decreaseBet = new PIXI.Text({ text: '-' });
    decreaseBet.style.fontSize = 60;
    (decreaseBet.style.fill = 0x002b59),
      (decreaseBet.style.fontFamily = 'Inkfree');
    decreaseBet.interactive = true;
    decreaseBet.cursor = 'pointer';
    decreaseBet.position.set(75, 300);
    decreaseBet.on('pointerdown', () => {
      const currentIndex = betValues.indexOf(betValue);
      if (currentIndex > 0) {
        betValue = betValues[currentIndex - 1];
        betText.text = `Bet: €${betValue.toFixed(2)}`;
      }
    });
    app.stage.addChild(decreaseBet);

    const startReveal = new PIXI.Text({ text: 'Start' });
    startReveal.style.fontSize = 32;
    (startReveal.style.fill = 0x002b59),
      (startReveal.style.fontFamily = 'Inkfree');
    startReveal.interactive = true;
    startReveal.cursor = 'pointer';
    startReveal.position.set(550, 550);
    startReveal.off('pointerdown');
    startReveal.on('pointerdown', () => {
      initializeRound();
    });
    app.stage.addChild(startReveal);
  }
}
