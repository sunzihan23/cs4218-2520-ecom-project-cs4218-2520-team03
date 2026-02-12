import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react";
import axios from "axios";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";
import toast from "react-hot-toast";
import Login from "./Login";

// Mocking axios and toast
jest.mock('axios');
jest.mock('react-hot-toast');

const mockedUsedNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockedUsedNavigate,
  useLocation: jest.fn(() => ({ state: null })),
}));

const mockSetAuth = jest.fn();
jest.mock('../../context/auth', () => ({
  useAuth: jest.fn(() => [{ user: null, token: "" }, mockSetAuth])
}));
jest.mock('../../hooks/useCategory', () => jest.fn(() => [])); // Stops Header crash
jest.mock('../../context/cart', () => ({ useCart: jest.fn(() => [null, jest.fn()]) }));
jest.mock('../../context/search', () => ({ useSearch: jest.fn(() => [{ keyword: '' }, jest.fn()]) }));  

Object.defineProperty(window, 'localStorage', {
  value: { setItem: jest.fn(), getItem: jest.fn(), removeItem: jest.fn() },
  writable: true,
});

window.matchMedia = window.matchMedia || function() {
  return { matches: false, addListener: function() {}, removeListener: function() {} };
};

describe('Login Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'warn').mockImplementation((msg) => {
      if (msg.includes('React Router Future Flag Warning')) return;
      console.warn(msg);
    });
  });

  afterEach(() => {
      jest.restoreAllMocks();
  });

    const fillLoginForm = (getByPlaceholderText) => {
      fireEvent.change(getByPlaceholderText(/Enter Your Email/i), { target: { value: 'test@example.com' } });
      fireEvent.change(getByPlaceholderText(/Enter Your Password/i), { target: { value: 'password123' } });
    };

    it('should login the user successfully, update auth context, and set localStorage', async () => {
      const loginResponse = {
        data: {
          success: true,
          message: 'Login Successful',
          user: { id: 1, name: 'John Doe', email: 'test@example.com' },
          token: 'mockToken'
        }
      };
      axios.post.mockResolvedValueOnce(loginResponse);

      const { getByPlaceholderText, getByText } = render(<MemoryRouter><Login /></MemoryRouter>);

      fillLoginForm(getByPlaceholderText);
      fireEvent.click(getByText('LOGIN'));

      await waitFor(() => expect(axios.post).toHaveBeenCalled());
      expect(mockSetAuth).toHaveBeenCalledWith({
        user: loginResponse.data.user,
        token: loginResponse.data.token,
      });
      expect(localStorage.setItem).toHaveBeenCalledWith("auth", JSON.stringify(loginResponse.data));
    });

    it('should verify toast.success is called on successful login', async () => {
      axios.post.mockResolvedValueOnce({ 
          data: { success: true, message: "Login Successful" } 
      });
      const { getByText, getByPlaceholderText } = render(<MemoryRouter><Login /></MemoryRouter>);
      
      fillLoginForm(getByPlaceholderText);
      fireEvent.click(getByText('LOGIN'));
  
      await waitFor(() => 
          expect(toast.success).toHaveBeenCalledWith(
              "Login Successful", 
              expect.any(Object)
          )
      );
    });

    it('should navigate to home on successful login', async () => {
      axios.post.mockResolvedValueOnce({ data: { success: true } });
      const { getByText, getByPlaceholderText } = render(<MemoryRouter><Login /></MemoryRouter>);
      
      fillLoginForm(getByPlaceholderText);
      fireEvent.click(getByText('LOGIN'));

      await waitFor(() => expect(mockedUsedNavigate).toHaveBeenCalledWith("/"));
    });

    it('should redirect to previous location if location.state exists', async () => {
      // Simulate coming from Cart page
      const cartPath = "/cart";
      const useLocation = require('react-router-dom').useLocation;
      useLocation.mockReturnValue({ state: cartPath });
  
      axios.post.mockResolvedValueOnce({ data: { success: true } });
      const { getByText, getByPlaceholderText } = render(<MemoryRouter><Login /></MemoryRouter>);
      
      fillLoginForm(getByPlaceholderText);
      fireEvent.click(getByText('LOGIN'));
  
      // Redirect to cartPath instead of home
      await waitFor(() => expect(mockedUsedNavigate).toHaveBeenCalledWith(cartPath));
      
      useLocation.mockReturnValue({ state: null });
    });

    it('should handle failed API response with backend message', async () => {
      axios.post.mockResolvedValueOnce({ data: { success: false, message: 'Invalid User' } });
      const { getByText, getByPlaceholderText } = render(<MemoryRouter><Login /></MemoryRouter>);

      fillLoginForm(getByPlaceholderText);
      fireEvent.click(getByText('LOGIN'));

      await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Invalid User'));
    });

    it('should show "Something went wrong" on network error', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      axios.post.mockRejectedValueOnce(new Error("Network Error"));
      const { getByText, getByPlaceholderText } = render(<MemoryRouter><Login /></MemoryRouter>);

      fillLoginForm(getByPlaceholderText);
      fireEvent.click(getByText('LOGIN'));

      await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Something went wrong'));
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should verify button type is submit', () => {
      const { getByText } = render(<MemoryRouter><Login /></MemoryRouter>);
      expect(getByText('LOGIN')).toHaveAttribute('type', 'submit');
    });

    it('should navigate to forgot-password on button click', () => {
      const { getByText } = render(<MemoryRouter><Login /></MemoryRouter>);
      fireEvent.click(getByText(/Forgot Password/i));
      expect(mockedUsedNavigate).toHaveBeenCalledWith("/forgot-password");
    });
});
