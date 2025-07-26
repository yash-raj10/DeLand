"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"

interface LedgerEntry {
  id: string
  survey_number: string
  property_number: string
  owner_id: string
  land_type: string
  action: string
  details: string
  timestamp: number
  prev_hash: string
  hash: string
}

interface VerificationResult {
  land_id: string
  valid: boolean
}

export default function PropertyPage() {
  const [propertyNumber, setPropertyNumber] = useState("")
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([])
  const [currentOwner, setCurrentOwner] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)
  const [verificationStatus, setVerificationStatus] = useState<{
    isVerifying: boolean
    isValid: boolean | null
    surveyNumbers: string[]
  }>({
    isVerifying: false,
    isValid: null,
    surveyNumbers: [],
  })

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

  const formatTimestamp = (timestamp: string | number) => {
    try {
      const date = typeof timestamp === "string" ? new Date(timestamp) : new Date(timestamp * 1000)

      return date.toLocaleString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    } catch {
      return timestamp.toString()
    }
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case "AwardDeclared":
        return "🏆"
      case "OwnershipUpdated":
        return "🔄"
      case "Compensated":
        return "💰"
      default:
        return "📋"
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case "AwardDeclared":
        return "bg-yellow-50 text-yellow-800 border-yellow-200"
      case "OwnershipUpdated":
        return "bg-blue-50 text-blue-800 border-blue-200"
      case "Compensated":
        return "bg-green-50 text-green-800 border-green-200"
      default:
        return "bg-gray-50 text-gray-800 border-gray-200"
    }
  }

  const verifyLedger = async (surveyNumbers: string[]) => {
    if (surveyNumbers.length === 0) return

    setVerificationStatus((prev) => ({
      ...prev,
      isVerifying: true,
      isValid: null,
    }))

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const uniqueSurveyNumbers = [...new Set(surveyNumbers)]

      const verificationPromises = uniqueSurveyNumbers.map(async (surveyNumber) => {
        const response = await fetch(`${apiUrl}/verify/${encodeURIComponent(surveyNumber)}`)
        if (response.ok) {
          const result: VerificationResult = await response.json()
          return result.valid
        }
        return false
      })

      const results = await Promise.all(verificationPromises)
      const allValid = results.every((result) => result === true)

      setVerificationStatus({
        isVerifying: false,
        isValid: allValid,
        surveyNumbers: uniqueSurveyNumbers,
      })

      setTimeout(() => {
        const verificationElement = document.getElementById("verification-section")
        if (verificationElement) {
          verificationElement.scrollIntoView({
            behavior: "smooth",
            block: "center",
          })
        }
      }, 100)
    } catch (_error) {
      console.error("Verification error:", _error)
      setVerificationStatus({
        isVerifying: false,
        isValid: false,
        surveyNumbers: surveyNumbers,
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!propertyNumber.trim()) {
      setError("Please enter a property number")
      return
    }

    setIsLoading(true)
    setError(null)
    setHasSearched(true)
    setVerificationStatus({
      isVerifying: false,
      isValid: null,
      surveyNumbers: [],
    })

    try {
      const response = await fetch(`${apiUrl}/property/${encodeURIComponent(propertyNumber.trim())}`)

      if (response.ok) {
        const data = await response.json()
        if (data && Array.isArray(data) && data.length > 0) {
          const sortedEntries = [...data].sort(
            (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
          )
          const chronologicalEntries = data.sort(
            (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
          )

          setLedgerEntries(chronologicalEntries)
          setCurrentOwner(sortedEntries[0].owner_id)

          const surveyNumbers = data.map((entry: LedgerEntry) => entry.survey_number)
          verifyLedger(surveyNumbers)
        } else {
          setLedgerEntries([])
          setCurrentOwner(null)
        }
      } else if (response.status === 404) {
        setError("Property not found")
        setLedgerEntries([])
        setCurrentOwner(null)
      } else {
        const errorData = await response.json()
        setError(errorData.message || "Failed to fetch property details")
        setLedgerEntries([])
        setCurrentOwner(null)
      }
    } catch {
      setError("Network error: Unable to connect to server")
      setLedgerEntries([])
      setCurrentOwner(null)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Property Search</h1>
              <p className="text-gray-600 mt-1">Search for property details and view ledger history</p>
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

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Search Form */}
        <div className="bg-white border border-gray-200 rounded-lg mb-8">
          <div className="px-8 py-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Search Property Records</h2>

            <form onSubmit={handleSubmit} className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Property Number</label>
                <input
                  type="text"
                  value={propertyNumber}
                  onChange={(e) => setPropertyNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                  placeholder="Enter property number (e.g., PR-001)"
                  required
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-2 bg-gray-900 text-white font-medium rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {isLoading ? "Searching..." : "Search"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <div className="flex">
              <div className="text-red-400 mr-3">⚠️</div>
              <div className="text-red-700 font-medium">{error}</div>
            </div>
          </div>
        )}

        {/* No Results */}
        {hasSearched && !error && ledgerEntries.length === 0 && !isLoading && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
            <div className="text-gray-400 text-4xl mb-4">🔍</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Records Found</h3>
            <p className="text-gray-600">No ledger entries found for property number &quot;{propertyNumber}&quot;</p>
          </div>
        )}

        {/* Current Owner */}
        {currentOwner && (
          <div className="bg-white border border-gray-200 rounded-lg mb-8">
            <div className="px-8 py-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Current Owner</h3>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="text-2xl mr-3">👤</div>
                  <div>
                    <div className="text-lg font-semibold text-gray-900">{currentOwner}</div>
                    <div className="text-sm text-gray-600">Property Number: {propertyNumber}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Blockchain Verification Status */}
        {ledgerEntries.length > 0 && (
          <div id="verification-section" className="bg-white border border-gray-200 rounded-lg mb-8">
            <div className="px-8 py-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Blockchain Verification</h3>

              {verificationStatus.isVerifying ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <svg
                      className="animate-spin h-6 w-6 text-blue-600 mr-3"
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
                    <div>
                      <div className="text-lg font-semibold text-blue-900">Verifying Blockchain Integrity...</div>
                      <div className="text-sm text-blue-700">
                        Checking {verificationStatus.surveyNumbers.length} survey entries
                      </div>
                    </div>
                  </div>
                </div>
              ) : verificationStatus.isValid === true ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="text-2xl mr-3">✅</div>
                    <div>
                      <div className="text-lg font-semibold text-green-900">
                        Blockchain Verified - Records Authentic
                      </div>
                      <div className="text-sm text-green-700">
                        All {verificationStatus.surveyNumbers.length} survey entries passed integrity checks
                      </div>
                    </div>
                  </div>
                </div>
              ) : verificationStatus.isValid === false ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="text-2xl mr-3">❌</div>
                    <div>
                      <div className="text-lg font-semibold text-red-900">Blockchain Integrity Compromised</div>
                      <div className="text-sm text-red-700">One or more entries have been tampered with</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="text-2xl mr-3">⏳</div>
                    <div>
                      <div className="text-lg font-semibold text-gray-900">Awaiting Verification</div>
                      <div className="text-sm text-gray-600">Search for a property to verify blockchain integrity</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Timeline */}
        {ledgerEntries.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="px-8 py-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Property History Timeline</h3>

              <div className="relative">
                <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-300"></div>

                <div className="space-y-8">
                  {ledgerEntries.map((entry) => (
                    <div key={entry.id} className="relative flex items-start">
                      <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-2xl border-4 border-white shadow-sm relative z-10">
                        {getActionIcon(entry.action)}
                      </div>

                      <div className="ml-6 flex-1 bg-gray-50 rounded-lg p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getActionColor(
                                entry.action,
                              )}`}
                            >
                              {entry.action}
                            </span>
                            <h4 className="text-lg font-semibold text-gray-900 mt-2">Owner: {entry.owner_id}</h4>
                          </div>
                          <div className="text-sm text-gray-500">{formatTimestamp(entry.timestamp)}</div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <span className="text-sm font-medium text-gray-500">Survey Number:</span>
                            <div className="text-gray-900">{entry.survey_number}</div>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-500">Land Type:</span>
                            <div className="text-gray-900">{entry.land_type}</div>
                          </div>
                        </div>

                        <div>
                          <span className="text-sm font-medium text-gray-500">Details:</span>
                          <div className="text-gray-900 mt-1">{entry.details}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
