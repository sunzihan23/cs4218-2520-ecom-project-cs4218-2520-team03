// Trinh Hoai Song Thu, A0266248W
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

import CategoryForm from "./CategoryForm";

describe("CategoryForm", () => {
  test("renders the input placeholder and button", () => {
    render(
      <CategoryForm handleSubmit={jest.fn()} value="" setValue={jest.fn()} />,
    );

    expect(
      screen.getByPlaceholderText(/enter new category/i),
    ).toBeInTheDocument();

    expect(screen.getByRole("button", { name: /submit/i })).toBeInTheDocument();
  });

  test("changes form value when user type in new category", () => {
    const setValue = jest.fn();

    render(
      <CategoryForm handleSubmit={jest.fn()} value="" setValue={setValue} />,
    );

    const input = screen.getByPlaceholderText(/enter new category/i);

    fireEvent.change(input, { target: { value: "Books" } });

    expect(setValue).toHaveBeenCalledTimes(1);
    expect(setValue).toHaveBeenCalledWith("Books");
  });

  test("invokes backend API on successful form submission", () => {
    const handleSubmit = jest.fn((e) => e.preventDefault());

    render(
      <CategoryForm
        handleSubmit={handleSubmit}
        value="Books"
        setValue={jest.fn()}
      />,
    );

    const button = screen.getByRole("button", { name: /submit/i });
    fireEvent.click(button);

    expect(handleSubmit).toHaveBeenCalledTimes(1);
  });

  test("doesn not submit form when input is empty", () => {
    const handleSubmit = jest.fn((e) => e.preventDefault());

    render(
      <CategoryForm
        handleSubmit={handleSubmit}
        value=""
        setValue={jest.fn()}
      />,
    );

    const button = screen.getByRole("button", { name: /submit/i });
    fireEvent.click(button);
    expect(handleSubmit).not.toHaveBeenCalled();
  });
});
