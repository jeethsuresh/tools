"use client";

import { useState, useMemo } from "react";
import { ToolProps } from "@/types/tool";

interface ChipColor {
  name: string;
  color: string;
  value: number;
  count: number;
  total: number;
}

type Mode = "buyin" | "quantity";

export default function PokerChipTool({}: ToolProps) {
  const [mode, setMode] = useState<Mode>("buyin");
  const [buyIn, setBuyIn] = useState<string>("100");
  const [chipsPerColor, setChipsPerColor] = useState<string>("5");
  
  // For quantity calculator mode
  const [targetAmount, setTargetAmount] = useState<string>("100");
  const [chipValues, setChipValues] = useState<string[]>(["1", "5", "25", "100", "500"]);

  // Standard poker chip ratios (1:5:25:100:500) - base ratios
  const baseRatios = [1, 5, 25, 100, 500];
  // Balance sliders (0-200%, default 100%)
  const [chipBalances, setChipBalances] = useState<number[]>([100, 100, 100, 100, 100]);
  const [showPokerHands, setShowPokerHands] = useState(false);

  // Calculate adjusted ratios based on balance sliders
  const chipRatios = useMemo(() => {
    return baseRatios.map((base, index) => {
      return base * (chipBalances[index] / 100);
    });
  }, [chipBalances]);
  const chipColors = [
    { name: "White", color: "bg-white border-gray-300 text-gray-900" },
    { name: "Red", color: "bg-red-500 border-red-600 text-white" },
    { name: "Green", color: "bg-green-500 border-green-600 text-white" },
    { name: "Black", color: "bg-gray-900 border-gray-950 text-white" },
    { name: "Blue", color: "bg-blue-500 border-blue-600 text-white" },
  ];

  const chipsPerColorNum = parseInt(chipsPerColor) || 5;

  // Buy-in calculator: calculate chip values from buy-in
  const chipDistribution = useMemo(() => {
    if (mode !== "buyin") return null;
    
    const buyInAmount = parseFloat(buyIn);
    
    if (isNaN(buyInAmount) || buyInAmount <= 0) {
      return null;
    }

    // Calculate the total ratio value
    const totalRatioValue = chipRatios.reduce((sum, ratio) => sum + ratio * chipsPerColorNum, 0);
    
    // Calculate the scale factor to match the buy-in
    const scaleFactor = buyInAmount / totalRatioValue;
    
    // Calculate chip values and distribution
    const chips: ChipColor[] = chipColors.map((chipColor, index) => {
      const baseValue = chipRatios[index];
      const value = Math.round(baseValue * scaleFactor * 100) / 100; // Round to 2 decimal places
      const count = chipsPerColorNum;
      const total = value * count;
      
      return {
        ...chipColor,
        value,
        count,
        total,
      };
    });

    // Verify total matches buy-in (with small rounding tolerance)
    const calculatedTotal = chips.reduce((sum, chip) => sum + chip.total, 0);
    const difference = Math.abs(calculatedTotal - buyInAmount);
    
    // If there's a rounding difference, adjust the highest value chip
    if (difference > 0.01 && chips.length > 0) {
      const highestChip = chips[chips.length - 1];
      const adjustment = buyInAmount - calculatedTotal;
      highestChip.value = Math.round((highestChip.value + adjustment / highestChip.count) * 100) / 100;
      highestChip.total = highestChip.value * highestChip.count;
    }

    return chips;
  }, [buyIn, chipsPerColorNum, mode, chipRatios]);

  // Quantity calculator: calculate how many chips needed to reach target amount
  const chipQuantities = useMemo(() => {
    if (mode !== "quantity") return null;
    
    const target = parseFloat(targetAmount);
    if (isNaN(target) || target <= 0) {
      return null;
    }

    // Parse chip values
    const values = chipValues.map(v => parseFloat(v) || 0).filter(v => v > 0);
    if (values.length === 0) {
      return null;
    }

    // Sort values in descending order for greedy algorithm
    const sortedChips = chipColors
      .map((chipColor, index) => ({
        ...chipColor,
        value: values[index] || 0,
        originalIndex: index,
      }))
      .filter(chip => chip.value > 0)
      .sort((a, b) => b.value - a.value);

    let remaining = target;
    const result: (ChipColor & { originalIndex: number })[] = sortedChips.map(chip => ({
      ...chip,
      count: 0,
      total: 0,
    }));

    // Greedy algorithm: use highest value chips first
    for (let i = 0; i < sortedChips.length && remaining > 0.01; i++) {
      const chip = sortedChips[i];
      const count = Math.floor(remaining / chip.value);
      if (count > 0) {
        const chipIndex = result.findIndex(r => r.originalIndex === chip.originalIndex);
        if (chipIndex >= 0) {
          result[chipIndex].count = count;
          result[chipIndex].total = chip.value * count;
          remaining -= result[chipIndex].total;
        }
      }
    }

    // Sort back to original order
    result.sort((a, b) => a.originalIndex - b.originalIndex);

    return {
      chips: result,
      remaining: Math.round(remaining * 100) / 100,
      total: target - remaining,
    };
  }, [targetAmount, chipValues, mode]);

  const totalChips = chipDistribution
    ? chipDistribution.reduce((sum, chip) => sum + chip.count, 0)
    : 0;
  const calculatedTotal = chipDistribution
    ? chipDistribution.reduce((sum, chip) => sum + chip.total, 0)
    : 0;

  const handleChipValueChange = (index: number, value: string) => {
    const newValues = [...chipValues];
    newValues[index] = value;
    setChipValues(newValues);
  };

  const handleBalanceChange = (index: number, value: number) => {
    const newBalances = [...chipBalances];
    newBalances[index] = value;
    setChipBalances(newBalances);
  };

  const resetBalances = () => {
    setChipBalances([100, 100, 100, 100, 100]);
  };

  const pokerHands = [
    { rank: 1, name: "Royal Flush", description: "A, K, Q, J, 10, all of the same suit" },
    { rank: 2, name: "Straight Flush", description: "Five cards in a sequence, all of the same suit" },
    { rank: 3, name: "Four of a Kind", description: "Four cards of the same rank" },
    { rank: 4, name: "Full House", description: "Three of a kind plus a pair" },
    { rank: 5, name: "Flush", description: "Five cards of the same suit, not in sequence" },
    { rank: 6, name: "Straight", description: "Five cards in a sequence, not all of the same suit" },
    { rank: 7, name: "Three of a Kind", description: "Three cards of the same rank" },
    { rank: 8, name: "Two Pair", description: "Two different pairs" },
    { rank: 9, name: "One Pair", description: "Two cards of the same rank" },
    { rank: 10, name: "High Card", description: "When you don't have any of the above, highest card wins" },
  ];

  return (
    <div className="flex flex-col h-full min-h-screen p-6">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
        Poker Chip Calculator
      </h1>

      <div className="flex flex-col gap-6 max-w-4xl">
        {/* Mode selector */}
        <div className="flex gap-2 border-b border-gray-300 dark:border-gray-600">
          <button
            onClick={() => setMode("buyin")}
            className={`px-4 py-2 font-medium transition-colors ${
              mode === "buyin"
                ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            }`}
          >
            Buy-In Calculator
          </button>
          <button
            onClick={() => setMode("quantity")}
            className={`px-4 py-2 font-medium transition-colors ${
              mode === "quantity"
                ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            }`}
          >
            Quantity Calculator
          </button>
        </div>

        {/* Buy-In Calculator Mode */}
        {mode === "buyin" && (
          <>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Total Buy-In ($)
                </label>
                <input
                  type="number"
                  value={buyIn}
                  onChange={(e) => setBuyIn(e.target.value)}
                  min="0"
                  step="0.01"
                  className="w-full max-w-xs p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-lg font-semibold"
                  placeholder="Enter buy-in amount"
                />
              </div>
              
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Chips per Color per Person
                </label>
                <input
                  type="number"
                  value={chipsPerColor}
                  onChange={(e) => setChipsPerColor(e.target.value)}
                  min="1"
                  step="1"
                  className="w-full max-w-xs p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                  placeholder="Enter chips per color"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Each person receives {chipsPerColorNum} chips of each color ({chipsPerColorNum * 5} chips total)
                </p>
              </div>
            </div>

            {/* Chip Balance Sliders */}
            {chipDistribution && (
              <div className="flex flex-col gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-600">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Adjust Chip Balance
                  </h3>
                  <button
                    onClick={resetBalances}
                    className="text-xs px-3 py-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded transition-colors"
                  >
                    Reset
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {chipColors.map((chipColor, index) => (
                    <div key={index} className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                          {chipColor.name}
                        </label>
                        <span className="text-xs text-gray-500 dark:text-gray-500">
                          {chipBalances[index]}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="200"
                        value={chipBalances[index]}
                        onChange={(e) => handleBalanceChange(index, parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600 dark:accent-blue-400"
                      />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Adjust the balance sliders to change the relative value distribution of chips. 100% = standard ratio.
                </p>
              </div>
            )}

            {/* Chip distribution */}
            {chipDistribution && (
              <div className="flex flex-col gap-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Chip Distribution
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {chipDistribution.map((chip, index) => (
                    <div
                      key={index}
                      className={`flex flex-col items-center p-4 rounded-lg border-2 ${chip.color} shadow-md`}
                    >
                      <div className="text-sm font-medium mb-2">{chip.name}</div>
                      <div className="text-2xl font-bold mb-1">
                        ${chip.value.toFixed(2)}
                      </div>
                      <div className="text-xs opacity-80">
                        {chip.count} chips
                      </div>
                      <div className="text-xs opacity-80 mt-1">
                        Total: ${chip.total.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Summary */}
                <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Total Chips:</span>
                      <span className="ml-2 font-semibold text-gray-900 dark:text-gray-100">
                        {totalChips}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Total Value:</span>
                      <span className="ml-2 font-semibold text-gray-900 dark:text-gray-100">
                        ${calculatedTotal.toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Buy-In:</span>
                      <span className="ml-2 font-semibold text-gray-900 dark:text-gray-100">
                        ${parseFloat(buyIn).toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Chips per Person:</span>
                      <span className="ml-2 font-semibold text-gray-900 dark:text-gray-100">
                        {totalChips}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {(!buyIn || parseFloat(buyIn) <= 0) && (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  Please enter a valid buy-in amount to calculate chip values.
                </p>
              </div>
            )}
          </>
        )}

        {/* Quantity Calculator Mode */}
        {mode === "quantity" && (
          <>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Target Amount ($)
                </label>
                <input
                  type="number"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  min="0"
                  step="0.01"
                  className="w-full max-w-xs p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-lg font-semibold"
                  placeholder="Enter target amount"
                />
              </div>

              <div className="flex flex-col gap-4">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Chip Values ($)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {chipColors.map((chipColor, index) => (
                    <div key={index} className="flex flex-col gap-2">
                      <label className="text-xs text-gray-600 dark:text-gray-400">
                        {chipColor.name}
                      </label>
                      <input
                        type="number"
                        value={chipValues[index] || ""}
                        onChange={(e) => handleChipValueChange(index, e.target.value)}
                        min="0"
                        step="0.01"
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                        placeholder="0.00"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Chip quantities needed */}
            {chipQuantities && (
              <div className="flex flex-col gap-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Chips Needed
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {chipQuantities.chips.map((chip, index) => (
                    <div
                      key={index}
                      className={`flex flex-col items-center p-4 rounded-lg border-2 ${chip.color} shadow-md ${
                        chip.count === 0 ? "opacity-50" : ""
                      }`}
                    >
                      <div className="text-sm font-medium mb-2">{chip.name}</div>
                      <div className="text-lg font-semibold mb-1">
                        ${chip.value.toFixed(2)}
                      </div>
                      <div className="text-2xl font-bold mb-1">
                        {chip.count}
                      </div>
                      <div className="text-xs opacity-80">
                        {chip.count > 0 ? `Total: $${chip.total.toFixed(2)}` : "Not needed"}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Summary */}
                <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Target Amount:</span>
                      <span className="ml-2 font-semibold text-gray-900 dark:text-gray-100">
                        ${parseFloat(targetAmount).toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Total Value:</span>
                      <span className="ml-2 font-semibold text-gray-900 dark:text-gray-100">
                        ${chipQuantities.total.toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Remaining:</span>
                      <span className={`ml-2 font-semibold ${
                        chipQuantities.remaining > 0.01
                          ? "text-red-600 dark:text-red-400"
                          : "text-gray-900 dark:text-gray-100"
                      }`}>
                        ${chipQuantities.remaining.toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Total Chips:</span>
                      <span className="ml-2 font-semibold text-gray-900 dark:text-gray-100">
                        {chipQuantities.chips.reduce((sum, chip) => sum + chip.count, 0)}
                      </span>
                    </div>
                  </div>
                  {chipQuantities.remaining > 0.01 && (
                    <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
                      <p className="text-xs text-yellow-800 dark:text-yellow-200">
                        Note: Cannot reach exact amount with available chip values. Remaining: ${chipQuantities.remaining.toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {(!targetAmount || parseFloat(targetAmount) <= 0) && (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  Please enter a valid target amount and chip values to calculate quantities.
                </p>
              </div>
            )}
          </>
        )}

        {/* Poker Hands Reference */}
        <div className="mt-8 border-t border-gray-300 dark:border-gray-600 pt-6">
          <button
            onClick={() => setShowPokerHands(!showPokerHands)}
            className="flex items-center justify-between w-full p-4 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Poker Hands Reference
            </span>
            <svg
              className={`w-5 h-5 text-gray-600 dark:text-gray-400 transition-transform ${
                showPokerHands ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {showPokerHands && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-600">
              <div className="space-y-3">
                {pokerHands.map((hand) => (
                  <div
                    key={hand.rank}
                    className="flex items-start gap-4 p-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-bold">
                      {hand.rank}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                        {hand.name}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {hand.description}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs text-gray-500 dark:text-gray-400 italic">
                Hands are ranked from highest (1) to lowest (10). In case of ties, the higher-ranking hand wins.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

