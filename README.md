# Straight Pool Scorer

A SolidJS application for keeping score in straight pool (14.1 continuous) games.

## Features

- **Two-Player Scoring**: Track scores for both players with customizable names
- **Real-time Game State**: Shows current shooter, inning number, and balls remaining in rack
- **Multiple Target Scores**: Play to 50, 100, 125, or 150 points
- **Comprehensive Scoring Actions**:
  - Record balls made (1, 2, or 3 at a time)
  - Apply fouls (-1 point with automatic player switch)
  - Manual player switching
- **Game History**: Complete log of all scoring events with inning tracking
- **Automatic Re-racking**: Tracks when 14 balls are pocketed and rack needs reset
- **Winner Detection**: Automatic game-end detection with winner announcement
- **Editable Player Names**: Click on player names to edit them
- **Built-in Rules Reference**: Expandable rules section for quick reference
- **Responsive Design**: Works on desktop and mobile devices

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

Open [http://localhost:5173](http://localhost:5173) to view it in the browser.

## How to Use

1. **Setup**: Click on player names to customize them, select target score
2. **Scoring**: Use the action buttons to record game events
   - "Ball Made" - Add 1 point to current player
   - "2 Balls" / "3 Balls" - Add multiple points at once
   - "Foul" - Subtract 1 point and switch to other player
   - "Switch Player" - Change current shooter without scoring
3. **Track Progress**: Monitor inning number and balls in rack
4. **View History**: See complete game log in the history section
5. **Reset**: Start a new game with the reset button

## Straight Pool (14.1 Continuous) Rules

- Each legally pocketed ball scores 1 point
- Players must call their shots (ball and pocket)
- When 14 balls are pocketed, they are re-racked
- The 15th ball and cue ball remain in position
- Fouls result in -1 point
- Games are typically played to 100, 125, or 150 points
- Consecutive innings by the same player indicate a "run"

## Technologies Used

- [SolidJS](https://www.solidjs.com/) - Reactive JavaScript framework
- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- [Vite](https://vitejs.dev/) - Fast build tool and dev server
- CSS3 - Modern styling with animations and responsive design

## Deployment

Learn more about deploying your application with the [Vite documentation](https://vite.dev/guide/static-deploy.html)

## License

MIT
