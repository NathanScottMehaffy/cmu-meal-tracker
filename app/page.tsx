"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAppStore } from "../state/store";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
);

const MEAL_OPTION_DATA = {
  // 6 blocks subtracted for orientation
  Green: { blocks: 292 - 6, flexDollars: 270 },
  Blue: { blocks: 252 - 6, flexDollars: 520 },
  Red: { blocks: 205 - 6, flexDollars: 850 },
};

export default function DashboardPage() {
  const { darkMode, toggleDarkMode, getCurrentMealOption } = useAppStore();
  const [currentDay, setCurrentDay] = useState(0);
  const [totalDays, setTotalDays] = useState(0);
  const [remainingBlocks, setRemainingBlocks] = useState(0);
  const [remainingFlexDollars, setRemainingFlexDollars] = useState(0);
  const [idealBlocksPerDay, setIdealBlocksPerDay] = useState(0);
  const [idealFlexPerDay, setIdealFlexPerDay] = useState(0);
  const [actualBlocksPerDay, setActualBlocksPerDay] = useState(0);
  const [actualFlexPerDay, setActualFlexPerDay] = useState(0);
  const [blocksStatus, setBlocksStatus] = useState("");
  const [flexStatus, setFlexStatus] = useState("");
  const [idealBlocksPerDayFromNow, setIdealBlocksPerDayFromNow] = useState(0);
  const [idealFlexPerDayFromNow, setIdealFlexPerDayFromNow] = useState(0);
  const currentMealOption = getCurrentMealOption();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);

    const { mealPlans } = useAppStore.getState();

    // Define the periods
    const periods = [
      {
        name: "Orientation to Fall Break",
        start: new Date(2024, 7, 25),
        end: new Date(2024, 9, 11),
      },
      {
        name: "After Fall Break to Thanksgiving",
        start: new Date(2024, 9, 21),
        end: new Date(2024, 10, 26),
      },
      {
        name: "After Thanksgiving to Winter Break",
        start: new Date(2024, 11, 2),
        end: new Date(2024, 11, 15),
      },
    ];

    // Calculate total days
    const totalDaysCount = periods.reduce(
      (sum, period) =>
        sum +
        Math.floor(
          (period.end.getTime() - period.start.getTime()) / (1000 * 3600 * 24),
        ) +
        1,
      0,
    );
    setTotalDays(totalDaysCount);

    // Calculate current day
    const now = new Date();
    let currentDayCount = 0;
    let foundPeriod = false;
    for (const period of periods) {
      if (now >= period.start && now <= period.end) {
        currentDayCount +=
          Math.floor(
            (now.getTime() - period.start.getTime()) / (1000 * 3600 * 24),
          ) + 1;
        foundPeriod = true;
        break;
      } else if (now > period.end) {
        currentDayCount +=
          Math.floor(
            (period.end.getTime() - period.start.getTime()) /
              (1000 * 3600 * 24),
          ) + 1;
      }
    }
    setCurrentDay(foundPeriod ? currentDayCount : totalDaysCount);

    // Calculate remaining blocks and flex dollars
    if (currentMealOption) {
      const STARTING_MEAL_BLOCKS = MEAL_OPTION_DATA[currentMealOption].blocks;
      const STARTING_FLEX_DOLLARS =
        MEAL_OPTION_DATA[currentMealOption].flexDollars;

      const blockPlan = mealPlans.find(
        (plan) =>
          plan.planName.includes(currentMealOption) &&
          !plan.planName.includes("Flex") &&
          !plan.planName.includes("Guest"),
      );
      const flexPlan = mealPlans.find(
        (plan) =>
          plan.planName.includes(currentMealOption) &&
          plan.planName.includes("Flex"),
      );

      if (blockPlan) {
        const remainingBlocksCount =
          STARTING_MEAL_BLOCKS - blockPlan.transactions.length;
        setRemainingBlocks(remainingBlocksCount);

        const actualBlocksPerDayValue =
          (STARTING_MEAL_BLOCKS - remainingBlocksCount) / currentDayCount;
        setActualBlocksPerDay(actualBlocksPerDayValue);

        const idealBlocksPerDayValue = STARTING_MEAL_BLOCKS / totalDaysCount;
        setIdealBlocksPerDay(idealBlocksPerDayValue);

        const idealBlocksUsed =
          STARTING_MEAL_BLOCKS -
          STARTING_MEAL_BLOCKS *
            ((totalDaysCount - currentDayCount) / totalDaysCount);
        const actualBlocksUsed = STARTING_MEAL_BLOCKS - remainingBlocksCount;

        setBlocksStatus(
          `${actualBlocksUsed < idealBlocksUsed ? "Ahead" : "Behind"} by ${Math.abs(actualBlocksUsed - idealBlocksUsed).toFixed(1)} blocks`,
        );

        // Calculate ideal blocks per day from now
        const remainingDays = totalDaysCount - currentDayCount;
        setIdealBlocksPerDayFromNow(remainingBlocksCount / remainingDays);
      }

      if (flexPlan) {
        const remainingFlexDollarsAmount = parseFloat(
          flexPlan.currentBalance.split("$")[1],
        );
        setRemainingFlexDollars(remainingFlexDollarsAmount);

        const actualFlexPerDayValue =
          (STARTING_FLEX_DOLLARS - remainingFlexDollarsAmount) /
          currentDayCount;
        setActualFlexPerDay(actualFlexPerDayValue);

        const idealFlexPerDayValue = STARTING_FLEX_DOLLARS / totalDaysCount;
        setIdealFlexPerDay(idealFlexPerDayValue);

        const idealFlexUsed =
          STARTING_FLEX_DOLLARS -
          STARTING_FLEX_DOLLARS *
            ((totalDaysCount - currentDayCount) / totalDaysCount);
        const actualFlexUsed =
          STARTING_FLEX_DOLLARS - remainingFlexDollarsAmount;

        setFlexStatus(
          `${actualFlexUsed < idealFlexUsed ? "Ahead" : "Behind"} by $${Math.abs(actualFlexUsed - idealFlexUsed).toFixed(2)}`,
        );

        // Calculate ideal flex dollars per day from now
        const remainingDays = totalDaysCount - currentDayCount;
        setIdealFlexPerDayFromNow(remainingFlexDollarsAmount / remainingDays);
      }
    }
  }, [currentMealOption]);

  const generateChartData = (
    startValue: number,
    isBlocks: boolean,
    currentDay: number,
    totalDays: number,
  ) => {
    const idealUsage = Array.from(
      { length: totalDays + 1 },
      (_, i) => startValue - i * (startValue / totalDays),
    );

    const relevantPlan = useAppStore
      .getState()
      .mealPlans.find(
        (plan) =>
          (isBlocks
            ? !plan.planName.includes("Flex")
            : plan.planName.includes("Flex")) &&
          plan.planName.includes(currentMealOption || ""),
      );

    const actualUsage = relevantPlan
      ? isBlocks
        ? Array.from({ length: currentDay + 1 }, (_, day) => {
            const transactionsUpToDay = relevantPlan.transactions.filter(
              (transaction) => {
                const transactionDate = new Date(transaction.dateTime);
                return (
                  transactionDate <=
                  new Date(
                    new Date().setDate(
                      new Date().getDate() - (currentDay - day),
                    ),
                  )
                );
              },
            );
            return {
              x: day,
              y: startValue - transactionsUpToDay.length,
            };
          })
        : relevantPlan.transactions.reduce(
            (acc: { x: number; y: number }[], transaction, index) => {
              const amount = parseFloat(
                transaction.approvedAmount.replace("$", ""),
              );
              acc.push({
                x: index,
                y:
                  acc.length > 0
                    ? acc[acc.length - 1].y - amount
                    : startValue - amount,
              });
              return acc;
            },
            [],
          )
      : [];

    return {
      labels: Array.from({ length: totalDays + 1 }, (_, i) => i.toString()),
      datasets: [
        {
          label: "Actual Usage",
          data: actualUsage,
          borderColor: "red",
          fill: false,
          pointRadius: 0,
        },
        {
          label: "Ideal Usage",
          data: idealUsage.map((value, index) => ({
            x: index,
            y: value,
          })),
          borderColor: "blue",
          fill: false,
          pointRadius: 0,
          order: 1,
        },
      ],
    };
  };

  const blockData = currentMealOption
    ? generateChartData(
        MEAL_OPTION_DATA[currentMealOption].blocks,
        true,
        currentDay,
        totalDays,
      )
    : { labels: [], datasets: [] };

  const flexData = currentMealOption
    ? generateChartData(
        MEAL_OPTION_DATA[currentMealOption].flexDollars,
        false,
        currentDay,
        totalDays,
      )
    : { labels: [], datasets: [] };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "Usage Over Time",
      },
    },
    scales: {
      x: {
        type: "linear" as const,
      },
    },
  };

  return (
    <div
      className={`min-h-screen ${darkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"}`}
    >
      <nav
        className={`bg-red-800 p-4 text-white flex justify-between items-center`}
      >
        <div>
          <Link href="/" className="mr-4 font-bold">
            Dashboard
          </Link>
          <Link href="/data" className="mr-4">
            Data
          </Link>
        </div>
        <button
          onClick={toggleDarkMode}
          className={`px-3 py-1 rounded ${darkMode ? "bg-gray-100 text-gray-900" : "bg-gray-900 text-white"}`}
        >
          {darkMode ? "Light Mode" : "Dark Mode"}
        </button>
      </nav>
      <div className="container mx-auto p-6">
        <h1
          className={`text-3xl font-bold mb-6 ${darkMode ? "text-white" : "text-gray-900"}`}
        >
          Meal Plan Dashboard
        </h1>
        {isClient && currentMealOption ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div
              className={`${darkMode ? "bg-gray-800" : "bg-white"} p-6 rounded-lg shadow`}
            >
              <h2
                className={`text-xl font-semibold mb-4 ${darkMode ? "text-white" : "text-gray-900"}`}
              >
                Meal Plan Overview
              </h2>
              <p>Current Meal Option: {currentMealOption}</p>
              <p>Total days on campus: {totalDays}</p>
              <p>Current day: {currentDay}</p>
              <p>Meal blocks remaining: {remainingBlocks}</p>
              <p>Flex dollars remaining: ${remainingFlexDollars.toFixed(2)}</p>
            </div>
            <div
              className={`${darkMode ? "bg-gray-800" : "bg-white"} p-6 rounded-lg shadow`}
            >
              <h2
                className={`text-xl font-semibold mb-4 ${darkMode ? "text-white" : "text-gray-900"}`}
              >
                Current Status
              </h2>
              <p>
                Meal blocks:{" "}
                <span
                  style={{
                    color: blocksStatus.includes("Ahead") ? "green" : "red",
                  }}
                >
                  {blocksStatus}
                </span>
              </p>
              <p>
                Flex dollars:{" "}
                <span
                  style={{
                    color: flexStatus.includes("Ahead") ? "green" : "red",
                  }}
                >
                  {flexStatus}
                </span>
              </p>
            </div>
            <div
              className={`${darkMode ? "bg-gray-800" : "bg-white"} p-6 rounded-lg shadow`}
            >
              <h2
                className={`text-xl font-semibold mb-4 ${darkMode ? "text-white" : "text-gray-900"}`}
              >
                Ideal Usage Per Day
              </h2>
              <p>Meal blocks: {idealBlocksPerDay.toFixed(2)}</p>
              <p>Flex dollars: ${idealFlexPerDay.toFixed(2)}</p>
              <h3 className="mt-4 font-semibold">From Now On:</h3>
              <p>Meal blocks: {idealBlocksPerDayFromNow.toFixed(2)}</p>
              <p>Flex dollars: ${idealFlexPerDayFromNow.toFixed(2)}</p>
            </div>
            <div
              className={`${darkMode ? "bg-gray-800" : "bg-white"} p-6 rounded-lg shadow`}
            >
              <h2
                className={`text-xl font-semibold mb-4 ${darkMode ? "text-white" : "text-gray-900"}`}
              >
                Actual Usage Per Day
              </h2>
              <p>Meal blocks: {actualBlocksPerDay.toFixed(2)}</p>
              <p>Flex dollars: ${actualFlexPerDay.toFixed(2)}</p>
            </div>
            <div
              className={`${darkMode ? "bg-gray-800" : "bg-white"} p-6 rounded-lg shadow md:col-span-2`}
            >
              <h2
                className={`text-xl font-semibold mb-4 ${darkMode ? "text-white" : "text-gray-900"}`}
              >
                Meal Blocks Usage
              </h2>
              <Line options={options} data={blockData} />
            </div>
            <div
              className={`${darkMode ? "bg-gray-800" : "bg-white"} p-6 rounded-lg shadow md:col-span-2`}
            >
              <h2
                className={`text-xl font-semibold mb-4 ${darkMode ? "text-white" : "text-gray-900"}`}
              >
                Flex Dollars Usage
              </h2>
              <Line options={options} data={flexData} />
            </div>
          </div>
        ) : (
          <p>No meal option found. Please upload your meal plan data.</p>
        )}
      </div>
    </div>
  );
}
