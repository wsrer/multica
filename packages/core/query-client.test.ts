import { describe, it, expect } from "vitest";
import { createQueryClient } from "./query-client";
import { ApiError } from "./api/client";

function getRetryFn() {
  const qc = createQueryClient();
  return qc.getDefaultOptions().queries?.retry!;
}

describe("createQueryClient retry", () => {
  it("returns false for ApiError with 4xx status", () => {
    const retry = getRetryFn();
    expect(retry(0, new ApiError("Not found", 404, "Not Found"))).toBe(false);
    expect(retry(0, new ApiError("Bad request", 400, "Bad Request"))).toBe(false);
    expect(retry(0, new ApiError("Forbidden", 403, "Forbidden"))).toBe(false);
    expect(retry(1, new ApiError("Not found", 404, "Not Found"))).toBe(false);
  });

  it("returns true for ApiError with 5xx status (first failure)", () => {
    const retry = getRetryFn();
    expect(retry(0, new ApiError("Server error", 500, "Internal Server Error"))).toBe(true);
    expect(retry(0, new ApiError("Bad gateway", 502, "Bad Gateway"))).toBe(true);
  });

  it("returns false for ApiError with 5xx status after one retry", () => {
    const retry = getRetryFn();
    expect(retry(1, new ApiError("Server error", 500, "Internal Server Error"))).toBe(false);
  });

  it("returns true for non-ApiError errors (first failure)", () => {
    const retry = getRetryFn();
    expect(retry(0, new TypeError("Failed to fetch"))).toBe(true);
    expect(retry(0, new Error("Network error"))).toBe(true);
  });

  it("returns false for non-ApiError errors after one retry", () => {
    const retry = getRetryFn();
    expect(retry(1, new TypeError("Failed to fetch"))).toBe(false);
  });
});
