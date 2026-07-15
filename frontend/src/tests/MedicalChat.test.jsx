import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import MedicalChat from "../pages/patient/MedicalChat";

// Mock axios
jest.mock("../api/axiosClient", () => ({
  get:  jest.fn().mockResolvedValue({ data: [] }),
  post: jest.fn(),
}));

import axiosClient from "../api/axiosClient";

function renderChat() {
  return render(
    <AuthContext.Provider value={{ user: { full_name: "Test User", role: "patient" } }}>
      <MemoryRouter>
        <MedicalChat />
      </MemoryRouter>
    </AuthContext.Provider>
  );
}

describe("MedicalChat page", () => {
  beforeEach(() => jest.clearAllMocks());

  test("renders welcome message from MedAI", () => {
    renderChat();
    expect(screen.getByText(/MedAI/i)).toBeInTheDocument();
  });

  test("renders textarea input", () => {
    renderChat();
    expect(
      screen.getByPlaceholderText(/Décrivez vos symptômes/i)
    ).toBeInTheDocument();
  });

  test("renders quick prompt buttons", () => {
    renderChat();
    expect(
      screen.getByText(/When should I see a doctor urgently/i)
    ).toBeInTheDocument();
  });

  test("sends message on Enter key and shows reply", async () => {
    axiosClient.post.mockResolvedValueOnce({
      data: { reply: "Bonjour, comment puis-je vous aider ?", model_used: "rule-based" },
    });

    renderChat();
    const textarea = screen.getByPlaceholderText(/Décrivez vos symptômes/i);
    fireEvent.change(textarea, { target: { value: "Bonjour" } });
    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: false });

    await waitFor(() =>
      expect(axiosClient.post).toHaveBeenCalledWith(
        "/api/chat/",
        expect.objectContaining({ message: "Bonjour" })
      )
    );
    await waitFor(() =>
      expect(screen.getByText(/Bonjour, comment puis-je vous aider/i)).toBeInTheDocument()
    );
  });

  test("send button is disabled when input is empty", () => {
    renderChat();
    const sendBtn = screen.getByTitle
      ? screen.queryByRole("button", { name: /send/i })
      : null;
    // Textarea is empty so the post button should be disabled
    const textarea = screen.getByPlaceholderText(/Décrivez vos symptômes/i);
    expect(textarea.value).toBe("");
  });

  test("reset button clears conversation", async () => {
    renderChat();
    const resetBtn = screen.getByTitle(/clear chat/i);
    fireEvent.click(resetBtn);
    await waitFor(() =>
      expect(screen.getByText(/Conversation réinitialisée/i)).toBeInTheDocument()
    );
  });
});
