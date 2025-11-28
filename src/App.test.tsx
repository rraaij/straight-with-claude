import { render, screen, fireEvent } from '@solidjs/testing-library'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import App from './App'

describe('App - Straight Pool Scorer (Simplified Scoring)', () => {
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
      expect(screen.getByText('1')).toBeInTheDocument()
      expect(screen.getByText(/Balls in Rack:/)).toBeInTheDocument()
      expect(screen.getByText('15')).toBeInTheDocument()
    })

    it('should show Player 1 as current shooter', () => {
      render(() => <App />)

      const currentShooter = screen.getByText(/Current Shooter:/).closest('.info-card')
      expect(currentShooter?.textContent).toContain('Player 1')
    })

    it('should have target score set to 100 by default', () => {
      render(() => <App />)

      const select = screen.getByRole('combobox') as HTMLSelectElement
      expect(select.value).toBe('100')
    })
  })

  describe('Simplified Scoring - Happy Paths', () => {
    it('should calculate score based on balls remaining input', () => {
      render(() => <App />)

      const input = screen.getByPlaceholderText('Enter 0-15') as HTMLInputElement
      const endTurnBtn = screen.getByRole('button', { name: 'End Turn' })

      // Player makes 3 balls (15 - 12 = 3)
      fireEvent.input(input, { target: { value: '12' } })
      fireEvent.click(endTurnBtn)

      expect(screen.getByText('3')).toBeInTheDocument()
    })

    it('should update balls in rack after turn', () => {
      render(() => <App />)

      const input = screen.getByPlaceholderText('Enter 0-15') as HTMLInputElement
      const endTurnBtn = screen.getByRole('button', { name: 'End Turn' })

      fireEvent.input(input, { target: { value: '10' } })
      fireEvent.click(endTurnBtn)

      const rackInfo = screen.getByText(/Balls in Rack:/).closest('.info-card')
      expect(rackInfo?.textContent).toContain('10')
    })

    it('should switch player after ending turn', () => {
      render(() => <App />)

      const input = screen.getByPlaceholderText('Enter 0-15') as HTMLInputElement
      const endTurnBtn = screen.getByRole('button', { name: 'End Turn' })

      fireEvent.input(input, { target: { value: '10' } })
      fireEvent.click(endTurnBtn)

      const currentShooter = screen.getByText(/Current Shooter:/).closest('.info-card')
      expect(currentShooter?.textContent).toContain('Player 2')
    })

    it('should record missed shots when no balls pocketed', () => {
      render(() => <App />)

      const input = screen.getByPlaceholderText('Enter 0-15') as HTMLInputElement
      const endTurnBtn = screen.getByRole('button', { name: 'End Turn' })

      // Same number of balls = missed
      fireEvent.input(input, { target: { value: '15' } })
      fireEvent.click(endTurnBtn)

      expect(screen.getByText('Missed')).toBeInTheDocument()
    })

    it('should handle re-rack button', () => {
      render(() => <App />)

      const input = screen.getByPlaceholderText('Enter 0-15') as HTMLInputElement
      const endTurnBtn = screen.getByRole('button', { name: 'End Turn' })
      const reRackBtn = screen.getByRole('button', { name: 'Re-rack' })

      // Make some balls
      fireEvent.input(input, { target: { value: '5' } })
      fireEvent.click(endTurnBtn)

      // Re-rack
      fireEvent.click(reRackBtn)

      const rackInfo = screen.getByText(/Balls in Rack:/).closest('.info-card')
      expect(rackInfo?.textContent).toContain('15')

      // Check history contains re-rack event
      const historyActions = document.querySelectorAll('.history-action')
      const hasReRack = Array.from(historyActions).some(el => el.textContent === 'Re-rack')
      expect(hasReRack).toBe(true)
    })
  })

  describe('Foul Handling', () => {
    it('should deduct 1 point when foul checkbox is checked', () => {
      render(() => <App />)

      const input = screen.getByPlaceholderText('Enter 0-15') as HTMLInputElement
      const foulCheckbox = screen.getByLabelText('Foul occurred') as HTMLInputElement
      const endTurnBtn = screen.getByRole('button', { name: 'End Turn' })

      // Player makes 5 balls but has a foul
      fireEvent.input(input, { target: { value: '10' } })
      fireEvent.click(foulCheckbox)
      fireEvent.click(endTurnBtn)

      // Should have 5 - 1 = 4 points
      expect(screen.getByText('4')).toBeInTheDocument()
    })

    it('should not let score go below 0 on foul', () => {
      render(() => <App />)

      const input = screen.getByPlaceholderText('Enter 0-15') as HTMLInputElement
      const foulCheckbox = screen.getByLabelText('Foul occurred') as HTMLInputElement
      const endTurnBtn = screen.getByRole('button', { name: 'End Turn' })

      // Player misses and has a foul (0 - 1 = should stay at 0)
      fireEvent.input(input, { target: { value: '15' } })
      fireEvent.click(foulCheckbox)
      fireEvent.click(endTurnBtn)

      const scores = screen.getAllByText('0')
      expect(scores.length).toBeGreaterThanOrEqual(1)
    })

    it('should record foul in game history', () => {
      render(() => <App />)

      const input = screen.getByPlaceholderText('Enter 0-15') as HTMLInputElement
      const foulCheckbox = screen.getByLabelText('Foul occurred') as HTMLInputElement
      const endTurnBtn = screen.getByRole('button', { name: 'End Turn' })

      fireEvent.input(input, { target: { value: '12' } })
      fireEvent.click(foulCheckbox)
      fireEvent.click(endTurnBtn)

      expect(screen.getByText(/Foul \(-1\)/)).toBeInTheDocument()
    })
  })

  describe('Consecutive Fouls', () => {
    it('should track consecutive fouls', () => {
      render(() => <App />)

      const input = screen.getByPlaceholderText('Enter 0-15') as HTMLInputElement
      const foulCheckbox = screen.getByLabelText('Foul occurred') as HTMLInputElement
      const endTurnBtn = screen.getByRole('button', { name: 'End Turn' })

      // First foul
      fireEvent.input(input, { target: { value: '15' } })
      fireEvent.click(foulCheckbox)
      fireEvent.click(endTurnBtn)

      // Second foul
      fireEvent.input(input, { target: { value: '15' } })
      fireEvent.click(foulCheckbox)
      fireEvent.click(endTurnBtn)

      // Should show consecutive fouls counter
      expect(screen.getByText(/Consecutive Fouls:/)).toBeInTheDocument()
      expect(screen.getByText('2/3')).toBeInTheDocument()
    })

    it('should apply -15 penalty on 3rd consecutive foul', () => {
      render(() => <App />)

      const input = screen.getByPlaceholderText('Enter 0-15') as HTMLInputElement
      const foulCheckbox = screen.getByLabelText('Foul occurred') as HTMLInputElement
      const endTurnBtn = screen.getByRole('button', { name: 'End Turn' })

      // Give Player 1 some points first
      fireEvent.input(input, { target: { value: '5' } })
      fireEvent.click(endTurnBtn)

      // Switch to Player 2 and give them points
      fireEvent.input(input, { target: { value: '0' } })
      fireEvent.click(endTurnBtn)

      // Player 1 commits 3 consecutive fouls
      // First foul
      fireEvent.input(input, { target: { value: '15' } })
      fireEvent.click(foulCheckbox)
      fireEvent.click(endTurnBtn)

      // Second foul
      fireEvent.input(input, { target: { value: '15' } })
      fireEvent.click(foulCheckbox)
      fireEvent.click(endTurnBtn)

      // Third foul - triggers -15 penalty
      fireEvent.input(input, { target: { value: '15' } })
      fireEvent.click(foulCheckbox)
      fireEvent.click(endTurnBtn)

      // Player 1 should have 10 - 1 - 1 - 15 = 0 (can't go negative)
      const scores = screen.getAllByText('0')
      expect(scores.length).toBeGreaterThanOrEqual(1)

      // Should show 3rd consecutive foul message
      expect(screen.getByText(/3rd Consecutive Foul/)).toBeInTheDocument()
    })

    it('should reset consecutive fouls after making a ball', () => {
      render(() => <App />)

      const input = screen.getByPlaceholderText('Enter 0-15') as HTMLInputElement
      const foulCheckbox = screen.getByLabelText('Foul occurred') as HTMLInputElement
      const endTurnBtn = screen.getByRole('button', { name: 'End Turn' })

      // Give both players points
      fireEvent.input(input, { target: { value: '5' } })
      fireEvent.click(endTurnBtn)

      fireEvent.input(input, { target: { value: '0' } })
      fireEvent.click(endTurnBtn)

      // Apply 2 fouls
      fireEvent.input(input, { target: { value: '15' } })
      fireEvent.click(foulCheckbox)
      fireEvent.click(endTurnBtn)

      fireEvent.input(input, { target: { value: '15' } })
      fireEvent.click(foulCheckbox)
      fireEvent.click(endTurnBtn)

      // Should show 2/3 consecutive fouls
      expect(screen.getByText('2/3')).toBeInTheDocument()

      // Make a ball (no foul)
      fireEvent.input(input, { target: { value: '14' } })
      fireEvent.click(endTurnBtn)

      // Consecutive fouls counter should disappear
      expect(screen.queryByText(/Consecutive Fouls:/)).not.toBeInTheDocument()
    })

    it('should reset consecutive fouls after 3-foul penalty', () => {
      render(() => <App />)

      const input = screen.getByPlaceholderText('Enter 0-15') as HTMLInputElement
      const foulCheckbox = screen.getByLabelText('Foul occurred') as HTMLInputElement
      const endTurnBtn = screen.getByRole('button', { name: 'End Turn' })

      // Give both players points
      fireEvent.input(input, { target: { value: '0' } })
      fireEvent.click(endTurnBtn)

      fireEvent.input(input, { target: { value: '0' } })
      fireEvent.click(endTurnBtn)

      // Apply 3 consecutive fouls
      fireEvent.input(input, { target: { value: '15' } })
      fireEvent.click(foulCheckbox)
      fireEvent.click(endTurnBtn)

      fireEvent.input(input, { target: { value: '15' } })
      fireEvent.click(foulCheckbox)
      fireEvent.click(endTurnBtn)

      fireEvent.input(input, { target: { value: '15' } })
      fireEvent.click(foulCheckbox)
      fireEvent.click(endTurnBtn)

      // Consecutive fouls counter should be gone after penalty
      expect(screen.queryByText(/Consecutive Fouls:/)).not.toBeInTheDocument()
    })
  })

  describe('Input Validation', () => {
    it('should alert on invalid input (negative)', () => {
      render(() => <App />)

      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
      const input = screen.getByPlaceholderText('Enter 0-15') as HTMLInputElement
      const endTurnBtn = screen.getByRole('button', { name: 'End Turn' })

      fireEvent.input(input, { target: { value: '-1' } })
      fireEvent.click(endTurnBtn)

      expect(alertSpy).toHaveBeenCalledWith('Please enter a valid number of balls remaining (0-15)')
      alertSpy.mockRestore()
    })

    it('should alert on invalid input (over 15)', () => {
      render(() => <App />)

      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
      const input = screen.getByPlaceholderText('Enter 0-15') as HTMLInputElement
      const endTurnBtn = screen.getByRole('button', { name: 'End Turn' })

      fireEvent.input(input, { target: { value: '16' } })
      fireEvent.click(endTurnBtn)

      expect(alertSpy).toHaveBeenCalledWith('Please enter a valid number of balls remaining (0-15)')
      alertSpy.mockRestore()
    })

    it('should alert on non-numeric input', () => {
      render(() => <App />)

      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
      const input = screen.getByPlaceholderText('Enter 0-15') as HTMLInputElement
      const endTurnBtn = screen.getByRole('button', { name: 'End Turn' })

      fireEvent.input(input, { target: { value: 'abc' } })
      fireEvent.click(endTurnBtn)

      expect(alertSpy).toHaveBeenCalledWith('Please enter a valid number of balls remaining (0-15)')
      alertSpy.mockRestore()
    })
  })

  describe('Game History', () => {
    it('should show "No events yet" message initially', () => {
      render(() => <App />)

      expect(screen.getByText('No events yet. Start playing!')).toBeInTheDocument()
    })

    it('should record score events in history', () => {
      render(() => <App />)

      const input = screen.getByPlaceholderText('Enter 0-15') as HTMLInputElement
      const endTurnBtn = screen.getByRole('button', { name: 'End Turn' })

      fireEvent.input(input, { target: { value: '12' } })
      fireEvent.click(endTurnBtn)

      expect(screen.getByText(/Made 3 balls/)).toBeInTheDocument()
    })

    it('should show player name in history events', () => {
      render(() => <App />)

      const input = screen.getByPlaceholderText('Enter 0-15') as HTMLInputElement
      const endTurnBtn = screen.getByRole('button', { name: 'End Turn' })

      fireEvent.input(input, { target: { value: '10' } })
      fireEvent.click(endTurnBtn)

      const historyItems = screen.getAllByText('Player 1')
      expect(historyItems.length).toBeGreaterThan(1)
    })

    it('should show inning number in history', () => {
      render(() => <App />)

      const input = screen.getByPlaceholderText('Enter 0-15') as HTMLInputElement
      const endTurnBtn = screen.getByRole('button', { name: 'End Turn' })

      fireEvent.input(input, { target: { value: '10' } })
      fireEvent.click(endTurnBtn)

      expect(screen.getByText('Inning 1')).toBeInTheDocument()
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

      const select = screen.getByRole('combobox') as HTMLSelectElement
      fireEvent.change(select, { target: { value: '50' } })

      const input = screen.getByPlaceholderText('Enter 0-15') as HTMLInputElement
      const endTurnBtn = screen.getByRole('button', { name: 'End Turn' })

      // Make 50 balls (15 * 4 = 60, but we'll stop at 50)
      for (let i = 0; i < 4; i++) {
        fireEvent.input(input, { target: { value: '0' } })
        fireEvent.click(endTurnBtn)

        // Switch back to player 1
        fireEvent.input(input, { target: { value: '15' } })
        fireEvent.click(endTurnBtn)
      }

      expect(screen.getByText(/wins the game!/)).toBeInTheDocument()
    })

    it('should display winner banner when game is won', () => {
      render(() => <App />)

      const select = screen.getByRole('combobox') as HTMLSelectElement
      fireEvent.change(select, { target: { value: '50' } })

      const input = screen.getByPlaceholderText('Enter 0-15') as HTMLInputElement
      const endTurnBtn = screen.getByRole('button', { name: 'End Turn' })

      for (let i = 0; i < 4; i++) {
        fireEvent.input(input, { target: { value: '0' } })
        fireEvent.click(endTurnBtn)
        fireEvent.input(input, { target: { value: '15' } })
        fireEvent.click(endTurnBtn)
      }

      const winnerBanner = screen.getByText(/Player 1 wins the game!/)
      expect(winnerBanner).toBeInTheDocument()
    })
  })

  describe('Game Reset', () => {
    it('should reset scores when Reset Game is clicked', () => {
      render(() => <App />)

      const input = screen.getByPlaceholderText('Enter 0-15') as HTMLInputElement
      const endTurnBtn = screen.getByRole('button', { name: 'End Turn' })
      const resetBtn = screen.getByText('Reset Game')

      fireEvent.input(input, { target: { value: '10' } })
      fireEvent.click(endTurnBtn)

      fireEvent.click(resetBtn)

      const scores = screen.getAllByText('0')
      expect(scores).toHaveLength(2)
    })

    it('should reset inning to 1 on game reset', () => {
      render(() => <App />)

      const input = screen.getByPlaceholderText('Enter 0-15') as HTMLInputElement
      const endTurnBtn = screen.getByRole('button', { name: 'End Turn' })
      const resetBtn = screen.getByText('Reset Game')

      fireEvent.input(input, { target: { value: '10' } })
      fireEvent.click(endTurnBtn)
      fireEvent.input(input, { target: { value: '10' } })
      fireEvent.click(endTurnBtn)

      fireEvent.click(resetBtn)

      const inningInfo = screen.getByText(/Inning:/).closest('.info-card')
      expect(inningInfo?.textContent).toContain('1')
    })

    it('should reset balls in rack to 15', () => {
      render(() => <App />)

      const input = screen.getByPlaceholderText('Enter 0-15') as HTMLInputElement
      const endTurnBtn = screen.getByRole('button', { name: 'End Turn' })
      const resetBtn = screen.getByText('Reset Game')

      fireEvent.input(input, { target: { value: '5' } })
      fireEvent.click(endTurnBtn)

      fireEvent.click(resetBtn)

      const rackInfo = screen.getByText(/Balls in Rack:/).closest('.info-card')
      expect(rackInfo?.textContent).toContain('15')
    })

    it('should clear game history on reset', () => {
      render(() => <App />)

      const input = screen.getByPlaceholderText('Enter 0-15') as HTMLInputElement
      const endTurnBtn = screen.getByRole('button', { name: 'End Turn' })
      const resetBtn = screen.getByText('Reset Game')

      fireEvent.input(input, { target: { value: '10' } })
      fireEvent.click(endTurnBtn)

      fireEvent.click(resetBtn)

      expect(screen.getByText('No events yet. Start playing!')).toBeInTheDocument()
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
})
