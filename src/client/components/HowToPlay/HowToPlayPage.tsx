import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function HowToPlayPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'solve' | 'create'>('solve');

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen relative overflow-hidden p-4 overflow-x-hidden"
      style={{
        background: 'radial-gradient(ellipse at center, #4E342E 0%, #2C1810 50%, #1a0f0a 100%)',
      }}
    >
      {/* Back Button */}
      <div className="absolute top-4 left-4">
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 rounded font-bold text-sm cursor-pointer"
          style={{
            background: '#5D4037',
            color: '#D7CCC8',
            border: '1px solid #795548',
          }}
        >
          &larr; Back
        </button>
      </div>

      {/* Title */}
      <div className="flex items-center gap-3 mb-8 pt-14">
        <h1
          className="text-3xl sm:text-5xl font-bold"
          style={{
            color: '#FFD54F',
            textShadow: '0 3px 12px rgba(255,213,79,0.4)',
          }}
        >
          How to Play
        </h1>
      </div>

      {/* Tab Buttons */}
      <div className="flex justify-center gap-4 mb-6">
        <button
          onClick={() => setActiveTab('solve')}
          className="px-6 py-3 rounded-lg font-bold cursor-pointer transition-all hover:scale-105"
          style={{
            background:
              activeTab === 'solve'
                ? 'linear-gradient(to bottom, #FFD54F, #FF8F00)'
                : 'linear-gradient(to bottom, #5D4037, #3E2723)',
            color: activeTab === 'solve' ? '#3E2723' : '#D7CCC8',
            border: '2px solid #795548',
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
          }}
        >
          Solving Puzzles
        </button>
        <button
          onClick={() => setActiveTab('create')}
          className="px-6 py-3 rounded-lg font-bold cursor-pointer transition-all hover:scale-105"
          style={{
            background:
              activeTab === 'create'
                ? 'linear-gradient(to bottom, #FFD54F, #FF8F00)'
                : 'linear-gradient(to bottom, #5D4037, #3E2723)',
            color: activeTab === 'create' ? '#3E2723' : '#D7CCC8',
            border: '2px solid #795548',
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
          }}
        >
          Creating Levels
        </button>
      </div>

      {/* Tab Content */}
      <div className="w-full max-w-2xl">
        <div
          className="p-8 rounded-lg"
          style={{
            background: 'linear-gradient(to bottom, #3E2723, #2C1810)',
            border: '2px solid #5D4037',
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
          }}
        >
          {activeTab === 'solve' && (
            <div>
              <h3 className="text-2xl font-bold mb-6" style={{ color: '#FFD54F' }}>
                How to Solve Puzzles
              </h3>
              <ul
                className="list-disc list-inside space-y-3 text-base"
                style={{ color: '#D7CCC8', fontFamily: 'monospace' }}
              >
                <li>
                  The Game consists of three gears. Red (Goal), Green(Driver) and Brown(Helper
                  Gears)
                </li>
                <li>The goal is to make all the red gears on the board turn continuously.</li>
                <li>
                  The green gears are always rotating. At the start of the game you will be provided
                  with some helpers gears and using the green and brown gears you need the reach all
                  the red gears.{' '}
                </li>
                <li>Gears must touch and align properly to mesh - you'll see visual feedback.</li>
                <li>Use the timer to track your solve time for the leaderboard.</li>
                <li>If stuck, use the "Recall Gears" button to reset and try again.</li>
              </ul>
            </div>
          )}
          {activeTab === 'create' && (
            <div>
              <h3 className="text-2xl font-bold mb-6" style={{ color: '#FFD54F' }}>
                How to Create and Publish Levels
              </h3>
              <ul
                className="list-disc list-inside space-y-3 text-base"
                style={{ color: '#D7CCC8', fontFamily: 'monospace' }}
              >
                <li>Click "Level Editor" to open the level creation interface.</li>
                <li>Place gears on the board and set up your puzzle design.</li>
                <li>You can add how many initial gears player will get in the bottom bar.</li>
                <li>Use "Test Mode" to playtest your level and ensure it's solvable.</li>
                <li>Save your progress as a draft to continue later.</li>
                <li>When ready, publish your level to share with the community.</li>
                <li>Published levels appear in "Your Levels" and can be played by others.</li>
                <li>Track solve counts and player feedback on your creations!</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
