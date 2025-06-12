import "@testing-library/jest-dom";

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toBeDisabled(): R;
      toBeFocused(): R;
      toBeVisible(): R;
      toHaveTextContent(text: string | RegExp): R;
      toHaveAttribute(attribute: string, value?: string): R;
      toHaveClass(className: string): R;
      toHaveStyle(style: Record<string, any> | string): R;
    }
  }
}
