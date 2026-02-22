// Trinh Hoai Song Thu, A0266248W
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

const getCategorySelect = () => screen.getAllByRole("combobox")[0];
const getShippingSelect = () => screen.getAllByRole("combobox")[1];

const selectCategory = (value) =>
  fireEvent.change(getCategorySelect(), { target: { value } });

const selectShipping = (value) =>
  fireEvent.change(getShippingSelect(), { target: { value } });

const mockFetchSuccess = (product = mockProduct, categories = mockCategories) => {
  axios.get
    .mockResolvedValueOnce({ data: { product } })
    .mockResolvedValueOnce({ data: { success: true, category: categories } });
};

const mockFetchSampleProduct = () => {
  axios.get
    .mockResolvedValueOnce({
      data: {
        product: {
          _id: "1",
          name: "Book",
          description: "Sample Book",
          price: "100",
          quantity: "90",
          shipping: true,
          category: { _id: "c1" },
        },
      },
    })
    .mockResolvedValueOnce({ data: { success: true, category: [] } });
};

const mockPrompt = (answer) => {
  const spy = jest.spyOn(window, "prompt").mockReturnValue(answer);
  return () => spy.mockRestore();
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
    global.URL.createObjectURL = jest.fn(() => "mock-url");
  });

  const renderComponent = () =>
    render(
      <BrowserRouter>
        <UpdateProduct />
      </BrowserRouter>,
    );
  const renderAndWaitLoaded = async () => {
    renderComponent();
    await waitFor(() =>
      expect(screen.getByText("UPDATE PRODUCT")).toBeInTheDocument()
    );
  };

  test("renders the submission form with all fields", async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByPlaceholderText("write a name")).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("write a description"),
      ).toBeInTheDocument();
      expect(screen.getByPlaceholderText("write a Price")).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("write a quantity"),
      ).toBeInTheDocument();
      expect(screen.getAllByRole("combobox").length).toBe(2);
      expect(screen.getByText("UPDATE PRODUCT")).toBeInTheDocument();
      expect(screen.getByText("DELETE PRODUCT")).toBeInTheDocument();
    });
  });

  test("should fetch and display product details", async () => {
    mockFetchSuccess();
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
      expect(toast.error).toHaveBeenCalledWith(
        "Something wwent wrong in getting catgeory",
      );
    });
  });

  test("should handle update product form submission", async () => {
    mockFetchSuccess();

    axios.put.mockResolvedValueOnce({
      data: { success: true },
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

    selectCategory("2");
    selectShipping("true");
    const file = new File(["photo"], "photo.png", { type: "image/png" });
    const uploadLabel = screen.getByText("Upload Photo");
    const input = uploadLabel
      .closest("label")
      .querySelector('input[type="file"]');

    fireEvent.change(input, { target: { files: [file] } });

    fireEvent.click(screen.getByText("UPDATE PRODUCT"));

    await waitFor(() => {
      expect(appendMock).toHaveBeenCalledWith("name", "Updated Shirt");
      expect(appendMock).toHaveBeenCalledWith(
        "description",
        "Updated Test Shirt",
      );
      expect(appendMock).toHaveBeenCalledWith("price", "150");
      expect(appendMock).toHaveBeenCalledWith("quantity", "20");
      expect(appendMock).toHaveBeenCalledWith("category", "2");
      expect(appendMock).toHaveBeenCalledWith("shipping", true);
      expect(axios.put).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith(
        "Product Updated Successfully",
      );
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard/admin/products");
    });
  });

  test("should handle product deletion", async () => {
    mockFetchSuccess();

    axios.delete.mockResolvedValueOnce({ data: { success: true } });
    const restore = mockPrompt("Yes");

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("DELETE PRODUCT")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("DELETE PRODUCT"));

    await waitFor(() => {
      expect(axios.delete).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith(
        "Product Deleted Successfully",
      );
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard/admin/products");
    });

    restore();
  });

  test("shows error toast on delete cancellation", async () => {
    mockFetchSuccess();
    const restore = mockPrompt("No");
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("DELETE PRODUCT")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("DELETE PRODUCT"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Product deletion canceled.");
    });

    restore();
  });

  test("shows error toast on delete failure", async () => {
    axios.delete.mockRejectedValueOnce(new Error("Delete failed"));
    const restore = mockPrompt("Yes");

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("DELETE PRODUCT")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("DELETE PRODUCT"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Something went wrong");
    });
    restore();
  });

  test("shows error toast on missing fields when update product", async () => {
    mockFetchSuccess();

    axios.put.mockRejectedValueOnce(new Error("Update failed"));

    renderAndWaitLoaded();

    fireEvent.click(screen.getByText("UPDATE PRODUCT"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Please fill all required fields",
      );
    });
  });

  test("shows error toast on invalid price update product", async () => {
    mockFetchSuccess();

    axios.put.mockRejectedValueOnce(new Error("Update failed"));

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("UPDATE PRODUCT")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText("write a Price"), {
      target: { value: "-10" },
    });
    const file = new File(["photo"], "photo.png", { type: "image/png" });
    
    const uploadLabel = screen.getByText("Upload Photo");
    const input = uploadLabel
      .closest("label")
      .querySelector('input[type="file"]');

    fireEvent.change(input, { target: { files: [file] } });
    fireEvent.click(screen.getByText("UPDATE PRODUCT"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Price must be greater than 0");
    });
  });

  test("shows error toast on invalid quantity update product", async () => {
    mockFetchSuccess();

    axios.put.mockRejectedValueOnce(new Error("Update failed"));

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("UPDATE PRODUCT")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText("write a quantity"), {
      target: { value: "-5" },
    });
    const file = new File(["photo"], "photo.png", { type: "image/png" });
    
    const uploadLabel = screen.getByText("Upload Photo");
    const input = uploadLabel
      .closest("label")
      .querySelector('input[type="file"]');

    fireEvent.change(input, { target: { files: [file] } });
    fireEvent.click(screen.getByText("UPDATE PRODUCT"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Quantity must be greater than or equal to 0",
      );
    });
  });

  test("updates shipping value based on selected option", async () => {
    mockFetchSuccess();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByDisplayValue("Shirt")).toBeInTheDocument();
    });

    selectShipping("true");
    await waitFor(() => {
      expect(getShippingSelect()).toHaveValue("true");
    });

    selectShipping("false");
    await waitFor(() => {
      expect(getShippingSelect()).toHaveValue("false");
    });
  });

  test("shows error toast on update failure", async () => {
    mockFetchSuccess();

    axios.put.mockRejectedValueOnce(new Error("Update failed"));

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("UPDATE PRODUCT")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("write a name")).toHaveValue(
        mockProduct.name,
      );
      expect(screen.getByPlaceholderText("write a description")).toHaveValue(
        mockProduct.description,
      );
      expect(screen.getByPlaceholderText("write a Price")).toHaveValue(100);
      expect(screen.getByPlaceholderText("write a quantity")).toHaveValue(10);
    });
    const file = new File(["photo"], "photo.png", { type: "image/png" });
    
          const uploadLabel = screen.getByText("Upload Photo");
          const input = uploadLabel
            .closest("label")
            .querySelector('input[type="file"]');
    
          fireEvent.change(input, { target: { files: [file] } });
    fireEvent.click(screen.getByText("UPDATE PRODUCT"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("something went wrong");
    });
  });
  test("shows error toast when missing photo on form submission", async () => {
    mockFetchSampleProduct();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByPlaceholderText("write a name")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText("write a name"), {
      target: { value: "Test Product" },
    });
    fireEvent.change(screen.getByPlaceholderText("write a description"), {
      target: { value: "Test Description" },
    });
    fireEvent.change(screen.getByPlaceholderText("write a Price"), {
      target: { value: "100" },
    });
    fireEvent.change(screen.getByPlaceholderText("write a quantity"), {
      target: { value: "10" },
    });

    fireEvent.click(screen.getByText("UPDATE PRODUCT"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "A photo of the product is required",
      );
    }); 
  });

  test("shows error toast when photo size exceeds limit on form submission", async () => {  
    mockFetchSampleProduct();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByPlaceholderText("write a name")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText("write a name"), {
      target: { value: "Test Product" },
    });
    fireEvent.change(screen.getByPlaceholderText("write a description"), {
      target: { value: "Test Description" },
    });
    fireEvent.change(screen.getByPlaceholderText("write a Price"), {
      target: { value: "100" },
    });
    fireEvent.change(screen.getByPlaceholderText("write a quantity"), {
      target: { value: "10" },
    });

    const file = new File([new ArrayBuffer(2_000_000)], "photo.png", {
      type: "image/png",
    });
    const uploadLabel = screen.getByText("Upload Photo");
    const input = uploadLabel
      .closest("label")
      .querySelector('input[type="file"]');

    fireEvent.change(input, { target: { files: [file] } });
    fireEvent.click(screen.getByText("UPDATE PRODUCT"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Photo should be less than 1mb",
      );
    });
  });
});
