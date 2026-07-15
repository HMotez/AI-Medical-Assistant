import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import Login from "../pages/auth/Login";

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

function renderLogin(loginFn = jest.fn()) {
  return render(
    <AuthContext.Provider value={{ login: loginFn, user: null }}>
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    </AuthContext.Provider>
  );
}

describe("Login page", () => {
  beforeEach(() => mockNavigate.mockClear());

  test("renders email and password fields", () => {
    renderLogin();
    expect(screen.getByPlaceholderText(/your@email.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/••••••••/)).toBeInTheDocument();
  });

  test("renders Sign In button", () => {
    renderLogin();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });

  test("calls login with entered credentials", async () => {
    const loginFn = jest.fn().mockResolvedValue({ role: "patient" });
    renderLogin(loginFn);

    fireEvent.change(screen.getByPlaceholderText(/your@email.com/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/••••••••/), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(loginFn).toHaveBeenCalledWith("test@example.com", "password123");
    });
  });

  test("navigates to /patient after successful login", async () => {
    const loginFn = jest.fn().mockResolvedValue({ role: "patient" });
    renderLogin(loginFn);

    fireEvent.change(screen.getByPlaceholderText(/your@email.com/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/••••••••/), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/patient"));
  });

  test("shows error message on failed login", async () => {
    const loginFn = jest.fn().mockRejectedValue({
      response: { data: { detail: "Invalid credentials" } },
    });
    renderLogin(loginFn);

    fireEvent.change(screen.getByPlaceholderText(/your@email.com/i), {
      target: { value: "bad@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/••••••••/), {
      target: { value: "wrong" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() =>
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument()
    );
  });

  test("shows demo accounts section", () => {
    renderLogin();
    expect(screen.getByText(/demo accounts/i)).toBeInTheDocument();
    expect(screen.getByText(/patient@medai.com/i)).toBeInTheDocument();
  });
});
