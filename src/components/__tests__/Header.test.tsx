import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext';
import Header from '../Header';

// Mock header component test

const renderHeader = () => {
  return render(
    <AuthProvider>
      <BrowserRouter>
        <Header />
      </BrowserRouter>
    </AuthProvider>
  );
};

describe('Header Component', () => {
  test('renders header with logo', () => {
    renderHeader();
    expect(screen.getByText(/ezdevs coffee/i)).toBeInTheDocument();
  });

  test('shows login link when user is not authenticated', () => {
    renderHeader();
    expect(screen.getByText(/login/i)).toBeInTheDocument();
  });

  test('renders navigation menu', () => {
    renderHeader();
    expect(screen.getByText(/menu/i)).toBeInTheDocument();
  });
});