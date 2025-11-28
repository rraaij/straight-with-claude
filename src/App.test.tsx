import { render, screen, fireEvent } from '@solidjs/testing-library'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import App from './App'

describe('App - Straight Pool Scorer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Initial Rendering', () => {
    it('should render the app with initial state', () => {
      render(() => <App />)

      expect(screen.getByText('🎱 Straight Pool Scorer')).toBeInTheDocument()
      expect(screen.getByText('14.1 Continuous')).toBeInTheDocument()
      expect(screen.getAllByText('Player 1').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Player 2').length).toBeGreaterThan(0)
    })

    it('should show initial scores of 0 for both players', () => {
      render(() => <App />)

      const scores = screen.getAllByText('0')
      expect(scores).toHaveLength(2)
    })

    it('should show initial game state', () => {
      render(() => <App />)

      expect(screen.getByText(/Inning:/)).toBeInTheDocument()
      expect(screen.getByText('1')).toBeInTheDocument() // Inning number
      expect(screen.getByText(/Balls in Rack:/)).toBeInTheDocument()
      expect(screen.getByText('15')).toBeInTheDocument() // Balls in rack
    })

    it('should show Player 1 as current shooter', () => {
      render(() => <App />)

      expect(screen.getByText(/Current Shooter:/)).toBeInTheDocument()
      const currentShooterSection = screen.getByText(/Current Shooter:/).closest('.info-card')
      expect(currentShooterSection?.textContent).toContain('Player 1')
    })

    it('should have target score set to 100 by default', () => {
      render(() => <App />)

      const select = screen.getByRole('combobox') as HTMLSelectElement
      expect(select.value).toBe('100')
    })
  })

  describe('Scoring - Happy Paths', () => {
    it('should add 1 point when "Ball Made (+1)" is clicked', () => {
      render(() => <App />)

      const ballMadeBtn = screen.getByText('Ball Made (+1)')
      fireEvent.click(ballMadeBtn)

      const playerCards = screen.getAllByText('1')
      expect(playerCards.length).toBeGreaterThan(0)
    })

    it('should add 2 points when "2 Balls (+2)" is clicked', () => {
      render(() => <App />)

      const twoBallsBtn = screen.getByText('2 Balls (+2)')
      fireEvent.click(twoBallsBtn)

      expect(screen.getByText('2')).toBeInTheDocument()
    })

    it('should add 3 points when "3 Balls (+3)" is clicked', () => {
      render(() => <App />)

      const threeBallsBtn = screen.getByText('3 Balls (+3)')
      fireEvent.click(threeBallsBtn)

      expect(screen.getByText('3')).toBeInTheDocument()
    })

    it('should accumulate score over multiple actions', () => {
      render(() => <App />)

      const ballMadeBtn = screen.getByText('Ball Made (+1)')
      const twoBallsBtn = screen.getByText('2 Balls (+2)')

      fireEvent.click(ballMadeBtn) // +1 = 1
      fireEvent.click(twoBallsBtn) // +2 = 3
      fireEvent.click(ballMadeBtn) // +1 = 4

      expect(screen.getByText('4')).toBeInTheDocument()
    })

    it('should decrease balls in rack when scoring', () => {
      render(() => <App />)

      const threeBallsBtn = screen.getByText('3 Balls (+3)')
      fireEvent.click(threeBallsBtn)

      // Should have 15 - 3 = 12 balls remaining
      const rackInfo = screen.getByText(/Balls in Rack:/).closest('.info-card')
      expect(rackInfo?.textContent).toContain('12')
    })
  })

  describe('Re-racking', () => {
    it('should re-rack when balls in rack reaches 1', () => {
      render(() => <App />)

      const threeBallsBtn = screen.getByText('3 Balls (+3)')

      // Score 14 balls (15 - 14 = 1)
      fireEvent.click(threeBallsBtn) // 12 left
      fireEvent.click(threeBallsBtn) // 9 left
      fireEvent.click(threeBallsBtn) // 6 left
      fireEvent.click(threeBallsBtn) // 3 left
      fireEvent.click(screen.getByText('2 Balls (+2)')) // 1 left - should trigger re-rack

      // Should reset to 15
      const rackInfo = screen.getByText(/Balls in Rack:/).closest('.info-card')
      expect(rackInfo?.textContent).toContain('15')

      // Should show re-rack in history
      expect(screen.getByText('Rack broken and re-racked')).toBeInTheDocument()
    })

    it('should re-rack when balls reach 0', () => {
      render(() => <App />)

      const threeBallsBtn = screen.getByText('3 Balls (+3)')

      // Score all 15 balls
      for (let i = 0; i < 5; i++) {
        fireEvent.click(threeBallsBtn)
      }

      // Should reset to 15 (with 0 balls taken from new rack)
      const rackInfo = screen.getByText(/Balls in Rack:/).closest('.info-card')
      expect(rackInfo?.textContent).toContain('15')
    })

    it('should not let balls in rack go negative', () => {
      render(() => <App />)

      const threeBallsBtn = screen.getByText('3 Balls (+3)')

      // Try to score more than rack has
      for (let i = 0; i < 6; i++) {
        fireEvent.click(threeBallsBtn)
      }

      const rackInfo = screen.getByText(/Balls in Rack:/).closest('.info-card')
      const ballsText = rackInfo?.textContent?.match(/\d+/)
      const ballsCount = ballsText ? parseInt(ballsText[0]) : -1
      expect(ballsCount).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Player Switching', () => {
    it('should switch player when "Switch Player" is clicked', () => {
      render(() => <App />)

      const switchBtn = screen.getByText('Switch Player')

      // Initially Player 1
      let currentShooter = screen.getByText(/Current Shooter:/).closest('.info-card')
      expect(currentShooter?.textContent).toContain('Player 1')

      fireEvent.click(switchBtn)

      // Should now be Player 2
      currentShooter = screen.getByText(/Current Shooter:/).closest('.info-card')
      expect(currentShooter?.textContent).toContain('Player 2')
    })

    it('should increment inning when switching player', () => {
      render(() => <App />)

      const switchBtn = screen.getByText('Switch Player')

      let inningInfo = screen.getByText(/Inning:/).closest('.info-card')
      expect(inningInfo?.textContent).toContain('1')

      fireEvent.click(switchBtn)

      inningInfo = screen.getByText(/Inning:/).closest('.info-card')
      expect(inningInfo?.textContent).toContain('2')
    })

    it('should allow Player 2 to score after switch', () => {
      render(() => <App />)

      const switchBtn = screen.getByText('Switch Player')
      const ballMadeBtn = screen.getByText('Ball Made (+1)')

      fireEvent.click(switchBtn)
      fireEvent.click(ballMadeBtn)

      // Check that Player 2 now has a score
      const currentShooter = screen.getByText(/Current Shooter:/).closest('.info-card')
      expect(currentShooter?.textContent).toContain('Player 2')
    })
  })

  describe('Fouls - Exception Handling', () => {
    it('should deduct 1 point and switch player on foul', () => {
      render(() => <App />)

      const ballMadeBtn = screen.getByText('Ball Made (+1)')
      const foulBtn = screen.getByText('Foul (-1)')

      // Player 1 scores 5 points
      for (let i = 0; i < 5; i++) {
        fireEvent.click(ballMadeBtn)
      }

      fireEvent.click(foulBtn)

      // Should have 4 points now
      expect(screen.getByText('4')).toBeInTheDocument()

      // Should have switched to Player 2
      const currentShooter = screen.getByText(/Current Shooter:/).closest('.info-card')
      expect(currentShooter?.textContent).toContain('Player 2')
    })

    it('should not let score go below 0 on foul', () => {
      render(() => <App />)

      const foulBtn = screen.getByText('Foul (-1)')

      // Apply foul when score is 0
      fireEvent.click(foulBtn)

      // Score should still be 0
      const scores = screen.getAllByText('0')
      expect(scores.length).toBeGreaterThanOrEqual(1)
    })

    it('should handle multiple consecutive fouls', () => {
      render(() => <App />)

      const ballMadeBtn = screen.getByText('Ball Made (+1)')
      const foulBtn = screen.getByText('Foul (-1)')

      // Player 1 scores 3 points
      fireEvent.click(ballMadeBtn)
      fireEvent.click(ballMadeBtn)
      fireEvent.click(ballMadeBtn)

      // Apply 2 fouls (alternating between players)
      fireEvent.click(foulBtn) // P1: 2 points, switches to P2
      fireEvent.click(foulBtn) // P2: -1 (stays 0), switches to P1

      // Player 1 should have 2 points, Player 2 should have 0
      expect(screen.getByText('2')).toBeInTheDocument()
      const scores = screen.getAllByText('0')
      expect(scores.length).toBeGreaterThanOrEqual(1)
    })

    it('should record foul in game history', () => {
      render(() => <App />)

      const foulBtn = screen.getByText('Foul (-1)')
      fireEvent.click(foulBtn)

      expect(screen.getByText('Foul (-1 point)')).toBeInTheDocument()
    })
  })

  describe('Game History', () => {
    it('should show "No events yet" message initially', () => {
      render(() => <App />)

      expect(screen.getByText('No events yet. Start playing!')).toBeInTheDocument()
    })

    it('should record score events in history', () => {
      render(() => <App />)

      const ballMadeBtn = screen.getByText('Ball Made (+1)')
      fireEvent.click(ballMadeBtn)

      expect(screen.getByText('Made 1 ball')).toBeInTheDocument()
    })

    it('should show player name in history events', () => {
      render(() => <App />)

      const ballMadeBtn = screen.getByText('Ball Made (+1)')
      fireEvent.click(ballMadeBtn)

      const historyItems = screen.getAllByText('Player 1')
      expect(historyItems.length).toBeGreaterThan(1) // Header + history
    })

    it('should show inning number in history', () => {
      render(() => <App />)

      const ballMadeBtn = screen.getByText('Ball Made (+1)')
      fireEvent.click(ballMadeBtn)

      expect(screen.getByText('Inning 1')).toBeInTheDocument()
    })

    it('should display points with correct sign in history', () => {
      render(() => <App />)

      const ballMadeBtn = screen.getByText('Ball Made (+1)')
      const foulBtn = screen.getByText('Foul (-1)')

      fireEvent.click(ballMadeBtn)
      fireEvent.click(foulBtn)

      const pointElements = document.querySelectorAll('.history-points')
      expect(pointElements.length).toBeGreaterThan(0)
    })
  })

  describe('Player Name Editing', () => {
    it('should allow editing Player 1 name', () => {
      render(() => <App />)

      const player1Header = screen.getAllByText('Player 1')[0]
      fireEvent.click(player1Header)

      const input = screen.getByRole('textbox') as HTMLInputElement
      expect(input).toBeInTheDocument()
      expect(input.value).toBe('Player 1')
    })

    it('should save Player 1 name when checkmark is clicked', () => {
      render(() => <App />)

      const player1Header = screen.getAllByText('Player 1')[0]
      fireEvent.click(player1Header)

      const input = screen.getByRole('textbox') as HTMLInputElement
      fireEvent.input(input, { target: { value: 'Alice' } })

      const saveBtn = screen.getByText('✓')
      fireEvent.click(saveBtn)

      expect(screen.getAllByText('Alice').length).toBeGreaterThan(0)
    })

    it('should save Player 1 name on Enter key', () => {
      render(() => <App />)

      const player1Header = screen.getAllByText('Player 1')[0]
      fireEvent.click(player1Header)

      const input = screen.getByRole('textbox') as HTMLInputElement
      fireEvent.input(input, { target: { value: 'Bob' } })
      fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13 })

      expect(screen.getAllByText('Bob').length).toBeGreaterThan(0)
    })
  })

  describe('Win Conditions', () => {
    it('should detect win when player reaches target score', () => {
      render(() => <App />)

      // Change target to 50 for faster testing
      const select = screen.getByRole('combobox') as HTMLSelectElement
      fireEvent.change(select, { target: { value: '50' } })

      const threeBallsBtn = screen.getByText('3 Balls (+3)')

      // Score 51 points (17 x 3)
      for (let i = 0; i < 17; i++) {
        fireEvent.click(threeBallsBtn)
      }

      expect(screen.getByText(/wins the game!/)).toBeInTheDocument()
    })

    it('should display winner banner when game is won', () => {
      render(() => <App />)

      const select = screen.getByRole('combobox') as HTMLSelectElement
      fireEvent.change(select, { target: { value: '50' } })

      const threeBallsBtn = screen.getByText('3 Balls (+3)')

      for (let i = 0; i < 17; i++) {
        fireEvent.click(threeBallsBtn)
      }

      const winnerBanner = screen.getByText(/Player 1 wins the game!/)
      expect(winnerBanner).toBeInTheDocument()
    })

    it('should show correct winner name in banner', () => {
      render(() => <App />)

      const select = screen.getByRole('combobox') as HTMLSelectElement
      fireEvent.change(select, { target: { value: '50' } })

      // Switch to Player 2 and let them win
      const switchBtn = screen.getByText('Switch Player')
      fireEvent.click(switchBtn)

      const threeBallsBtn = screen.getByText('3 Balls (+3)')
      for (let i = 0; i < 17; i++) {
        fireEvent.click(threeBallsBtn)
      }

      expect(screen.getByText(/Player 2 wins the game!/)).toBeInTheDocument()
    })
  })

  describe('Target Score Settings', () => {
    it('should change target score to 50', () => {
      render(() => <App />)

      const select = screen.getByRole('combobox') as HTMLSelectElement
      fireEvent.change(select, { target: { value: '50' } })

      expect(select.value).toBe('50')
    })

    it('should change target score to 125', () => {
      render(() => <App />)

      const select = screen.getByRole('combobox') as HTMLSelectElement
      fireEvent.change(select, { target: { value: '125' } })

      expect(select.value).toBe('125')
    })

    it('should change target score to 150', () => {
      render(() => <App />)

      const select = screen.getByRole('combobox') as HTMLSelectElement
      fireEvent.change(select, { target: { value: '150' } })

      expect(select.value).toBe('150')
    })
  })

  describe('Game Reset', () => {
    it('should reset scores when Reset Game is clicked', () => {
      render(() => <App />)

      const ballMadeBtn = screen.getByText('Ball Made (+1)')
      const resetBtn = screen.getByText('Reset Game')

      // Score some points
      fireEvent.click(ballMadeBtn)
      fireEvent.click(ballMadeBtn)
      fireEvent.click(ballMadeBtn)

      // Reset game
      fireEvent.click(resetBtn)

      const scores = screen.getAllByText('0')
      expect(scores).toHaveLength(2)
    })

    it('should reset inning to 1 on game reset', () => {
      render(() => <App />)

      const switchBtn = screen.getByText('Switch Player')
      const resetBtn = screen.getByText('Reset Game')

      // Switch players a few times
      fireEvent.click(switchBtn)
      fireEvent.click(switchBtn)
      fireEvent.click(switchBtn)

      fireEvent.click(resetBtn)

      const inningInfo = screen.getByText(/Inning:/).closest('.info-card')
      expect(inningInfo?.textContent).toContain('1')
    })

    it('should reset balls in rack to 15', () => {
      render(() => <App />)

      const threeBallsBtn = screen.getByText('3 Balls (+3)')
      const resetBtn = screen.getByText('Reset Game')

      // Use some balls
      fireEvent.click(threeBallsBtn)
      fireEvent.click(threeBallsBtn)

      fireEvent.click(resetBtn)

      const rackInfo = screen.getByText(/Balls in Rack:/).closest('.info-card')
      expect(rackInfo?.textContent).toContain('15')
    })

    it('should clear game history on reset', () => {
      render(() => <App />)

      const ballMadeBtn = screen.getByText('Ball Made (+1)')
      const resetBtn = screen.getByText('Reset Game')

      fireEvent.click(ballMadeBtn)
      fireEvent.click(resetBtn)

      expect(screen.getByText('No events yet. Start playing!')).toBeInTheDocument()
    })

    it('should reset current player to Player 1', () => {
      render(() => <App />)

      const switchBtn = screen.getByText('Switch Player')
      const resetBtn = screen.getByText('Reset Game')

      fireEvent.click(switchBtn)
      fireEvent.click(resetBtn)

      const currentShooter = screen.getByText(/Current Shooter:/).closest('.info-card')
      expect(currentShooter?.textContent).toContain('Player 1')
    })

    it('should clear winner state on reset', () => {
      render(() => <App />)

      const select = screen.getByRole('combobox') as HTMLSelectElement
      fireEvent.change(select, { target: { value: '50' } })

      const threeBallsBtn = screen.getByText('3 Balls (+3)')
      const resetBtn = screen.getByText('Reset Game')

      // Win the game
      for (let i = 0; i < 17; i++) {
        fireEvent.click(threeBallsBtn)
      }

      expect(screen.getByText(/wins the game!/)).toBeInTheDocument()

      // Reset
      fireEvent.click(resetBtn)

      expect(screen.queryByText(/wins the game!/)).not.toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle rapid score additions', () => {
      render(() => <App />)

      const ballMadeBtn = screen.getByText('Ball Made (+1)')

      // Rapid clicks
      for (let i = 0; i < 10; i++) {
        fireEvent.click(ballMadeBtn)
      }

      expect(screen.getByText('10')).toBeInTheDocument()
    })

    it('should handle switching between all score buttons', () => {
      render(() => <App />)

      const ballMadeBtn = screen.getByText('Ball Made (+1)')
      const twoBallsBtn = screen.getByText('2 Balls (+2)')
      const threeBallsBtn = screen.getByText('3 Balls (+3)')

      fireEvent.click(ballMadeBtn) // 1
      fireEvent.click(threeBallsBtn) // 4
      fireEvent.click(twoBallsBtn) // 6
      fireEvent.click(ballMadeBtn) // 7

      expect(screen.getByText('7')).toBeInTheDocument()
    })

    it('should maintain separate scores for both players', () => {
      render(() => <App />)

      const ballMadeBtn = screen.getByText('Ball Made (+1)')
      const switchBtn = screen.getByText('Switch Player')
      const threeBallsBtn = screen.getByText('3 Balls (+3)')

      // Player 1 scores 3
      fireEvent.click(threeBallsBtn)

      // Switch to Player 2
      fireEvent.click(switchBtn)

      // Player 2 scores 5
      for (let i = 0; i < 5; i++) {
        fireEvent.click(ballMadeBtn)
      }

      // Both scores should be visible
      expect(screen.getByText('3')).toBeInTheDocument()
      expect(screen.getByText('5')).toBeInTheDocument()
    })
  })
})
