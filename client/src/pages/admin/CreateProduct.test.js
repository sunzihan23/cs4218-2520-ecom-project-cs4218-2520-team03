import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import CreateProduct from "./CreateProduct";
import { Select } from "antd";

jest.mock("axios");
jest.mock("react-hot-toast");
jest.mock("./../../components/Layout", () => {
  return function Layout({ children, title }) {
    return <div data-testid="layout">{children}</div>;
  };
});
jest.mock("./../../components/AdminMenu", () => {
  return function AdminMenu() {
    return <div data-testid="admin-menu">Admin Menu</div>;
  };
});

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

const mockCategories = [
  { _id: "1", name: "Electronics" },
  { _id: "2", name: "Clothing" },
  { _id: "3", name: "Books" },
];

jest.mock("antd", () => {
  const antd = jest.requireActual("antd");
  const Select = ({ children, onChange }) => {
    return (
      <select onChange={(e) => onChange(e.target.value)}>{children}</select>
    );
  };
  Select.Option = ({ children, ...otherProps }) => {
    return <option {...otherProps}>{children}</option>;
  };

  return {
    ...antd,
    Select,
  };
});

describe("CreateProduct Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
    toast.error.mockClear();
    toast.success.mockClear();
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <CreateProduct />
      </BrowserRouter>,
    );
  };

  describe("Component Rendering", () => {
    test("renders the submission form with all fields", async () => {
      axios.get.mockResolvedValue({
        data: { success: true, category: mockCategories },
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Create Product")).toBeInTheDocument();
      });

      expect(screen.getByText("Upload Photo")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("write a name")).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("write a description"),
      ).toBeInTheDocument();
      expect(screen.getByPlaceholderText("write a Price")).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("write a quantity"),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "CREATE PRODUCT" }),
      ).toBeInTheDocument();
    });

    test("should render Layout and AdminMenu components", async () => {
      axios.get.mockResolvedValue({
        data: { success: true, category: mockCategories },
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId("layout")).toBeInTheDocument();
        expect(screen.getByTestId("admin-menu")).toBeInTheDocument();
      });
    });
  });

  describe("Test Create Product Form", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    test("fetches the categories on mount", async () => {
      axios.get.mockResolvedValue({
        data: { success: true, category: mockCategories },
      });

      renderComponent();

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
      });
    });

    test("updates form values on input change", async () => {
      axios.get.mockResolvedValue({
        data: { success: true, category: mockCategories },
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByPlaceholderText("write a name")).toBeInTheDocument();
      });

      const nameInput = screen.getByPlaceholderText("write a name");
      const descriptionInput = screen.getByPlaceholderText(
        "write a description",
      );
      const priceInput = screen.getByPlaceholderText("write a Price");
      const quantityInput = screen.getByPlaceholderText("write a quantity");

      fireEvent.change(nameInput, { target: { value: "Test Product" } });
      fireEvent.change(descriptionInput, {
        target: { value: "This is a pencil" },
      });
      fireEvent.change(priceInput, { target: { value: "18" } });
      fireEvent.change(quantityInput, { target: { value: "200" } });

      expect(nameInput.value).toBe("Test Product");
      expect(descriptionInput.value).toBe("This is a pencil");
      expect(priceInput.value).toBe("18");
      expect(quantityInput.value).toBe("200");

      const selects = screen.getAllByRole("combobox");
      const select = selects[0];
      fireEvent.change(select, { target: { value: "2" } });
      expect(select.value).toBe("2");
    });

    test("creates product on successful form submission", async () => {
      const mockedProduct = {
        name: "Hoodie",
        description: "This is a hoodie.",
        price: "50.00",
        quantity: "150",
        category: "Clothing",
      };
      axios.get.mockResolvedValue({
        data: { success: true, category: mockCategories },
      });
      axios.post.mockResolvedValue({
        data: { success: true },
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByPlaceholderText("write a name")).toBeInTheDocument();
      });

      fireEvent.change(screen.getByPlaceholderText("write a name"), {
        target: { value: mockedProduct.name },
      });
      fireEvent.change(screen.getByPlaceholderText("write a description"), {
        target: { value: mockedProduct.description },
      });
      fireEvent.change(screen.getByPlaceholderText("write a Price"), {
        target: { value: mockedProduct.price },
      });
      fireEvent.change(screen.getByPlaceholderText("write a quantity"), {
        target: { value: mockedProduct.quantity },
      });

      const selects = screen.getAllByRole("combobox");
      const select = selects[0];
      fireEvent.change(select, { target: { value: "2" } });
      fireEvent.click(screen.getByRole("button", { name: "CREATE PRODUCT" }));

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalled();
      });
    });
  });

  test("shows error toast when fetching categories fails", async () => {
    axios.get.mockRejectedValue(new Error("Fetch failed"));

    renderComponent();

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Something wwent wrong in getting catgeory",
      );
    });
  });

  test("shows success toast and redirects on successful product creation", async () => {
    axios.get.mockResolvedValue({
      data: { success: true, category: mockCategories },
    });
    axios.post.mockResolvedValue({
      data: { success: true },
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByPlaceholderText("write a name")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText("write a name"), {
      target: { value: "iPad" },
    });
    fireEvent.change(screen.getByPlaceholderText("write a description"), {
      target: { value: "This is an iPad" },
    });
    fireEvent.change(screen.getByPlaceholderText("write a Price"), {
      target: { value: "999.99" },
    });
    fireEvent.change(screen.getByPlaceholderText("write a quantity"), {
      target: { value: "17" },
    });

    const selects = screen.getAllByRole("combobox");
    const select = selects[0];
    fireEvent.change(select, { target: { value: "1" } });
    fireEvent.click(screen.getByRole("button", { name: "CREATE PRODUCT" }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        "Product Created Successfully",
      );
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard/admin/products");
    });
  });

  test("shows error toast on product creation failure", async () => {
    axios.get.mockResolvedValue({
      data: { success: true, category: mockCategories },
    });
    axios.post.mockResolvedValue({
      data: { success: false, message: "Creation failed" },
    });
    renderComponent();

    await waitFor(() => {
      expect(screen.getByPlaceholderText("write a name")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText("write a name"), {
      target: { value: "Notebook" },
    });
    fireEvent.change(screen.getByPlaceholderText("write a description"), {
      target: { value: "This is a notebook." },
    });
    fireEvent.change(screen.getByPlaceholderText("write a Price"), {
      target: { value: "222" },
    });
    fireEvent.change(screen.getByPlaceholderText("write a quantity"), {
      target: { value: "20" },
    });

    const selects = screen.getAllByRole("combobox");
    const select = selects[0];
    fireEvent.change(select, { target: { value: "3" } });
    fireEvent.click(screen.getByRole("button", { name: "CREATE PRODUCT" }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Create product failed");
    });
  });

  test("shows error toast on product creation exception", async () => {
    axios.get.mockResolvedValue({
      data: { success: true, category: mockCategories },
    });
    axios.post.mockRejectedValue(new Error("Creation exception"));

    renderComponent();

    await waitFor(() => {
      expect(screen.getByPlaceholderText("write a name")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText("write a name"), {
      target: { value: "Headphones" },
    });
    fireEvent.change(screen.getByPlaceholderText("write a description"), {
      target: { value: "This is a headphones." },
    });
    fireEvent.change(screen.getByPlaceholderText("write a Price"), {
      target: { value: "101" },
    });
    fireEvent.change(screen.getByPlaceholderText("write a quantity"), {
      target: { value: "100" },
    });

    const selects = screen.getAllByRole("combobox");
    const select = selects[0];
    fireEvent.change(select, { target: { value: "1" } });
    fireEvent.click(screen.getByRole("button", { name: "CREATE PRODUCT" }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("something went wrong");
    });
  });

  test("replaces existing photo when a new photo is selected", async () => {
    global.URL.createObjectURL = jest.fn(() => "blob:mock-url");
    axios.get.mockResolvedValue({
      data: { success: true, category: mockCategories },
    });

    const appendMock = jest.fn();
    global.FormData = jest.fn(() => ({ append: appendMock }));

    renderComponent();

    const file = new File(["photo"], "photo.png", { type: "image/png" });
    const input = document.querySelector('input[type="file"]');

    fireEvent.change(input, { target: { files: [file] } });
    await screen.findByText("photo.png");
    fireEvent.click(screen.getByText("CREATE PRODUCT"));

    await waitFor(() => {
      expect(appendMock).toHaveBeenCalledWith("photo", file);
    });
  });

  test("updates shipping value on selection change", async () => {
    axios.get.mockResolvedValue({
      data: { success: true, category: mockCategories },
    });
    const appendMock = jest.fn();
    global.FormData = jest.fn(() => ({ append: appendMock }));

    renderComponent();

    await waitFor(() => {
      expect(screen.getByPlaceholderText("write a name")).toBeInTheDocument();
    });
    const selects = screen.getAllByRole("combobox");
    const select = selects[1];
    fireEvent.change(select, { target: { value: "true" } });

    await waitFor(() => {
      expect(select.value).toBe("true");
    });
    fireEvent.change(select, { target: { value: "false" } });

    await waitFor(() => {
      expect(select.value).toBe("false");
    });
  });
});
