# Gear It Up! 🎮

A daily gear puzzle game built on Reddit's developer platform. Connect rotating gears to solve challenging mechanical puzzles and compete on leaderboards!

## 🎯 What is Gear It Up?

**Gear It Up!** is an addictive puzzle game where players connect mechanical gears to transmit rotation from start gears to goal gears. Each day features a new challenging puzzle, with players competing for the fastest solve times on global leaderboards.

### Key Features

- **Daily Puzzles**: New mechanical challenges every day
- **Intuitive Physics**: Realistic gear meshing and rotation propagation
- **Multiple Gear Sizes**: Small, medium, large, and extra-large gears
- **Level Editor**: Create and share your own custom puzzles
- **Global Leaderboards**: Compete with players worldwide
- **Reddit Integration**: Play directly in Reddit posts and comments

## 🎮 How to Play

### Basic Mechanics

1. **Start Gears** (🔄): These gears rotate continuously and provide the power source
2. **Goal Gears** (🎯): These need to rotate to complete the puzzle
3. **Positional Gears** (⚙️): Place these from your inventory to connect the start to goal gears

### Gameplay

- **Drag & Drop**: Drag gears from your inventory onto the board
- **Smart Snapping**: Gears automatically snap into perfect mesh positions
- **Physics Simulation**: Gears rotate realistically based on size ratios
- **Win Condition**: All goal gears must rotate in the correct direction (or any direction if unspecified)

### Advanced Features

- **Multi-Gear Connections**: Some puzzles require complex gear trains
- **Direction Requirements**: Goal gears may require clockwise or counterclockwise rotation
- **Size Matching**: Different gear sizes create different rotation speeds
- **Collision Detection**: Gears can't overlap or intersect improperly

## 🛠️ Level Editor

Create your own puzzles and share them with the community!

### Editor Features

#### Gear Placement
- **Start Gears**: Place up to 5 gears that provide rotation power
- **Goal Gears**: Place up to 5 gears that must rotate to win (with direction requirements)
- **Test Mode**: Switch between editing and testing your level instantly

#### Gear Properties
- **Size Selection**: Choose from 4 gear sizes (small, medium, large, extra-large)
- **Rotation Speed**: Set custom speeds for start gears
- **Direction Requirements**: Specify required rotation direction for goal gears (CW, CCW, or any)

#### Level Management
- **Save Drafts**: Work on levels over multiple sessions
- **Publish Levels**: Share your creations with the community
- **Daily Puzzle Creation**: Admins can create official daily challenges



### Level Creation Tips

1. **Start Simple**: Begin with basic direct connections
2. **Add Complexity**: Use gear size ratios for speed changes
3. **Test Thoroughly**: Use test mode to ensure your level is solvable
4. **Balance Difficulty**: Provide enough gears but not too many
5. **Clear Objectives**: Make it obvious what needs to be connected

## 🏗️ Technical Architecture

### Frontend (React + TypeScript)
- **React 19**: Modern React with hooks and concurrent features
- **TypeScript**: Full type safety throughout the application
- **Tailwind CSS**: Utility-first styling with custom brown theme
- **React Router**: Client-side routing for different game modes
- **Custom Hooks**: Pan/zoom functionality and game state management

### Backend (Express + Devvit)
- **Express Server**: RESTful API for level management and leaderboards
- **Devvit Framework**: Reddit's development platform integration
- **PostgreSQL**: Data persistence for levels and scores
- **Reddit API**: Post creation and user authentication

### Game Engine
- **Physics Simulation**: Realistic gear rotation and meshing
- **Collision Detection**: Prevents invalid gear placements
- **Snap System**: Intelligent gear positioning with multi-gear support
- **Win Detection**: Automatic victory condition checking

### Key Components

```
src/
├── client/                 # React frontend
│   ├── components/
│   │   ├── GameBoard/      # Main game interface
│   │   ├── Editor/         # Level editor
│   │   ├── Home/           # Main menu
│   │   └── Gear/           # Gear rendering
│   ├── game/               # App entry point
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Game logic & utilities
│   └── types/              # TypeScript definitions
├── server/                 # Express backend
└── shared/                 # Shared types & utilities
```

## 🚀 Getting Started

### Prerequisites

- **Node.js 22+**: Required for Devvit development
- **Reddit Account**: For publishing and testing
- **Devvit CLI**: Reddit's development tools

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ArpitKhatri1/reddit-daily-game-hackathon.git
   cd reddit-daily-game-hackathon
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Reddit development**
   ```bash
   npm run login
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

### Development Workflow

1. **Local Development**: `npm run dev` starts all services
2. **Testing**: Use `npm run dev:devvit` for Reddit playtesting
3. **Building**: `npm run build` compiles client and server
4. **Deployment**: `npm run deploy` uploads to Reddit

## 📋 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development servers (client, server, devvit) |
| `npm run build` | Build client and server for production |
| `npm run deploy` | Upload app to Reddit |
| `npm run launch` | Build, deploy, and publish app |
| `npm run check` | Run type checking, linting, and formatting |
| `npm run lint:fix` | Auto-fix linting issues |
| `npm run type-check` | Run TypeScript type checking |

## 🎨 Design & UI

### Visual Style
- **Neo-Brutalism**: Bold buttons and geometric shapes
- **Brown Theme**: Warm, mechanical color palette
- **Retro Typography**: VCR OSD Mono font for authentic feel
- **Smooth Animations**: 60fps gear rotation and transitions

### Responsive Design
- **Mobile-First**: Optimized for Reddit's mobile app
- **Tablet Support**: Adaptive layouts for different screen sizes
- **Desktop Enhancement**: Additional features for larger screens

## 🏆 Game Features

### User Features
- **Daily Challenges**: New puzzle every day at midnight UTC
- **Personal Levels**: Create and manage custom puzzles
- **Solve History**: Track your solving progress and times
- **Leaderboards**: Compete for fastest solve times
- **Community Levels**: Play user-created puzzles

### Admin Features
- **Daily Puzzle Management**: Create and publish official daily challenges
- **Level Moderation**: Review and approve community levels
- **Analytics**: Track player engagement and puzzle difficulty

## 🔧 Configuration


### Environment Variables

- `NODE_ENV`: Development/production mode
- `REDDIT_APP_ID`: Reddit application ID
- `DATABASE_URL`: PostgreSQL connection string

## 🤝 Contributing

### Development Guidelines

1. **Type Safety**: All code must be fully typed
2. **Testing**: Test levels in both edit and play modes
3. **Performance**: Maintain 60fps animations and responsive UI
4. **Accessibility**: Ensure keyboard navigation and screen reader support

### Code Style

- **ESLint**: Automatic linting and fixing
- **Prettier**: Consistent code formatting
- **TypeScript**: Strict type checking enabled

### Pull Request Process

1. Create a feature branch from `main`
2. Implement changes with tests
3. Run `npm run check` to ensure quality
4. Submit PR with detailed description
5. Wait for review and merge

## 📊 Performance

### Optimizations

- **Canvas Rendering**: Hardware-accelerated gear animations
- **Efficient Physics**: Optimized collision detection and rotation propagation
- **Lazy Loading**: Components load on demand
- **Memory Management**: Proper cleanup of animations and event listeners

### Metrics

- **Bundle Size**: ~150KB gzipped
- **First Paint**: <1 second
- **Animation FPS**: 60 stable
- **Memory Usage**: <50MB peak

## 🐛 Troubleshooting

### Common Issues

**Gears not meshing properly**
- Check gear sizes and positions
- Ensure gears are within mesh tolerance
- Try repositioning slightly

**Level editor not saving**
- Check network connection
- Verify level has required start and goal gears
- Try saving as draft first

**Performance issues**
- Reduce browser zoom level
- Close other tabs
- Update browser to latest version

## 🙏 Acknowledgments

- **Reddit Devvit Team**: For the amazing development platform
- **React Community**: For the robust UI framework
- **Open Source Contributors**: For the libraries and tools

---

**Ready to gear up?** Start playing daily puzzles and create your own mechanical masterpieces! ⚙️🔄⚙️
