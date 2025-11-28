import { createSignal, createEffect, For, Show } from 'solid-js'
import './App.css'

interface Player {
  name: string
  score: number
}

interface GameEvent {
  inning: number
  player: string
  action: string
  points: number
  timestamp: Date
}

function App() {
  const [player1, setPlayer1] = createSignal<Player>({ name: 'Player 1', score: 0 })
  const [player2, setPlayer2] = createSignal<Player>({ name: 'Player 2', score: 0 })
  const [currentPlayer, setCurrentPlayer] = createSignal<1 | 2>(1)
  const [ballsInRack, setBallsInRack] = createSignal(15)
  const [inningNumber, setInningNumber] = createSignal(1)
  const [gameHistory, setGameHistory] = createSignal<GameEvent[]>([])
  const [targetScore, setTargetScore] = createSignal(100)
  const [editingPlayer1, setEditingPlayer1] = createSignal(false)
  const [editingPlayer2, setEditingPlayer2] = createSignal(false)
  const [tempName1, setTempName1] = createSignal(player1().name)
  const [tempName2, setTempName2] = createSignal(player2().name)
  const [gameWon, setGameWon] = createSignal(false)
  const [winner, setWinner] = createSignal('')

  const addEvent = (action: string, points: number) => {
    const player = currentPlayer() === 1 ? player1().name : player2().name
    setGameHistory([
      {
        inning: inningNumber(),
        player,
        action,
        points,
        timestamp: new Date()
      },
      ...gameHistory()
    ])
  }

  const addScore = (points: number) => {
    const player = currentPlayer() === 1 ? player1 : player2
    const setPlayer = currentPlayer() === 1 ? setPlayer1 : setPlayer2

    setPlayer({ ...player(), score: player().score + points })
    setBallsInRack(Math.max(0, ballsInRack() - points))
    addEvent(`Made ${points} ball${points > 1 ? 's' : ''}`, points)

    if (ballsInRack() <= 1) {
      setBallsInRack(15)
      addEvent('Rack broken and re-racked', 0)
    }
  }

  const applyFoul = () => {
    const player = currentPlayer() === 1 ? player1 : player2
    const setPlayer = currentPlayer() === 1 ? setPlayer1 : setPlayer2

    setPlayer({ ...player(), score: Math.max(0, player().score - 1) })
    addEvent('Foul (-1 point)', -1)
    switchPlayer()
  }

  const switchPlayer = () => {
    setCurrentPlayer(currentPlayer() === 1 ? 2 : 1)
    setInningNumber(inningNumber() + 1)
  }

  const resetGame = () => {
    if (confirm('Are you sure you want to reset the game?')) {
      setPlayer1({ ...player1(), score: 0 })
      setPlayer2({ ...player2(), score: 0 })
      setCurrentPlayer(1)
      setBallsInRack(15)
      setInningNumber(1)
      setGameHistory([])
      setGameWon(false)
      setWinner('')
    }
  }

  const savePlayer1Name = () => {
    setPlayer1({ ...player1(), name: tempName1() })
    setEditingPlayer1(false)
  }

  const savePlayer2Name = () => {
    setPlayer2({ ...player2(), name: tempName2() })
    setEditingPlayer2(false)
  }

  createEffect(() => {
    if (player1().score >= targetScore() && !gameWon()) {
      setGameWon(true)
      setWinner(player1().name)
    } else if (player2().score >= targetScore() && !gameWon()) {
      setGameWon(true)
      setWinner(player2().name)
    }
  })

  return (
    <div class="pool-scorer">
      <header>
        <h1>🎱 Straight Pool Scorer</h1>
        <p class="subtitle">14.1 Continuous</p>
      </header>

      <Show when={gameWon()}>
        <div class="winner-banner">
          🏆 {winner()} wins the game! 🏆
        </div>
      </Show>

      <div class="game-settings">
        <label>
          Target Score:
          <select value={targetScore()} onChange={(e) => setTargetScore(Number(e.currentTarget.value))}>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={125}>125</option>
            <option value={150}>150</option>
          </select>
        </label>
      </div>

      <div class="scoreboard">
        <div class={`player-card ${currentPlayer() === 1 ? 'active' : ''}`}>
          <div class="player-header">
            <Show
              when={!editingPlayer1()}
              fallback={
                <div class="name-edit">
                  <input
                    type="text"
                    value={tempName1()}
                    onInput={(e) => setTempName1(e.currentTarget.value)}
                    onKeyPress={(e) => e.key === 'Enter' && savePlayer1Name()}
                  />
                  <button onClick={savePlayer1Name}>✓</button>
                </div>
              }
            >
              <h2 onClick={() => {
                setTempName1(player1().name)
                setEditingPlayer1(true)
              }}>
                {player1().name}
              </h2>
            </Show>
          </div>
          <div class="score">{player1().score}</div>
        </div>

        <div class="vs">VS</div>

        <div class={`player-card ${currentPlayer() === 2 ? 'active' : ''}`}>
          <div class="player-header">
            <Show
              when={!editingPlayer2()}
              fallback={
                <div class="name-edit">
                  <input
                    type="text"
                    value={tempName2()}
                    onInput={(e) => setTempName2(e.currentTarget.value)}
                    onKeyPress={(e) => e.key === 'Enter' && savePlayer2Name()}
                  />
                  <button onClick={savePlayer2Name}>✓</button>
                </div>
              }
            >
              <h2 onClick={() => {
                setTempName2(player2().name)
                setEditingPlayer2(true)
              }}>
                {player2().name}
              </h2>
            </Show>
          </div>
          <div class="score">{player2().score}</div>
        </div>
      </div>

      <div class="game-info">
        <div class="info-card">
          <span class="label">Inning:</span>
          <span class="value">{inningNumber()}</span>
        </div>
        <div class="info-card">
          <span class="label">Balls in Rack:</span>
          <span class="value">{ballsInRack()}</span>
        </div>
        <div class="info-card">
          <span class="label">Current Shooter:</span>
          <span class="value">{currentPlayer() === 1 ? player1().name : player2().name}</span>
        </div>
      </div>

      <div class="controls">
        <h3>Score Actions</h3>
        <div class="button-grid">
          <button class="score-btn" onClick={() => addScore(1)}>
            Ball Made (+1)
          </button>
          <button class="score-btn" onClick={() => addScore(2)}>
            2 Balls (+2)
          </button>
          <button class="score-btn" onClick={() => addScore(3)}>
            3 Balls (+3)
          </button>
          <button class="foul-btn" onClick={applyFoul}>
            Foul (-1)
          </button>
          <button class="switch-btn" onClick={switchPlayer}>
            Switch Player
          </button>
          <button class="reset-btn" onClick={resetGame}>
            Reset Game
          </button>
        </div>
      </div>

      <div class="history">
        <h3>Game History</h3>
        <div class="history-list">
          <Show when={gameHistory().length === 0}>
            <p class="no-history">No events yet. Start playing!</p>
          </Show>
          <For each={gameHistory()}>
            {(event) => (
              <div class="history-item">
                <span class="history-inning">Inning {event.inning}</span>
                <span class="history-player">{event.player}</span>
                <span class="history-action">{event.action}</span>
                <span class={`history-points ${event.points < 0 ? 'negative' : 'positive'}`}>
                  {event.points > 0 ? '+' : ''}{event.points}
                </span>
              </div>
            )}
          </For>
        </div>
      </div>

      <div class="rules">
        <details>
          <summary>📖 Straight Pool Rules</summary>
          <ul>
            <li>Each legally pocketed ball scores 1 point</li>
            <li>Players must call their shots (ball and pocket)</li>
            <li>When 14 balls are pocketed, they are re-racked</li>
            <li>The 15th ball and cue ball remain in position</li>
            <li>Fouls result in -1 point</li>
            <li>Games are typically played to 100, 125, or 150 points</li>
            <li>Consecutive innings by the same player indicate a "run"</li>
          </ul>
        </details>
      </div>
    </div>
  )
}

export default App
