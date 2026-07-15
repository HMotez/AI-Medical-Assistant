import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import HealthTrends from "../pages/patient/HealthTrends";

jest.mock("../api/axiosClient", () => ({ get: jest.fn() }));
import axiosClient from "../api/axiosClient";

const MOCK_POINTS = [
  {
    analysis_id: 1,
    date: "2025-06-01T10:00:00Z",
    top_disease: "Fungal infection",
    confidence: 0.88,
    urgency: "low",
    rank_shift: null,
  },
  {
    analysis_id: 2,
    date: "2025-06-15T10:00:00Z",
    top_disease: "Fungal infection",
    confidence: 0.72,
    urgency: "low",
    rank_shift: 0,
  },
  {
    analysis_id: 3,
    date: "2025-07-01T10:00:00Z",
    top_disease: "Acne",
    confidence: 0.65,
    urgency: "low",
    rank_shift: -1,
  },
];

function renderTrends() {
  return render(
    <AuthContext.Provider value={{ user: { full_name: "Test User", role: "patient" } }}>
      <MemoryRouter>
        <HealthTrends />
      </MemoryRouter>
    </AuthContext.Provider>
  );
}

describe("HealthTrends page", () => {
  beforeEach(() => jest.clearAllMocks());

  test("shows loading spinner initially", () => {
    axiosClient.get.mockReturnValue(new Promise(() => {}));
    renderTrends();
    expect(document.querySelector(".animate-spin")).toBeInTheDocument();
  });

  test("renders summary cards with data", async () => {
    axiosClient.get.mockResolvedValue({ data: MOCK_POINTS });
    renderTrends();
    await waitFor(() => expect(screen.getByText("3")).toBeInTheDocument());
    expect(screen.getByText(/Analyses/i)).toBeInTheDocument();
  });

  test("renders disease names in timeline", async () => {
    axiosClient.get.mockResolvedValue({ data: MOCK_POINTS });
    renderTrends();
    await waitFor(() =>
      expect(screen.getByText("Fungal infection")).toBeInTheDocument()
    );
    expect(screen.getByText("Acne")).toBeInTheDocument();
  });

  test("shows empty state when no data", async () => {
    axiosClient.get.mockResolvedValue({ data: [] });
    renderTrends();
    await waitFor(() =>
      expect(screen.getByText(/No analyses yet/i)).toBeInTheDocument()
    );
  });

  test("shows error state on API failure", async () => {
    axiosClient.get.mockRejectedValue(new Error("Network error"));
    renderTrends();
    await waitFor(() =>
      expect(screen.getByText(/Unable to load trend data/i)).toBeInTheDocument()
    );
  });
});
