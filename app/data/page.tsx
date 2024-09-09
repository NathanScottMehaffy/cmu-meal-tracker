"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAppStore } from "../../state/store";

type Transaction = {
  location: string;
  dateTime: string;
  requestedAmount: string;
  approvedAmount: string;
};

type MealPlan = {
  startDate: string;
  planName: string;
  currentBalance: string;
  transactions: Transaction[];
};

function parseMealPlanData(html: string): MealPlan[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  const mealPlans: MealPlan[] = Array.from(
    doc.querySelectorAll("#tbl-plans tr:not(.header-row)"),
  ).map((row) => ({
    startDate: row.querySelector(".column0")?.textContent?.trim() ?? "",
    planName: row.querySelector(".column1")?.textContent?.trim() ?? "",
    currentBalance: row.querySelector(".column2")?.textContent?.trim() ?? "",
    transactions: [],
  }));

  const transactions: Transaction[] = Array.from(
    doc.querySelectorAll("#tbl-trx tr:not(.header-row)"),
  ).map((row) => ({
    location: row.querySelector("th")?.textContent?.trim() ?? "",
    dateTime: row.querySelector("td:nth-child(2)")?.textContent?.trim() ?? "",
    requestedAmount:
      row.querySelector("td:nth-child(3)")?.textContent?.trim() ?? "",
    approvedAmount:
      row.querySelector("td:nth-child(4)")?.textContent?.trim() ?? "",
  }));

  const selectedPlan = doc.querySelector("#select-plan option[selected]");
  const selectedPlanName = selectedPlan?.textContent?.trim() ?? "";

  const matchingPlan = mealPlans.find(
    (plan) => plan.planName === selectedPlanName,
  );
  if (matchingPlan) {
    matchingPlan.transactions = transactions;
  }

  return mealPlans;
}

export default function DataManagement() {
  const {
    darkMode,
    toggleDarkMode,
    mealPlans,
    addMealPlanData,
    clearAllData,
    getCurrentMealOption,
  } = useAppStore();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [parseStatus, setParseStatus] = useState<
    "idle" | "success" | "error" | "noData"
  >("idle");
  const currentMealOption = getCurrentMealOption();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const html = e.target?.result as string;
          const newParsedData = parseMealPlanData(html);
          if (newParsedData.length === 0) {
            setParseStatus("noData");
          } else {
            addMealPlanData(newParsedData);
            setParseStatus("success");
          }
        } catch (error) {
          console.error("Error parsing file:", error);
          setParseStatus("error");
        }
      };
      reader.readAsText(file);
    }
  };

  const exportData = () => {
    const dataStr = JSON.stringify({ mealPlans }, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "meal_plan_data.json";
    link.click();
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const jsonData = JSON.parse(e.target?.result as string);
        addMealPlanData(jsonData.mealPlans);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div
      className={`min-h-screen ${
        darkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"
      }`}
    >
      <nav
        className={`${darkMode ? "bg-gray-950" : "bg-red-800"} p-4 text-white flex justify-between items-center`}
      >
        <div>
          <Link href="/" className="mr-4">
            Dashboard
          </Link>
          <Link href="/data" className="mr-4 font-bold">
            Data
          </Link>
        </div>
        <button
          onClick={toggleDarkMode}
          className={`px-3 py-1 rounded ${
            darkMode ? "bg-gray-100 text-gray-900" : "bg-gray-900 text-white"
          }`}
        >
          {darkMode ? "Light Mode" : "Dark Mode"}
        </button>
      </nav>
      <div className="container mx-auto p-6">
        <h1
          className={`text-3xl font-bold mb-6 ${
            darkMode ? "text-white" : "text-gray-900"
          }`}
        >
          Data Management
        </h1>
        {isClient && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div
              className={`${
                darkMode ? "bg-gray-800" : "bg-white"
              } p-6 rounded-lg shadow`}
            >
              <h2
                className={`text-xl font-semibold mb-4 ${
                  darkMode ? "text-white" : "text-gray-900"
                }`}
              >
                Upload HTML Files
              </h2>
              <input
                type="file"
                onChange={handleFileUpload}
                accept=".html"
                className="mb-4"
              />
              {parseStatus === "success" && (
                <p className="text-green-500 mt-2">File parsed successfully!</p>
              )}
              {parseStatus === "error" && (
                <p className="text-red-500 mt-2">
                  Error parsing file. Please try again.
                </p>
              )}
              {parseStatus === "noData" && (
                <p className="text-yellow-500 mt-2">
                  No data found in the file.
                </p>
              )}
            </div>
            <div
              className={`${
                darkMode ? "bg-gray-800" : "bg-white"
              } p-6 rounded-lg shadow`}
            >
              <h2
                className={`text-xl font-semibold mb-4 ${
                  darkMode ? "text-white" : "text-gray-900"
                }`}
              >
                Export Data
              </h2>
              <button
                onClick={exportData}
                className="bg-red-800 text-white px-4 py-2 rounded mr-4"
              >
                Export Data
              </button>
              <h2
                className={`text-xl font-semibold mb-4 mt-6 ${
                  darkMode ? "text-white" : "text-gray-900"
                }`}
              >
                Import Data
              </h2>
              <input
                type="file"
                onChange={importData}
                accept=".json"
                className="mb-4"
              />
            </div>
            <div
              className={`${
                darkMode ? "bg-gray-800" : "bg-white"
              } p-6 rounded-lg shadow md:col-span-2`}
            >
              <h2
                className={`text-xl font-semibold mb-4 ${
                  darkMode ? "text-white" : "text-gray-900"
                }`}
              >
                Current Data
              </h2>
              {currentMealOption && (
                <div className="mb-4">
                  <h3 className="text-lg font-semibold">Current Meal Option</h3>
                  <p>{currentMealOption}</p>
                </div>
              )}
              {mealPlans.length > 0 ? (
                <div>
                  {mealPlans.map((plan, planIndex) => (
                    <div key={planIndex} className="mb-8">
                      <h3 className="text-lg font-semibold mb-2">
                        Meal Plan: {plan.planName} (Start Date: {plan.startDate}
                        )
                      </h3>
                      <p>Current Balance: {plan.currentBalance}</p>

                      <h4 className="text-md font-semibold mt-4 mb-2">
                        Transactions
                      </h4>
                      {plan.transactions.length > 0 ? (
                        <table className="w-full mb-4">
                          <thead>
                            <tr>
                              <th className="text-left">Location</th>
                              <th className="text-left">Date/Time</th>
                              <th className="text-left">Requested Amount</th>
                              <th className="text-left">Approved Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {plan.transactions.map((transaction, index) => (
                              <tr key={index}>
                                <td>{transaction.location}</td>
                                <td>{transaction.dateTime}</td>
                                <td>{transaction.requestedAmount}</td>
                                <td>{transaction.approvedAmount}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <p>No transactions available</p>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => setShowConfirmation(true)}
                    className="bg-red-800 text-white px-4 py-2 rounded mt-4"
                  >
                    Clear All Data
                  </button>
                </div>
              ) : (
                <p>No data available</p>
              )}
            </div>
          </div>
        )}
      </div>
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div
            className={`${
              darkMode ? "bg-gray-800" : "bg-white"
            } p-6 rounded-lg`}
          >
            <p className="mb-4">Are you sure you want to clear all data?</p>
            <button
              onClick={() => {
                clearAllData();
                setShowConfirmation(false);
              }}
              className="bg-red-800 text-white px-4 py-2 rounded mr-2"
            >
              Yes, Clear Data
            </button>
            <button
              onClick={() => setShowConfirmation(false)}
              className="bg-gray-500 text-white px-4 py-2 rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
