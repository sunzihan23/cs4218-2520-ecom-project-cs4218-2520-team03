// Trinh Hoai Song Thu, A0266248W
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import axios from "axios";
import toast from "react-hot-toast";
import CreateCategory from "./CreateCategory";
import "@testing-library/jest-dom";

jest.mock("axios");
jest.mock("react-hot-toast");
jest.mock("./../../components/Layout", () => ({ children, title }) => (
  <div data-testid="layout">
    {title}
    {children}
  </div>
));
jest.mock("./../../components/AdminMenu", () => () => <div>AdminMenu</div>);

describe("CreateCategory Component", () => {
  const mockCategories = [
    { _id: "1", name: "Electronics" },
    { _id: "2", name: "Books" },
    { _id: "3", name: "Clothing" },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    axios.get.mockResolvedValue({
      data: { success: true, category: mockCategories },
    });
  });

  test("renders submission form and creates a new category", async () => {
    axios.post.mockResolvedValue({ data: { success: true } });
    render(<CreateCategory />);
    fireEvent.change(screen.getByPlaceholderText(/enter new category/i), {
      target: { value: "Test" },
    });
    fireEvent.click(screen.getByRole("button", { name: /submit/i }));
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith("Test is created"),
    );
  });

  test("does not submit when input is empty", async () => {
    render(<CreateCategory />);
    fireEvent.click(screen.getByRole("button", { name: /submit/i }));
    await waitFor(() => {
      expect(axios.post).not.toHaveBeenCalled();
    });
  });

  test("does not submit when input is whitespace", async () => {
    render(<CreateCategory />);
    fireEvent.change(screen.getByPlaceholderText(/enter new category/i), {
      target: { value: "   " },
    });
    fireEvent.click(screen.getByRole("button", { name: /submit/i }));
    await waitFor(() => {
      expect(axios.post).not.toHaveBeenCalled();
    });
  });

  test("shows error toast when category creation API returns success: false", async () => {
    axios.post.mockResolvedValue({
      data: { success: false, message: "Already exists" },
    });
    render(<CreateCategory />);

    fireEvent.change(screen.getByPlaceholderText(/enter new category/i), {
      target: { value: "Existing" },
    });
    fireEvent.click(screen.getByRole("button", { name: /submit/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Already exists");
    });
  });

  test("does not set categories after fetching if data.success is false", async () => {
    axios.get.mockResolvedValue({ data: { success: false } });
    render(<CreateCategory />);

    await waitFor(() => {
      expect(screen.queryByText("Electronics")).not.toBeInTheDocument();
    });
  });

  test("shows error toast when getting categories fails", async () => {
    axios.get.mockRejectedValue(new Error("Fetch failed"));
    render(<CreateCategory />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Something wwent wrong in getting catgeory",
      );
    });
  });

  test("shows error toast when updating category returns success: false", async () => {
    axios.put.mockResolvedValue({
      data: { success: false, message: "Update failed" },
    });
    render(<CreateCategory />);

    const editBtns = await screen.findAllByRole("button", { name: /^edit$/i });
    fireEvent.click(editBtns[0]);

    const updateBtn = screen.getAllByRole("button", { name: /submit/i })[1];
    fireEvent.click(updateBtn);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Update failed");
    });
  });

  test("shows error toast when update API throws an error", async () => {
    axios.put.mockRejectedValue(new Error("Network Error"));
    render(<CreateCategory />);

    const editBtns = await screen.findAllByRole("button", { name: /^edit$/i });
    fireEvent.click(editBtns[0]);

    const updateBtn = screen.getAllByRole("button", { name: /submit/i })[1];
    fireEvent.click(updateBtn);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Somtihing went wrong");
    });
  });

  test("shows error toast when deletion returns success: false", async () => {
    axios.delete.mockResolvedValue({
      data: { success: false, message: "Cannot delete" },
    });
    render(<CreateCategory />);

    const deleteBtns = await screen.findAllByRole("button", {
      name: /^delete$/i,
    });
    fireEvent.click(deleteBtns[0]);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Cannot delete");
    });
  });

  test("shows error toast when delete API throws an error", async () => {
    axios.delete.mockRejectedValue(new Error("Server error"));
    render(<CreateCategory />);

    const deleteBtns = await screen.findAllByRole("button", {
      name: /^delete$/i,
    });
    await fireEvent.click(deleteBtns[0]);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Somtihing went wrong");
    });
  });

  test("shows error toast when handleSubmit throws an error", async () => {
    axios.post.mockRejectedValue(new Error("Submission error"));
    render(<CreateCategory />);

    fireEvent.change(screen.getByPlaceholderText(/enter new category/i), {
      target: { value: "ErrorCat" },
    });
    fireEvent.click(screen.getByRole("button", { name: /submit/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("error: Submission error");
    });
  });

  test("shows success toast when update category is successful", async () => {
    axios.put.mockResolvedValue({ data: { success: true } });
    render(<CreateCategory />);

    const editBtns = await screen.findAllByRole("button", { name: /^edit$/i });
    fireEvent.click(editBtns[0]);

    const nameInput = screen.getByDisplayValue("Electronics");
    fireEvent.change(nameInput, { target: { value: "UpdatedElectronics" } });

    const updateBtn = screen.getAllByRole("button", { name: /submit/i })[1];
    fireEvent.click(updateBtn);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        "UpdatedElectronics is updated",
      );
    });
  });

  test("shows success toast when delete category is successful", async () => {
    axios.delete.mockResolvedValue({ data: { success: true } });
    render(<CreateCategory />);

    const deleteBtns = await screen.findAllByRole("button", {
      name: /^delete$/i,
    });
    fireEvent.click(deleteBtns[0]);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("category is deleted");
    });
  });
  test("closes the modal when cancelled", async () => {
    axios.put.mockResolvedValue({ data: { success: true } });
    render(<CreateCategory />);
    expect(
      screen.queryByRole("dialog", { name: /edit category/i }),
    ).not.toBeInTheDocument();
    const editBtns = await screen.findAllByRole("button", { name: /^edit$/i });
    fireEvent.click(editBtns[0]);
    const dialog = await screen.findByRole("dialog", {
      name: /edit category/i,
    });
    expect(dialog).toBeInTheDocument();

    const closeBtn = dialog.querySelector(".ant-modal-close");
    fireEvent.click(closeBtn);

    await waitFor(() =>
      expect(
        screen.queryByRole("dialog", { name: /edit category/i }),
      ).not.toBeInTheDocument(),
    );
  });
});
