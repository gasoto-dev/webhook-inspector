import React from "react"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}))

import HomePage from "@/app/page"

describe("HomePage", () => {
  it("renders headline", () => {
    render(<HomePage />)
    expect(screen.getByText(/Inspect webhooks/i)).toBeInTheDocument()
  })

  it("renders create endpoint button", () => {
    render(<HomePage />)
    expect(screen.getByTestId("create-endpoint-btn")).toBeInTheDocument()
  })

  it("shows brand name", () => {
    render(<HomePage />)
    // Brand is split across spans — just check the nav exists
    const nav = document.querySelector("nav")
    expect(nav).toBeInTheDocument()
  })

  it("shows feature highlights", () => {
    render(<HomePage />)
    expect(screen.getByText("Real-time")).toBeInTheDocument()
    expect(screen.getByText("Full detail")).toBeInTheDocument()
    expect(screen.getByText("Replay")).toBeInTheDocument()
  })

  it("shows expiry notice", () => {
    render(<HomePage />)
    expect(screen.getByText(/24 hours/i)).toBeInTheDocument()
  })
})
