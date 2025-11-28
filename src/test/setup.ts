import '@testing-library/jest-dom'

// Mock window.confirm for tests
global.confirm = () => true
