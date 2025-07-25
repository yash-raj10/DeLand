"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"

type LandType = "Agricultural" | "Non-Agricultural"
type Action = "AwardDeclared" | "Compensated" | "OwnershipUpdated" | "Other"

interface FormData {
  surveyNumber: string
  propertyNumber: string
  ownerID: string
  landType: LandType
  action: Action
  details: string
}

export default function AdminPage() {
  const [formData, setFormData] = useState<FormData>({
    surveyNumber: "",
    propertyNumber: "",
    ownerID: "",
    landType: "Agricultural",
    action: "AwardDeclared",
    details: "",
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toast, setToast] = useState<{
    type: "success" | "error"
    message: string
  } | null>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 5000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"
      const response = await fetch(`${apiUrl}/add_entry`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          survey_number: formData.surveyNumber,
          property_number: formData.propertyNumber,
          owner_id: formData.ownerID,
          land_type: formData.landType,
          action: formData.action,
          details: formData.details,
        }),
      })

      if (response.ok) {
        showToast("success", "Land entry added successfully!")
        setFormData({
          surveyNumber: "",
          propertyNumber: "",
          ownerID: "",
          landType: "Agricultural",
          action: "AwardDeclared",
          details: "",
        })
      } else {
        const errorData = await response.json()
        showToast("error", errorData.message || "Failed to add land entry")
      }
    } catch {
      showToast("error", "Network error: Unable to connect to server")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
              <p className="text-gray-600 mt-1">Add new land ledger entries</p>
            </div>
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50">
          <div
            className={`px-6 py-4 rounded-lg shadow-lg border ${
              toast.type === "success"
                ? "bg-green-50 border-green-200 text-green-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            <div className="flex items-center">
              <span className="text-sm font-medium">{toast.message}</span>
              <button onClick={() => setToast(null)} className="ml-4 text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="px-8 py-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-8">Add New Land Entry</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Survey Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Survey Number *</label>
                  <input
                    type="text"
                    name="surveyNumber"
                    value={formData.surveyNumber}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                    placeholder="e.g., SY-001"
                  />
                </div>

                {/* Property Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Property Number *</label>
                  <input
                    type="text"
                    name="propertyNumber"
                    value={formData.propertyNumber}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                    placeholder="e.g., PR-001"
                  />
                </div>

                {/* Owner ID */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Owner ID *</label>
                  <input
                    type="text"
                    name="ownerID"
                    value={formData.ownerID}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                    placeholder="e.g., OWN-001"
                  />
                </div>

                {/* Land Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Land Type *</label>
                  <select
                    name="landType"
                    value={formData.landType}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                  >
                    <option value="Agricultural">Agricultural</option>
                    <option value="Non-Agricultural">Non-Agricultural</option>
                  </select>
                </div>

                {/* Action */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Action *</label>
                  <select
                    name="action"
                    value={formData.action}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                  >
                    <option value="AwardDeclared">Award Declared</option>
                    <option value="Compensated">Compensated</option>
                    <option value="OwnershipUpdated">Ownership Updated</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Details */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Details *</label>
                <textarea
                  name="details"
                  value={formData.details}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                  placeholder="Enter detailed description of the land entry..."
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-gray-900 text-white font-medium rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {isSubmitting ? (
                    <div className="flex items-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Adding Entry...
                    </div>
                  ) : (
                    "Add Land Entry"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}
