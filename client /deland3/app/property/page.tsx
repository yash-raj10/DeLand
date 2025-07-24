"use client";

import { useState } from "react";
import Link from "next/link";

interface LedgerEntry {
  id: string;
  survey_number: string;
  property_number: string;
  owner_id: string;
  land_type: string;
  action: string;
  details: string;
  timestamp: number; // Unix timestamp
  prev_hash: string;
  hash: string;
}

interface VerificationResult {
  land_id: string;
  valid: boolean;
}

export default function PropertyPage() {
  const [propertyNumber, setPropertyNumber] = useState("");
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [currentOwner, setCurrentOwner] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<{
    isVerifying: boolean;
    isValid: boolean | null;
    surveyNumbers: string[];
  }>({
    isVerifying: false,
    isValid: null,
    surveyNumbers: [],
  });

  // Get API URL from environment
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

  const formatTimestamp = (timestamp: string | number) => {
    try {
      // Handle both string and number timestamps
      const date =
        typeof timestamp === "string"
          ? new Date(timestamp)
          : new Date(timestamp * 1000); // Convert Unix timestamp to milliseconds

      return date.toLocaleString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return timestamp.toString();
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case "AwardDeclared":
        return "🏆";
      case "OwnershipUpdated":
        return "🔄";
      case "Compensated":
        return "💰";
      default:
        return "📋";
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "AwardDeclared":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "OwnershipUpdated":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "Compensated":
        return "bg-green-100 text-green-800 border-green-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const verifyLedger = async (surveyNumbers: string[]) => {
    if (surveyNumbers.length === 0) return;

    setVerificationStatus((prev) => ({
      ...prev,
      isVerifying: true,
      isValid: null,
    }));

    try {
      // Add 2 second delay for realistic verification feel
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Get unique survey numbers to verify
      const uniqueSurveyNumbers = [...new Set(surveyNumbers)];

      // Verify each survey number and check if all are valid
      const verificationPromises = uniqueSurveyNumbers.map(
        async (surveyNumber) => {
          const response = await fetch(
            `${apiUrl}/verify/${encodeURIComponent(surveyNumber)}`
          );
          if (response.ok) {
            const result: VerificationResult = await response.json();
            return result.valid;
          }
          return false;
        }
      );

      const results = await Promise.all(verificationPromises);
      const allValid = results.every((result) => result === true);

      setVerificationStatus({
        isVerifying: false,
        isValid: allValid,
        surveyNumbers: uniqueSurveyNumbers,
      });

      // Smooth scroll to verification section after completion
      setTimeout(() => {
        const verificationElement = document.getElementById(
          "verification-section"
        );
        if (verificationElement) {
          verificationElement.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
      }, 100);
    } catch (error) {
      console.error("Verification error:", error);
      setVerificationStatus({
        isVerifying: false,
        isValid: false,
        surveyNumbers: surveyNumbers,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!propertyNumber.trim()) {
      setError("Please enter a property number");
      return;
    }

    setIsLoading(true);
    setError(null);
    setHasSearched(true);
    // Reset verification status
    setVerificationStatus({
      isVerifying: false,
      isValid: null,
      surveyNumbers: [],
    });

    try {
      const response = await fetch(
        `${apiUrl}/property/${encodeURIComponent(propertyNumber.trim())}`
      );

      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data) && data.length > 0) {
          // Sort entries by timestamp (newest first for current owner, chronological for timeline)
          const sortedEntries = [...data].sort(
            (a, b) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
          const chronologicalEntries = data.sort(
            (a, b) =>
              new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );

          setLedgerEntries(chronologicalEntries);
          setCurrentOwner(sortedEntries[0].owner_id);

          // Extract survey numbers and trigger verification
          const surveyNumbers = data.map(
            (entry: LedgerEntry) => entry.survey_number
          );
          verifyLedger(surveyNumbers);
        } else {
          setLedgerEntries([]);
          setCurrentOwner(null);
        }
      } else if (response.status === 404) {
        setError("Property not found");
        setLedgerEntries([]);
        setCurrentOwner(null);
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to fetch property details");
        setLedgerEntries([]);
        setCurrentOwner(null);
      }
    } catch (error) {
      setError("Network error: Unable to connect to server");
      setLedgerEntries([]);
      setCurrentOwner(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                🔍 Property Lookup
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                Search for property details and view complete ledger history
              </p>
            </div>
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Search Form */}
        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg overflow-hidden mb-8">
          <div className="px-6 py-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Search Property Records
            </h2>

            <form onSubmit={handleSubmit} className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Property Number
                </label>
                <input
                  type="text"
                  value={propertyNumber}
                  onChange={(e) => setPropertyNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Enter property number (e.g., PR-001)"
                  required
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
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
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
            <div className="text-yellow-400 text-4xl mb-4">🔍</div>
            <h3 className="text-lg font-medium text-yellow-800 mb-2">
              No Records Found
            </h3>
            <p className="text-yellow-700">
              No ledger entries found for property number &quot;{propertyNumber}
              &quot;
            </p>
          </div>
        )}

        {/* Current Owner */}
        {currentOwner && (
          <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg overflow-hidden mb-8">
            <div className="px-6 py-8">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Current Owner
              </h3>
              <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="text-2xl mr-3">👤</div>
                  <div>
                    <div className="text-lg font-semibold text-indigo-900 dark:text-indigo-100">
                      {currentOwner}
                    </div>
                    <div className="text-sm text-indigo-700 dark:text-indigo-300">
                      Property Number: {propertyNumber}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Blockchain Verification Status */}
        {ledgerEntries.length > 0 && (
          <div
            id="verification-section"
            className="bg-white dark:bg-gray-800 shadow-xl rounded-lg overflow-hidden mb-8"
          >
            <div className="px-6 py-8">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                🔐 Blockchain Verification
              </h3>

              {verificationStatus.isVerifying ? (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
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
                      <div className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                        Verifying Blockchain Integrity...
                      </div>
                      <div className="text-sm text-blue-700 dark:text-blue-300">
                        Checking {verificationStatus.surveyNumbers.length}{" "}
                        survey entries for tampering
                      </div>
                    </div>
                  </div>
                </div>
              ) : verificationStatus.isValid === true ? (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="text-2xl mr-3">✅</div>
                    <div>
                      <div className="text-lg font-semibold text-green-900 dark:text-green-100">
                        Blockchain Verified - Records Authentic
                      </div>
                      <div className="text-sm text-green-700 dark:text-green-300">
                        All {verificationStatus.surveyNumbers.length} survey
                        entries passed integrity checks. No tampering detected.
                      </div>
                    </div>
                  </div>
                </div>
              ) : verificationStatus.isValid === false ? (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="text-2xl mr-3">❌</div>
                    <div>
                      <div className="text-lg font-semibold text-red-900 dark:text-red-100">
                        ⚠️ Blockchain Integrity Compromised
                      </div>
                      <div className="text-sm text-red-700 dark:text-red-300">
                        One or more entries have been tampered with. Hash
                        verification failed.
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="text-2xl mr-3">⏳</div>
                    <div>
                      <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        Awaiting Verification
                      </div>
                      <div className="text-sm text-gray-700 dark:text-gray-300">
                        Search for a property to verify blockchain integrity
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Timeline */}
        {ledgerEntries.length > 0 && (
          <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg overflow-hidden">
            <div className="px-6 py-8">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                Property History Timeline
              </h3>

              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-300 dark:bg-gray-600"></div>

                <div className="space-y-8">
                  {ledgerEntries.map((entry, index) => (
                    <div key={entry.id} className="relative flex items-start">
                      {/* Timeline dot */}
                      <div className="flex-shrink-0 w-16 h-16 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center text-2xl border-4 border-white dark:border-gray-800 shadow-lg relative z-10">
                        {getActionIcon(entry.action)}
                      </div>

                      {/* Content */}
                      <div className="ml-6 flex-1 bg-gray-50 dark:bg-gray-700 rounded-lg p-6 shadow-sm">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getActionColor(
                                entry.action
                              )}`}
                            >
                              {entry.action}
                            </span>
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mt-2">
                              Owner: {entry.owner_id}
                            </h4>
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {formatTimestamp(entry.timestamp)}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                              Survey Number:
                            </span>
                            <div className="text-gray-900 dark:text-white">
                              {entry.survey_number}
                            </div>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                              Land Type:
                            </span>
                            <div className="text-gray-900 dark:text-white">
                              {entry.land_type}
                            </div>
                          </div>
                        </div>

                        <div>
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Details:
                          </span>
                          <div className="text-gray-900 dark:text-white mt-1">
                            {entry.details}
                          </div>
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
  );
}
