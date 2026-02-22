// Trinh Hoai Song Thu, A0266248W
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import CreateProduct from "./CreateProduct";

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
  beforeAll(() => {
    // Stable global stub
    global.URL.createObjectURL = jest.fn(() => "mock-url");
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <CreateProduct />
      </BrowserRouter>,
    );
  };

  const mockGetCategoriesSuccess = () => {
    axios.get.mockResolvedValue({
      data: { success: true, category: mockCategories },
    });
  };

  const mockGetCategoriesFail = (err = new Error("Fetch failed")) => {
    axios.get.mockRejectedValue(err);
  };

  const renderReady = async () => {
    mockGetCategoriesSuccess();
    renderComponent();
    await waitFor(() => {
      expect(screen.getByPlaceholderText("write a name")).toBeInTheDocument();
    });
  };

  const getInputs = () => ({
    name: screen.getByPlaceholderText("write a name"),
    description: screen.getByPlaceholderText("write a description"),
    price: screen.getByPlaceholderText("write a Price"),
    quantity: screen.getByPlaceholderText("write a quantity"),
  });

  const fillFields = ({
    name = "",
    description = "",
    price = "",
    quantity = "",
  } = {}) => {
    const inputs = getInputs();
    if (name !== undefined)
      fireEvent.change(inputs.name, { target: { value: name } });
    if (description !== undefined)
      fireEvent.change(inputs.description, { target: { value: description } });
    if (price !== undefined)
      fireEvent.change(inputs.price, { target: { value: price } });
    if (quantity !== undefined)
      fireEvent.change(inputs.quantity, { target: { value: quantity } });
  };

  const getSelects = () => screen.getAllByRole("combobox");

  const selectCategory = (categoryId) => {
    const categorySelect = getSelects()[0];
    fireEvent.change(categorySelect, { target: { value: String(categoryId) } });
    return categorySelect;
  };

  const selectShipping = (value) => {
    const shippingSelect = getSelects()[1];
    fireEvent.change(shippingSelect, { target: { value: String(value) } });
    return shippingSelect;
  };

  const getPhotoInput = () => {
    const uploadLabel = screen.getByText("Upload Photo");
    const input = uploadLabel
      .closest("label")
      ?.querySelector('input[type="file"]');

    if (!input) {
      throw new Error("Photo input not found (check Upload Photo markup)");
    }
    return input;
  };

  const makePngFile = (contents = "photo", name = "photo.png") =>
    new File([contents], name, { type: "image/png" });

  const uploadPhoto = (file = makePngFile()) => {
    const input = getPhotoInput();
    fireEvent.change(input, { target: { files: [file] } });
    return file;
  };

  const submitForm = () => {
    fireEvent.click(screen.getByRole("button", { name: "CREATE PRODUCT" }));
  };

  const fillValidProduct = ({
    name = "Test Product",
    description = "This is a pencil",
    price = "18",
    quantity = "200",
    categoryId = "2",
    withPhoto = true,
    file = undefined,
  } = {}) => {
    fillFields({ name, description, price, quantity });
    selectCategory(categoryId);
    if (withPhoto) uploadPhoto(file);
  };

  describe("Component Rendering", () => {
    test("renders the submission form with all fields", async () => {
      await renderReady();

      expect(screen.getByText("Create Product")).toBeInTheDocument();
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
      await renderReady();

      expect(screen.getByTestId("layout")).toBeInTheDocument();
      expect(screen.getByTestId("admin-menu")).toBeInTheDocument();
    });
  });

  describe("Test Create Product Form", () => {
    test("fetches the categories on mount", async () => {
      await renderReady();

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
      });
    });

    test("updates form values on input change", async () => {
      await renderReady();

      fillFields({
        name: "Test Product",
        description: "This is a pencil",
        price: "18",
        quantity: "200",
      });

      const { name, description, price, quantity } = getInputs();
      expect(name.value).toBe("Test Product");
      expect(description.value).toBe("This is a pencil");
      expect(price.value).toBe("18");
      expect(quantity.value).toBe("200");

      const catSelect = selectCategory("2");
      expect(catSelect.value).toBe("2");
    });

    test("shows error toast when required fields are missing on form submission", async () => {
      await renderReady();

      submitForm();

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          "Please fill all required fields",
        );
      });
    });

    test("shows error toast on invalid price input", async () => {
      await renderReady();

      fillValidProduct({ price: "-5" });

      submitForm();

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Price must be greater than 0");
      });
    });

    test("shows error toast on invalid quantity input", async () => {
      await renderReady();

      fillValidProduct({ price: "5", quantity: "-10" });

      submitForm();

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          "Quantity must be greater than or equal to 0",
        );
      });
    });

    test("creates product on successful form submission", async () => {
      axios.post.mockResolvedValue({ data: { success: true } });

      await renderReady();

      fillValidProduct({
        name: "Hoodie",
        description: "This is a hoodie.",
        price: "50.00",
        quantity: "150",
        categoryId: "2",
      });

      submitForm();

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalled();
      });
    });
  });

  test("shows error toast when fetching categories fails", async () => {
    mockGetCategoriesFail(new Error("Fetch failed"));
    renderComponent();

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Something wwent wrong in getting catgeory",
      );
    });
  });

  test("shows success toast and redirects on successful product creation", async () => {
    axios.post.mockResolvedValue({ data: { success: true } });

    await renderReady();

    fillValidProduct({
      name: "iPad",
      description: "This is an iPad",
      price: "999.99",
      quantity: "17",
      categoryId: "1",
    });

    submitForm();

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        "Product Created Successfully",
      );
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard/admin/products");
    });
  });

  test("shows error toast on product creation failure", async () => {
    axios.post.mockResolvedValue({
      data: { success: false, message: "Creation failed" },
    });

    await renderReady();

    fillValidProduct({
      name: "Notebook",
      description: "This is a notebook.",
      price: "222",
      quantity: "20",
      categoryId: "3",
    });

    submitForm();

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Create product failed");
    });
  });

  test("shows error toast on product creation exception", async () => {
    axios.post.mockRejectedValue(new Error("Creation exception"));

    await renderReady();

    fillValidProduct({
      name: "Headphones",
      description: "This is a headphones.",
      price: "101",
      quantity: "100",
      categoryId: "1",
    });

    submitForm();

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Creation exception");
    });
  });

  test("updates shipping value on selection change", async () => {
    const appendMock = jest.fn();
    global.FormData = jest.fn(() => ({ append: appendMock }));

    await renderReady();

    const shipSelect1 = selectShipping("true");
    expect(shipSelect1.value).toBe("true");

    const shipSelect2 = selectShipping("false");
    expect(shipSelect2.value).toBe("false");
  });

  test("shows error toast when missing photo on form submission", async () => {
    await renderReady();

    fillValidProduct({ withPhoto: false });

    submitForm();

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "A photo of the product is required",
      );
    });
  });

  test("shows error toast when photo size exceeds limit on form submission", async () => {
    await renderReady();

    const tooLargeFile = makePngFile("a".repeat(1_000_001));
    fillValidProduct({ file: tooLargeFile });

    submitForm();

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Photo should be less than 1mb");
    });
  });
});