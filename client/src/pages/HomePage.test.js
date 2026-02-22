// Chen Peiran, A0257826R
import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import axios from "axios";
import toast from "react-hot-toast";
import HomePage from "./HomePage";
import { useCart } from "../context/cart";

jest.mock("axios");
jest.mock("react-hot-toast", () => ({
    success: jest.fn(),
    error: jest.fn()
}));

const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => ({
    ...jest.requireActual("react-router-dom"),
    useNavigate: () => mockNavigate
}));

jest.mock("./../components/Layout", () =>
    jest.fn(({ children }) => <div>{children}</div>)
);

jest.mock("../components/Prices", () => ({
    Prices: [
        { _id: "p1", name: "Under $50", array: [0, 50] },
        { _id: "p2", name: "$50 to $100", array: [50, 100] },
    ],
}));

jest.mock("react-icons/ai", () => ({
    AiOutlineReload: () => <span data-testid="reload-icon" />,
}));

jest.mock("antd", () => {

    const Checkbox = ({ children, onChange }) => (
        <label>
            <input
                type="checkbox"
                aria-label={typeof children === "string" ? children : "checkbox"}
                onChange={(e) => onChange?.(e)}
            />
            {children}
        </label>
    );

    const Radio = ({ children, value }) => (
        <button
            type="button"
            data-radio-value={JSON.stringify(value)}
        >
            {children}
        </button>
    );

    Radio.Group = ({ children, onChange }) => (
        <div
            onClick={(e) => {
                const btn = e.target.closest("button[data-radio-value]");
                if (!btn) return;
                onChange?.({ target: { value: JSON.parse(btn.dataset.radioValue) } });
            }}
        >
            {children}
        </div>
    );

    return { Checkbox, Radio };
});

jest.mock("../context/cart", () => ({
    useCart: jest.fn()
}));

const mockSetCart = jest.fn();

Object.defineProperty(window, "localStorage", {
    value: {
        setItem: jest.fn(),
        getItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
    },
    writable: true,
});

const mockProducts = [
    {
        _id: "prod1",
        name: "Laptop",
        slug: "laptop",
        description: "A very good laptop for studying and coding in NUS that has a big screen and many USBC ports and can connect to HDMI as well. Comes in both black and white.",
        price: 1200,
    },
];

const mockCategories = [
    { _id: "cat1", name: "Electronics" },
    { _id: "cat2", name: "Books" },
];

describe("HomePage", () => {

    beforeEach(() => {
        jest.clearAllMocks();
        useCart.mockReturnValue([[], mockSetCart]);

        axios.get.mockResolvedValueOnce({ data: { success: true, category: mockCategories } });
        axios.get.mockResolvedValueOnce({ data: { total: 5 } });
        axios.get.mockResolvedValueOnce({ data: { products: mockProducts } });

        axios.post.mockResolvedValue({ data: { products: [] } });

        Object.defineProperty(window, "location", {
            value: { reload: jest.fn() },
            writable: true,
        });
    });

    it("renders key UI sections", async () => {
        const { getByAltText, getByText } = render(<HomePage />);

        await waitFor(() => {
            expect(getByText("Laptop")).toBeInTheDocument();
        });

        expect(getByAltText("bannerimage")).toBeInTheDocument();
        expect(getByText("Filter By Category")).toBeInTheDocument();
        expect(getByText("Filter By Price")).toBeInTheDocument();
        expect(getByText("All Products")).toBeInTheDocument();
    });

    it("does not set categories when unsuccessful", async () => {
        axios.get.mockReset();

        axios.get.mockResolvedValueOnce({ data: { success: false, category: mockCategories } })
        axios.get.mockResolvedValueOnce({ data: { total: 5 } })
        axios.get.mockResolvedValueOnce({ data: { products: mockProducts } });

        const { queryByText, getByText } = render(<HomePage />);

        await waitFor(() => {
            expect(getByText("Laptop")).toBeInTheDocument()
        });

        expect(queryByText("Electronics")).toBeNull();
        expect(queryByText("Books")).toBeNull();
    });

    it("logs errors when initial APIs fail", async () => {
        const logSpy = jest.spyOn(console, "log").mockImplementation(() => { });

        axios.get.mockReset();

        axios.get.mockRejectedValueOnce(new Error("category fail"));
        axios.get.mockRejectedValueOnce(new Error("count fail"));
        axios.get.mockRejectedValueOnce(new Error("list fail"));

        render(<HomePage />);

        await waitFor(() => {
            expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
            expect(axios.get).toHaveBeenCalledWith("/api/v1/product/product-count");
            expect(axios.get).toHaveBeenCalledWith("/api/v1/product/product-list/1");
        });

        await waitFor(() => {
            expect(logSpy).toHaveBeenCalledTimes(3);
        });

        logSpy.mockRestore();
    });

    it("triggers initial API calls", async () => {
        render(<HomePage />);

        await waitFor(() => {
            expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
            expect(axios.get).toHaveBeenCalledWith("/api/v1/product/product-count");
            expect(axios.get).toHaveBeenCalledWith("/api/v1/product/product-list/1");
        });
    });

    it("renders categories as filter options", async () => {
        const { getByText } = render(<HomePage />);

        await waitFor(() => {
            expect(getByText("Electronics")).toBeInTheDocument();
            expect(getByText("Books")).toBeInTheDocument();
        });
    });

    it("renders product card image and details", async () => {
        const { getByRole, getByText } = render(<HomePage />);

        await waitFor(() => {
            expect(getByText("Laptop")).toBeInTheDocument()
        });

        const image = getByRole("img", { name: "Laptop" });
        expect(image).toHaveAttribute("src", "/api/v1/product/product-photo/prod1");
        expect(getByText("$1,200.00")).toBeInTheDocument();
        expect(getByText(/A very good laptop/)).toBeInTheDocument();
    });

    it("truncates long product descriptions and appends ellipsis", async () => {
        const { getByText } = render(<HomePage />);

        await waitFor(() => {
            expect(getByText("Laptop")).toBeInTheDocument()
        });

        const description = getByText(/A very good laptop/);

        expect(description.textContent.length).toBeLessThan(mockProducts[0].description.length);
        expect(description.textContent.endsWith("...")).toBe(true);
    });

    it("navigates to product details when 'More Details' is clicked", async () => {
        const { getByText } = render(<HomePage />);

        await waitFor(() => {
            expect(getByText("More Details")).toBeInTheDocument()
        });
        fireEvent.click(getByText("More Details"));

        expect(mockNavigate).toHaveBeenCalledWith("/product/laptop");
    });

    it("adds item to cart when 'ADD TO CART' is clicked", async () => {
        const { getByText } = render(<HomePage />);

        await waitFor(() => {
            expect(getByText("ADD TO CART")).toBeInTheDocument()
        });
        fireEvent.click(getByText("ADD TO CART"));

        expect(mockSetCart).toHaveBeenCalledTimes(1);
        expect(mockSetCart).toHaveBeenCalledWith([
            expect.objectContaining({ _id: "prod1", name: "Laptop" }),
        ]);
    });

    it("updates localStorage when 'ADD TO CART' is clicked", async () => {
        const { getByText } = render(<HomePage />);

        await waitFor(() => {
            expect(getByText("ADD TO CART")).toBeInTheDocument()
        });
        fireEvent.click(getByText("ADD TO CART"));

        expect(localStorage.setItem).toHaveBeenCalledTimes(1);
        expect(localStorage.setItem).toHaveBeenCalledWith(
            "cart",
            expect.stringContaining("Laptop")
        );
    });

    it("shows toast when 'ADD TO CART' is clicked", async () => {
        const { getByText } = render(<HomePage />);

        await waitFor(() => {
            expect(getByText("ADD TO CART")).toBeInTheDocument()
        });
        fireEvent.click(getByText("ADD TO CART"));

        expect(toast.success).toHaveBeenCalledWith("Item Added to cart");
    });

    it("reloads when 'RESET FILTERS' is clicked", async () => {
        const { getByText } = render(<HomePage />);

        await waitFor(() => {
            expect(getByText("Laptop")).toBeInTheDocument();
        });

        fireEvent.click(getByText("RESET FILTERS"));
        expect(window.location.reload).toHaveBeenCalledTimes(1);
    });

    it("calls filters API on filter", async () => {
        const filtered = [
            { _id: "prod2", name: "Book A", slug: "book-a", description: "A book description long enough", price: 30 },
        ];
        axios.post.mockResolvedValueOnce({ data: { products: filtered } });

        const { getByText } = render(<HomePage />);

        await waitFor(() => {
            expect(getByText("Laptop")).toBeInTheDocument()
        });

        fireEvent.click(getByText("Books"));

        await waitFor(() => {
            expect(axios.post).toHaveBeenCalledWith("/api/v1/product/product-filters", {
                checked: ["cat2"],
                radio: [],
            });
        });
    });

    it("updates product list on filter", async () => {
        const filtered = [
            { _id: "prod2", name: "Book A", slug: "book-a", description: "A book description long enough", price: 30 },
        ];
        axios.post.mockResolvedValueOnce({ data: { products: filtered } });

        const { getByText, queryByText } = render(<HomePage />);

        await waitFor(() => {
            expect(getByText("Laptop")).toBeInTheDocument()
        });

        fireEvent.click(getByText("Books"));

        await waitFor(() => {
            expect(getByText("Book A")).toBeInTheDocument()
        });
        expect(queryByText("Laptop")).toBeNull();
    });

    it("logs error when filter API fails", async () => {
        const logSpy = jest.spyOn(console, "log").mockImplementation(() => { });

        axios.post.mockRejectedValueOnce(new Error("filter fail"));

        const { getByText } = render(<HomePage />);

        await waitFor(() => {
            expect(getByText("Laptop")).toBeInTheDocument()
        });

        fireEvent.click(getByText("$50 to $100"));

        await waitFor(() => {
            expect(axios.post).toHaveBeenCalledWith("/api/v1/product/product-filters", {
                checked: [],
                radio: [50, 100],
            });
        });

        await waitFor(() => {
            expect(logSpy).toHaveBeenCalledTimes(1);
        });

        logSpy.mockRestore();
    });

    it("requests to load more products when Loadmore is clicked", async () => {
        const newProduct = [{
            _id: "prod3",
            name: "Phone",
            slug: "phone",
            description: "Phone desc long enough",
            price: 999
        }];

        axios.get.mockResolvedValueOnce({ data: { products: newProduct } });

        const { getByText } = render(<HomePage />);

        await waitFor(() => {
            expect(getByText("Laptop")).toBeInTheDocument()
        });

        fireEvent.click(getByText("Loadmore"));

        await waitFor(() => {
            expect(axios.get).toHaveBeenCalledWith("/api/v1/product/product-list/2");
        });
    });

    it("appends new products when Loadmore is clicked", async () => {
        const newProduct = [{
            _id: "prod3",
            name: "Phone",
            slug: "phone",
            description: "Phone desc long enough",
            price: 999
        }];

        axios.get.mockResolvedValueOnce({ data: { products: newProduct } });

        const { getByText } = render(<HomePage />);

        await waitFor(() => {
            expect(getByText("Laptop")).toBeInTheDocument()
        });

        fireEvent.click(getByText("Loadmore"));

        await waitFor(() => {
            expect(getByText("Phone")).toBeInTheDocument()
        });
        expect(getByText("Laptop")).toBeInTheDocument();
    });

    it("logs error and stops loading when loadMore fails", async () => {
        const logSpy = jest.spyOn(console, "log").mockImplementation(() => { });

        axios.get.mockRejectedValueOnce(new Error("loadMore fail"));

        const { getByText } = render(<HomePage />);

        await waitFor(() => {
            expect(getByText("Laptop")).toBeInTheDocument()
        });

        fireEvent.click(getByText("Loadmore"));

        await waitFor(() => {
            expect(logSpy).toHaveBeenCalledTimes(1)
        });

        await waitFor(() => {
            expect(getByText("Loadmore")).toBeInTheDocument()
        });

        logSpy.mockRestore();
    });

    it("unchecking a category removes it from checked", async () => {
        axios.get.mockResolvedValueOnce({ data: { products: mockProducts } });

        const mockProds = [
            {
                _id: "prod2",
                name: "Book A",
                slug: "book-a",
                description: "long desc",
                price: 30
            },
        ];

        axios.post.mockResolvedValueOnce({ data: { products: mockProds }, });

        const { getByText, queryByText } = render(<HomePage />);

        await waitFor(() => {
            expect(getByText("Laptop")).toBeInTheDocument()
        });

        fireEvent.click(getByText("Books"));
        await waitFor(() => {
            expect(getByText("Book A")).toBeInTheDocument()
        });
        expect(queryByText("Laptop")).toBeNull();

        fireEvent.click(getByText("Books"));
        await waitFor(() => {
            expect(getByText("Laptop")).toBeInTheDocument()
        });
        expect(queryByText("Book A")).toBeNull();
    });

});