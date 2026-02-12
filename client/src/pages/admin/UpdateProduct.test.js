import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import UpdateProduct from "./UpdateProduct";

jest.mock("axios");
jest.mock("react-hot-toast");

jest.mock("./../../components/Layout", () => {
  return function Layout({ children }) {
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
  useParams: () => ({ slug: "test-slug" }),
}));

const mockCategories = [
  { _id: "1", name: "Electronics" },
  { _id: "2", name: "Clothing" },
  { _id: "3", name: "Books" },
];

const mockProduct = {
  _id: "1",
  name: "Shirt",
  description: "Test Shirt",
  price: "100",
  quantity: "10",
  shipping: true,
  category: { _id: "2", name: "Clothing" },
};

jest.mock("antd", () => {
  const antd = jest.requireActual("antd");
  const Select = ({ children, onChange, value, ...props }) => {
    const v = value === undefined || value === null ? "" : String(value);
    return (
      <select
        role="combobox"
        aria-label={props.placeholder || "select"}
        value={v}
        onChange={(e) => {
          const next = e.target.value;
          if (next === "true") return onChange(true);
          if (next === "false") return onChange(false);
          return onChange(next);
        }}
      >
        {children}
      </select>
    );
  };

  Select.Option = ({ children, value, ...rest }) => (
    <option value={String(value)} {...rest}>
      {children}
    </option>
  );

  return { ...antd, Select };
});

describe("UpdateProduct Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = () =>
    render(
      <BrowserRouter>
        <UpdateProduct />
      </BrowserRouter>,
    );

  test("renders the submission form with all fields", async () => {
    axios.get
      .mockResolvedValueOnce({
        data: {
          product: {
            _id: "1",
            name: "",
            description: "",
            price: "",
            quantity: "",
            shipping: false,
            category: { _id: "c1" },
          },
        },
      })
      .mockResolvedValueOnce({ data: { success: true, category: [] } });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByPlaceholderText("write a name")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("write a description")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("write a Price")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("write a quantity")).toBeInTheDocument();
      expect(screen.getAllByRole("combobox").length).toBe(2);
      expect(screen.getByText("UPDATE PRODUCT")).toBeInTheDocument();
      expect(screen.getByText("DELETE PRODUCT")).toBeInTheDocument();
    });
  });

  test("should fetch and display product details", async () => {
    axios.get
      .mockResolvedValueOnce({ data: { product: mockProduct } })
      .mockResolvedValueOnce({ data: { success: true, category: mockCategories } });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByDisplayValue("Shirt")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Test Shirt")).toBeInTheDocument();
      expect(screen.getByDisplayValue("100")).toBeInTheDocument();
      expect(screen.getByDisplayValue("10")).toBeInTheDocument();
    });
  });

  test("shows error toast on fetch failure", async () => {
    axios.get.mockRejectedValueOnce(new Error("Fetch failed"));

    renderComponent();

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Something wwent wrong in getting catgeory");
    });
  });

  test("should handle update product form submission", async () => {
    axios.get
      .mockResolvedValueOnce({ data: { product: mockProduct } })
      .mockResolvedValueOnce({ data: { success: true, category: mockCategories } });

    axios.put.mockResolvedValueOnce({
      data: { success: true, message: "Product updated successfully" },
    });

    const appendMock = jest.fn();
    global.FormData = jest.fn(() => ({ append: appendMock }));

    renderComponent();

    await waitFor(() => {
      expect(screen.getByDisplayValue("Shirt")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText("write a name"), {
      target: { value: "Updated Shirt" },
    });
    fireEvent.change(screen.getByPlaceholderText("write a description"), {
      target: { value: "Updated Test Shirt" },
    });
    fireEvent.change(screen.getByPlaceholderText("write a Price"), {
      target: { value: "150" },
    });
    fireEvent.change(screen.getByPlaceholderText("write a quantity"), {
      target: { value: "20" },
    });

    const [categorySelect, shippingSelect] = screen.getAllByRole("combobox");

    fireEvent.change(categorySelect, { target: { value: "2" } });
    fireEvent.change(shippingSelect, { target: { value: "true" } });

    fireEvent.click(screen.getByText("UPDATE PRODUCT"));

    await waitFor(() => {
      expect(appendMock).toHaveBeenCalledWith("name", "Updated Shirt");
      expect(appendMock).toHaveBeenCalledWith("description", "Updated Test Shirt");
      expect(appendMock).toHaveBeenCalledWith("price", "150");
      expect(appendMock).toHaveBeenCalledWith("quantity", "20");
      expect(appendMock).toHaveBeenCalledWith("category", "2");
      expect(appendMock).toHaveBeenCalledWith("shipping", true);
      expect(axios.put).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith("Product Updated Successfully");
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard/admin/products");
    });
  });

  test("should handle product deletion", async () => {
    axios.get
      .mockResolvedValueOnce({ data: { product: mockProduct } })
      .mockResolvedValueOnce({ data: { success: true, category: mockCategories } });

    axios.delete.mockResolvedValueOnce({ data: { success: true } });
    const promptSpy = jest.spyOn(window, "prompt").mockReturnValue("Yes");

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("DELETE PRODUCT")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("DELETE PRODUCT"));

    await waitFor(() => {
      expect(axios.delete).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith("Product Deleted Successfully");
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard/admin/products");
    });

    promptSpy.mockRestore();
  });

  test("shows error toast on delete cancellation", async () => {
    axios.get
      .mockResolvedValueOnce({ data: { product: mockProduct } })
      .mockResolvedValueOnce({ data: { success: true, category: mockCategories } });

    const promptSpy = jest.spyOn(window, "prompt").mockReturnValue("No");

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("DELETE PRODUCT")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("DELETE PRODUCT"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Product deletion canceled.");
    });

    promptSpy.mockRestore();
  });

  test("shows error toast on delete failure", async () => {
    axios.get
      .mockResolvedValueOnce({
        data: {
          product: {
            name: "Bookk",
            _id: "1",
            description: "d",
            price: 1,
            quantity: 1,
            shipping: false,
            category: { _id: "c1" },
          },
        },
      })
      .mockResolvedValueOnce({ data: { success: true, category: mockCategories } });

    axios.delete.mockRejectedValueOnce(new Error("Delete failed"));
    jest.spyOn(window, "prompt").mockReturnValue("Yes");

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("DELETE PRODUCT")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("DELETE PRODUCT"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Something went wrong");
    });
  });

  test("shows error toast on update failure exception", async () => {
    axios.get
      .mockResolvedValueOnce({ data: { product: mockProduct } })
      .mockResolvedValueOnce({ data: { success: true, category: mockCategories } });

    axios.put.mockRejectedValueOnce(new Error("Update failed"));

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("UPDATE PRODUCT")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("UPDATE PRODUCT"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("something went wrong");
    });
  });

  test("shows error toast on update failed response", async () => {
    axios.get
      .mockResolvedValueOnce({ data: { product: mockProduct } })
      .mockResolvedValueOnce({ data: { success: true, category: mockCategories } });

    axios.put.mockResolvedValueOnce({
      data: { success: false, message: "Update failed" },
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("UPDATE PRODUCT")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("UPDATE PRODUCT"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Update product failed");
    });
  });

  test("replaces existing photo when a new photo is selected", async () => {
    global.URL.createObjectURL = jest.fn(() => "blob:mock-url");

    axios.get
      .mockResolvedValueOnce({
        data: {
          product: {
            _id: "1",
            name: "",
            description: "",
            price: "",
            quantity: "",
            shipping: false,
            category: { _id: "c1" },
          },
        },
      })
      .mockResolvedValueOnce({ data: { success: true, category: [] } });

    axios.put.mockResolvedValueOnce({ data: { success: true } });

    const appendMock = jest.fn();
    global.FormData = jest.fn(() => ({ append: appendMock }));

    renderComponent();

    const file = new File(["photo"], "photo.png", { type: "image/png" });
    const input = document.querySelector('input[type="file"]');

    fireEvent.change(input, { target: { files: [file] } });
    await screen.findByText("photo.png");
    fireEvent.click(screen.getByText("UPDATE PRODUCT"));

    await waitFor(() => {
      expect(appendMock).toHaveBeenCalledWith("photo", file);
    });
  });

  test("updates shipping value based on selected option", async () => {
    axios.get
      .mockResolvedValueOnce({ data: { product: mockProduct } })
      .mockResolvedValueOnce({ data: { success: true, category: mockCategories } });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByDisplayValue("Shirt")).toBeInTheDocument();
    });

    const selects = screen.getAllByRole("combobox");
    const shippingSelect = selects[1];

    fireEvent.change(shippingSelect, { target: { value: "true" } });
    await waitFor(() => {
      expect(shippingSelect.value).toBe("true");
    });

    fireEvent.change(shippingSelect, { target: { value: "false" } });
    await waitFor(() => {
      expect(shippingSelect.value).toBe("false");
    });
  });
});