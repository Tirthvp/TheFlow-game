# The Flow Game

A browser-based puzzle game inspired by the mission of [charity: water](https://www.charitywater.org/) — bringing clean and safe drinking water to people around the world.

## Overview

Players rotate pipe tiles on a 6×6 grid to build a connected path from a water source (🚰) to a storage tank (🛢️) before time runs out. Each difficulty mode presents a fixed puzzle layout with tiles scrambled at the start, requiring the player to find and restore the correct configuration.

## How to Play

1. Select a difficulty mode — Easy, Normal, or Hard.
2. Click any pipe tile to rotate it 90° clockwise.
3. Build a continuous connected path from the source (top-left) to the tank (bottom-right).
4. Complete the path before the timer reaches zero to win.
5. Every rotation earns points. Completing the puzzle awards a time bonus on top of your score.

### Difficulty Modes

| Mode   | Time  | Path Complexity         |
|--------|-------|--------------------------|
| Easy   | 60s   | Simple L-shaped path     |
| Normal | 45s   | Two-segment winding path |
| Hard   | 30s   | Full snake across all rows |

## Features

- Fixed puzzle patterns per difficulty with randomized starting rotations
- BFS-based path detection with real-time connected tile highlighting
- Score tracking with milestone messages
- Win overlay with final score summary and time bonus
- Sound effects for tile rotation, win, and game over
- Responsive layout for desktop and mobile

## Technologies

- HTML5
- CSS3
- Vanilla JavaScript
- [canvas-confetti](https://github.com/catdad/canvas-confetti) for win animation

## Running Locally

No build tools or dependencies required. Clone the repository and open `index.html` directly in a browser.

```bash
git clone <your-repo-url>
cd the-flow-game
open index.html
```

## Future Improvements

- Animated water flow along the connected path
- Additional puzzle layouts per difficulty
- Leaderboard or high score persistence

## Acknowledgements

This project was built in support of [charity: water](https://www.charitywater.org/), a nonprofit organization working to end the global water crisis. Consider [making a donation](https://www.charitywater.org/donate) to support their mission.