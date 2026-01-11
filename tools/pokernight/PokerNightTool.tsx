"use client";

import { useState } from "react";
import { ToolProps } from "@/types/tool";
import {
  usePokerNightStore,
  Cost,
  Person,
  ChipColor,
  ChipValues,
  PersonChips,
} from "./usePokerNightStore";

interface Payment {
  from: string;
  to: string;
  amount: number;
}

const CHIP_COLORS: ChipColor[] = ["red", "blue", "green", "white", "black"];
const CHIP_COLOR_NAMES: Record<ChipColor, string> = {
  red: "Red",
  blue: "Blue",
  green: "Green",
  white: "White",
  black: "Black",
};

function PokerChipsSectionContent() {
  const {
    people,
    chipValues,
    buyIns,
    endOfNightChips,
    setChipValue,
    addBuyIn,
    removeBuyIn,
    setEndOfNightChips,
  } = usePokerNightStore();

  const [selectedPersonForBuyIn, setSelectedPersonForBuyIn] = useState<string>("");
  const [buyInChips, setBuyInChips] = useState<PersonChips>({
    red: 0,
    blue: 0,
    green: 0,
    white: 0,
    black: 0,
  });
  const [buyInAmount, setBuyInAmount] = useState<string>("");
  const [lastChangedChip, setLastChangedChip] = useState<ChipColor | null>(null);
  const [viewMode, setViewMode] = useState<"buyin" | "endofnight">("buyin");

  const getPersonName = (id: string) => {
    return people.find((p) => p.id === id)?.name || "Unknown";
  };

  const calculateBuyInAmount = (chips: PersonChips): number => {
    return (
      chips.red * chipValues.red +
      chips.blue * chipValues.blue +
      chips.green * chipValues.green +
      chips.white * chipValues.white +
      chips.black * chipValues.black
    );
  };

  // Calculate chip distribution from target amount, biasing towards lower-value chips but keeping counts balanced
  // Always ensures total value is <= targetAmount and maximizes the value
  const calculateChipsFromAmount = (targetAmount: number): PersonChips => {
    const chips: PersonChips = { red: 0, blue: 0, green: 0, white: 0, black: 0 };
    let remaining = targetAmount;
    
    // Calculate total value of one of each chip
    const totalValuePerSet =
      chipValues.red +
      chipValues.blue +
      chipValues.green +
      chipValues.white +
      chipValues.black;

    if (totalValuePerSet > 0) {
      // Calculate how many full sets we can get
      const fullSets = Math.floor(remaining / totalValuePerSet);
      
      // Distribute full sets evenly
      chips.red = fullSets;
      chips.blue = fullSets;
      chips.green = fullSets;
      chips.white = fullSets;
      chips.black = fullSets;
      
      remaining -= fullSets * totalValuePerSet;
    }

    // For remainder, prioritize equal distribution with bias towards lower-value chips
    // Always add to the color with the LOWEST count, preferring lower-value chips when counts are equal
    // NEVER add a chip if it would exceed the target amount
    const sortedColorsLowToHigh = [...CHIP_COLORS].sort((a, b) => chipValues[a] - chipValues[b]);
    
    while (remaining > 0.01) {
      // Find the minimum count across all chips
      const currentCounts = [chips.red, chips.blue, chips.green, chips.white, chips.black];
      const minCount = Math.min(...currentCounts);
      
      // Find colors that have the absolute minimum count
      const colorsWithMinCount = sortedColorsLowToHigh.filter((color) => {
        return chips[color] === minCount;
      });
      
      let addedChip = false;
      
      // First, try to add to colors with the minimum count, preferring lower-value chips
      // Only add if it won't exceed the target amount
      for (const color of colorsWithMinCount) {
        const value = chipValues[color];
        if (value > 0 && remaining >= value) {
          const newTotal = calculateBuyInAmount({ ...chips, [color]: chips[color] + 1 });
          if (newTotal <= targetAmount) {
            chips[color] += 1;
            remaining -= value;
            addedChip = true;
            break;
          }
        }
      }
      
      // If we can't add to minimum-count colors, try colors that are within 1 of minimum
      if (!addedChip) {
        const colorsWithinOne = sortedColorsLowToHigh.filter((color) => {
          return chips[color] === minCount + 1;
        });
        
        for (const color of colorsWithinOne) {
          const value = chipValues[color];
          if (value > 0 && remaining >= value) {
            const newTotal = calculateBuyInAmount({ ...chips, [color]: chips[color] + 1 });
            if (newTotal <= targetAmount) {
              chips[color] += 1;
              remaining -= value;
              addedChip = true;
              break;
            }
          }
        }
      }
      
      // If we can't add any more chips without exceeding, stop
      if (!addedChip) {
        break;
      }
    }

    // Final check: if we somehow exceeded, remove chips starting with highest value until we're below
    let currentTotal = calculateBuyInAmount(chips);
    if (currentTotal > targetAmount) {
      // Sort colors by value (highest first) to remove expensive chips first
      const sortedColorsHighToLow = [...CHIP_COLORS].sort((a, b) => chipValues[b] - chipValues[a]);
      
      for (const color of sortedColorsHighToLow) {
        while (chips[color] > 0 && currentTotal > targetAmount) {
          chips[color] -= 1;
          currentTotal = calculateBuyInAmount(chips);
        }
      }
    }

    // Now try to maximize: add back lower-value chips to get as close as possible to target
    currentTotal = calculateBuyInAmount(chips);
    remaining = targetAmount - currentTotal;
    
    // Try to add more chips, starting with lowest value, to maximize the total
    while (remaining > 0.01) {
      let addedChip = false;
      
      // Find minimum count and try to add to those colors first
      const currentCounts = [chips.red, chips.blue, chips.green, chips.white, chips.black];
      const minCount = Math.min(...currentCounts);
      const colorsWithMinCount = sortedColorsLowToHigh.filter((color) => {
        return chips[color] === minCount;
      });
      
      for (const color of colorsWithMinCount) {
        const value = chipValues[color];
        if (value > 0 && remaining >= value) {
          const newTotal = calculateBuyInAmount({ ...chips, [color]: chips[color] + 1 });
          if (newTotal <= targetAmount) {
            chips[color] += 1;
            remaining -= value;
            addedChip = true;
            break;
          }
        }
      }
      
      // If we can't add to minimum-count colors, try colors within 1
      if (!addedChip) {
        const colorsWithinOne = sortedColorsLowToHigh.filter((color) => {
          return chips[color] === minCount + 1;
        });
        
        for (const color of colorsWithinOne) {
          const value = chipValues[color];
          if (value > 0 && remaining >= value) {
            const newTotal = calculateBuyInAmount({ ...chips, [color]: chips[color] + 1 });
            if (newTotal <= targetAmount) {
              chips[color] += 1;
              remaining -= value;
              addedChip = true;
              break;
            }
          }
        }
      }
      
      if (!addedChip) {
        break;
      }
    }

    return chips;
  };

  // Rebalance chips when one is changed, keeping the changed chip constant
  const rebalanceChips = (
    chips: PersonChips,
    changedColor: ChipColor,
    targetAmount: number
  ): PersonChips => {
    const changedValue = chips[changedColor] * chipValues[changedColor];
    let remaining = Math.max(0, targetAmount - changedValue);
    
    const newChips: PersonChips = { red: 0, blue: 0, green: 0, white: 0, black: 0 };
    
    // Keep the changed chip constant
    newChips[changedColor] = chips[changedColor];

    // Calculate value of one set of remaining chips (excluding changed color)
    const remainingColors: ChipColor[] = CHIP_COLORS.filter((c) => c !== changedColor);
    const totalValuePerSet = remainingColors.reduce(
      (sum, color) => sum + chipValues[color],
      0
    );

    if (totalValuePerSet > 0) {
      // Distribute full sets evenly among remaining colors
      const fullSets = Math.floor(remaining / totalValuePerSet);
      for (const color of remainingColors) {
        newChips[color] = fullSets;
        remaining -= fullSets * chipValues[color];
      }
    }

    // Distribute any remainder to keep counts balanced, with bias towards lower-value chips
    // NEVER exceed the target amount
    const sortedRemainingColors = [...remainingColors].sort((a, b) => chipValues[a] - chipValues[b]);
    
    while (remaining > 0.01) {
      // Find the minimum count across remaining chips
      const currentCounts = remainingColors.map((color) => newChips[color]);
      const minCount = Math.min(...currentCounts);
      
      // Find colors that have the absolute minimum count
      const colorsWithMinCount = sortedRemainingColors.filter((color) => {
        return newChips[color] === minCount;
      });
      
      let addedChip = false;
      
      // First, try to add to colors with the minimum count, preferring lower-value chips
      // Only add if it won't exceed the target amount
      for (const color of colorsWithMinCount) {
        const value = chipValues[color];
        if (value > 0 && remaining >= value) {
          const newTotal = calculateBuyInAmount({ ...newChips, [color]: newChips[color] + 1 });
          if (newTotal <= targetAmount) {
            newChips[color] += 1;
            remaining -= value;
            addedChip = true;
            break;
          }
        }
      }
      
      // If we can't add to minimum-count colors, try colors that are within 1 of minimum
      if (!addedChip) {
        const colorsWithinOne = sortedRemainingColors.filter((color) => {
          return newChips[color] === minCount + 1;
        });
        
        for (const color of colorsWithinOne) {
          const value = chipValues[color];
          if (value > 0 && remaining >= value) {
            const newTotal = calculateBuyInAmount({ ...newChips, [color]: newChips[color] + 1 });
            if (newTotal <= targetAmount) {
              newChips[color] += 1;
              remaining -= value;
              addedChip = true;
              break;
            }
          }
        }
      }
      
      // If we can't add any more chips without exceeding, stop
      if (!addedChip) {
        break;
      }
    }

    // Final check: if we somehow exceeded, remove chips starting with highest value until we're below
    let currentTotal = calculateBuyInAmount(newChips);
    if (currentTotal > targetAmount) {
      // Sort remaining colors by value (highest first) to remove expensive chips first
      const sortedRemainingHighToLow = [...remainingColors].sort((a, b) => chipValues[b] - chipValues[a]);
      
      for (const color of sortedRemainingHighToLow) {
        while (newChips[color] > 0 && currentTotal > targetAmount) {
          newChips[color] -= 1;
          currentTotal = calculateBuyInAmount(newChips);
        }
      }
    }

    // Now try to maximize: add back lower-value chips to get as close as possible to target
    currentTotal = calculateBuyInAmount(newChips);
    remaining = targetAmount - currentTotal;
    
    // Try to add more chips, starting with lowest value, to maximize the total
    while (remaining > 0.01) {
      let addedChip = false;
      
      // Find minimum count and try to add to those colors first
      const currentCounts = remainingColors.map((color) => newChips[color]);
      const minCount = Math.min(...currentCounts);
      const colorsWithMinCount = sortedRemainingColors.filter((color) => {
        return newChips[color] === minCount;
      });
      
      for (const color of colorsWithMinCount) {
        const value = chipValues[color];
        if (value > 0 && remaining >= value) {
          const newTotal = calculateBuyInAmount({ ...newChips, [color]: newChips[color] + 1 });
          if (newTotal <= targetAmount) {
            newChips[color] += 1;
            remaining -= value;
            addedChip = true;
            break;
          }
        }
      }
      
      // If we can't add to minimum-count colors, try colors within 1
      if (!addedChip) {
        const colorsWithinOne = sortedRemainingColors.filter((color) => {
          return newChips[color] === minCount + 1;
        });
        
        for (const color of colorsWithinOne) {
          const value = chipValues[color];
          if (value > 0 && remaining >= value) {
            const newTotal = calculateBuyInAmount({ ...newChips, [color]: newChips[color] + 1 });
            if (newTotal <= targetAmount) {
              newChips[color] += 1;
              remaining -= value;
              addedChip = true;
              break;
            }
          }
        }
      }
      
      if (!addedChip) {
        break;
      }
    }

    return newChips;
  };

  const handleBuyInAmountChange = (value: string) => {
    setBuyInAmount(value);
    const amount = parseFloat(value);
    if (!isNaN(amount) && amount >= 0) {
      const calculatedChips = calculateChipsFromAmount(amount);
      setBuyInChips(calculatedChips);
      setLastChangedChip(null);
    } else if (value === "") {
      // Clear chips when amount is cleared
      setBuyInChips({ red: 0, blue: 0, green: 0, white: 0, black: 0 });
      setLastChangedChip(null);
    }
  };

  const handleChipChange = (color: ChipColor, delta: number) => {
    const newChips = { ...buyInChips };
    newChips[color] = Math.max(0, newChips[color] + delta);
    setLastChangedChip(color);
    
    // If we have a target amount, check if we need to rebalance
    if (buyInAmount && !isNaN(parseFloat(buyInAmount))) {
      const targetAmount = parseFloat(buyInAmount);
      const newTotal = calculateBuyInAmount(newChips);
      
      // When adding a chip: only rebalance if new total exceeds buy-in
      // When removing a chip: never rebalance (just remove the chip)
      const shouldRebalance = delta > 0 && newTotal > targetAmount;
      
      if (shouldRebalance) {
        // Need to rebalance to stay under the target and maximize
        const rebalanced = rebalanceChips(newChips, color, targetAmount);
        setBuyInChips(rebalanced);
      } else {
        // No rebalancing needed, just update chips
        setBuyInChips(newChips);
      }
    } else {
      // No target amount, just update chips
      setBuyInChips(newChips);
    }
  };

  const handleAddBuyIn = () => {
    if (!selectedPersonForBuyIn) return;
    addBuyIn({
      personId: selectedPersonForBuyIn,
      chips: buyInChips,
    });
    setSelectedPersonForBuyIn("");
    setBuyInAmount("");
    setLastChangedChip(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode("buyin")}
            className={`px-3 py-1 text-sm rounded transition-colors ${
              viewMode === "buyin"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
            }`}
          >
            Buy-in
          </button>
          <button
            onClick={() => setViewMode("endofnight")}
            className={`px-3 py-1 text-sm rounded transition-colors ${
              viewMode === "endofnight"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
            }`}
          >
            End of Night
          </button>
        </div>
      </div>

      {/* Chip Values */}
      <div className="mb-4 pb-4 border-b border-gray-300 dark:border-gray-600">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 md:mb-2">
          Chip Values ($)
        </label>
        <div className="grid grid-cols-5 gap-3 md:gap-2">
          {CHIP_COLORS.map((color) => (
            <div key={color}>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-2 md:mb-1">
                {CHIP_COLOR_NAMES[color]}
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={chipValues[color]}
                onChange={(e) => setChipValue(color, parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 md:px-2 md:py-1 text-base md:text-sm border-2 md:border border-gray-300 dark:border-gray-600 rounded-lg md:rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 touch-manipulation"
              />
            </div>
          ))}
        </div>
      </div>

      {viewMode === "buyin" ? (
        /* Buy-in Section */
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Person
            </label>
            <div className="flex flex-wrap gap-2 md:gap-2">
              {people.map((person) => {
                const isSelected = selectedPersonForBuyIn === person.id;
                const personBuyIns = buyIns.filter((b) => b.personId === person.id);
                const hasBuyIn = personBuyIns.length > 0;
                return (
                  <button
                    key={person.id}
                    type="button"
                    onClick={() => {
                      setSelectedPersonForBuyIn(person.id);
                    }}
                    className={`px-4 py-2 md:px-3 md:py-1 rounded-full text-base md:text-sm font-medium transition-colors touch-manipulation ${
                      isSelected
                        ? "bg-green-600 dark:bg-green-700 text-white ring-2 ring-green-400"
                        : hasBuyIn
                        ? "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200"
                        : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 active:bg-gray-400 dark:active:bg-gray-500"
                    }`}
                  >
                    {person.name}
                    {hasBuyIn && !isSelected && (
                      <span className="ml-1 text-xs md:text-xs">
                        ({personBuyIns.length})
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          {selectedPersonForBuyIn && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Buy-in Amount ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={buyInAmount}
                  onChange={(e) => handleBuyInAmountChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Chips
                </label>
                <div className="flex flex-wrap gap-3 md:gap-2">
                  {CHIP_COLORS.map((color) => {
                    const count = buyInChips[color];
                    const chipColorClasses: Record<ChipColor, string> = {
                      red: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border-red-300 dark:border-red-700",
                      blue: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-700",
                      green: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-300 dark:border-green-700",
                      white: "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600",
                      black: "bg-gray-800 dark:bg-gray-900 text-white border-gray-700 dark:border-gray-500",
                    };
                    return (
                      <div
                        key={color}
                        className={`inline-flex items-center gap-2 md:gap-1.5 px-4 py-2 md:px-3 md:py-1 rounded-full text-base md:text-sm border-2 md:border ${chipColorClasses[color]}`}
                      >
                        <span className="font-medium">{CHIP_COLOR_NAMES[color]}</span>
                        <div className="flex items-center gap-1.5 md:gap-1">
                          <button
                            type="button"
                            onClick={() => handleChipChange(color, -1)}
                            className="w-8 h-8 md:w-5 md:h-5 flex items-center justify-center rounded hover:bg-black/10 dark:hover:bg-white/10 active:bg-black/20 dark:active:bg-white/20 touch-manipulation"
                            aria-label={`Decrease ${CHIP_COLOR_NAMES[color]} chips`}
                          >
                            -
                          </button>
                          <span className="w-10 md:w-8 text-center font-medium">
                            {count}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleChipChange(color, 1)}
                            className="w-8 h-8 md:w-5 md:h-5 flex items-center justify-center rounded hover:bg-black/10 dark:hover:bg-white/10 active:bg-black/20 dark:active:bg-white/20 touch-manipulation"
                            aria-label={`Increase ${CHIP_COLOR_NAMES[color]} chips`}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="mt-3 md:mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Actual amount: ${calculateBuyInAmount(buyInChips).toFixed(2)}
                </p>
              </div>
              <button
                onClick={handleAddBuyIn}
                className="w-full px-4 py-3 md:py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-base md:text-sm font-medium touch-manipulation active:bg-green-800"
              >
                Add Buy-in
              </button>
            </>
          )}
          {buyIns.length > 0 && (
            <div className="mt-4 space-y-2">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Buy-ins:
              </h3>
              <div className="flex flex-wrap gap-2">
                {buyIns.map((buyIn) => (
                  <div
                    key={buyIn.id}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 rounded-full text-sm"
                  >
                    <span>
                      {getPersonName(buyIn.personId)}: ${buyIn.amount.toFixed(2)}
                    </span>
                    <button
                      onClick={() => removeBuyIn(buyIn.id)}
                      className="ml-1 hover:opacity-80 rounded-full p-0.5 transition-opacity"
                      aria-label={`Remove buy-in for ${getPersonName(buyIn.personId)}`}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* End of Night Section */
        <div className="space-y-3">
          {people.map((person) => {
            const currentChips = endOfNightChips[person.id] || {
              red: 0,
              blue: 0,
              green: 0,
              white: 0,
              black: 0,
            };
            const chipColorClasses: Record<ChipColor, string> = {
              red: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border-red-300 dark:border-red-700",
              blue: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-700",
              green: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-300 dark:border-green-700",
              white: "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600",
              black: "bg-gray-800 dark:bg-gray-900 text-white border-gray-700 dark:border-gray-500",
            };
            return (
              <div
                key={person.id}
                className="p-4 md:p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="font-medium text-gray-900 dark:text-gray-100 mb-3 md:mb-2">
                  {person.name}
                </div>
                <div className="flex flex-wrap gap-3 md:gap-2">
                  {CHIP_COLORS.map((color) => {
                    const count = currentChips[color];
                    return (
                      <div
                        key={color}
                        className={`inline-flex items-center gap-2 md:gap-1.5 px-4 py-2 md:px-3 md:py-1 rounded-full text-base md:text-sm border-2 md:border ${chipColorClasses[color]}`}
                      >
                        <span className="font-medium">{CHIP_COLOR_NAMES[color]}</span>
                        <div className="flex items-center gap-1.5 md:gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              setEndOfNightChips(person.id, {
                                ...currentChips,
                                [color]: Math.max(0, count - 1),
                              })
                            }
                            className="w-8 h-8 md:w-5 md:h-5 flex items-center justify-center rounded hover:bg-black/10 dark:hover:bg-white/10 active:bg-black/20 dark:active:bg-white/20 touch-manipulation"
                            aria-label={`Decrease ${CHIP_COLOR_NAMES[color]} chips for ${person.name}`}
                          >
                            -
                          </button>
                          <span className="w-10 md:w-8 text-center font-medium">
                            {count}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setEndOfNightChips(person.id, {
                                ...currentChips,
                                [color]: count + 1,
                              })
                            }
                            className="w-8 h-8 md:w-5 md:h-5 flex items-center justify-center rounded hover:bg-black/10 dark:hover:bg-white/10 active:bg-black/20 dark:active:bg-white/20 touch-manipulation"
                            aria-label={`Increase ${CHIP_COLOR_NAMES[color]} chips for ${person.name}`}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function PokerNightTool({}: ToolProps) {
  const {
    costs,
    people,
    chipValues,
    buyIns,
    endOfNightChips,
    addCost,
    removeCost,
    addPerson,
    removePerson,
    updatePerson,
    setChipValue,
    addBuyIn,
    removeBuyIn,
    setEndOfNightChips,
    clearAll,
  } = usePokerNightStore();

  const [newCostPerson, setNewCostPerson] = useState("");
  const [newCostAmount, setNewCostAmount] = useState("");
  const [newCostDescription, setNewCostDescription] = useState("");
  const [personInputValue, setPersonInputValue] = useState("");
  const [costChipTab, setCostChipTab] = useState<"cost" | "chips">("cost");

  // Calculate chip value for a person
  const calculateChipValue = (chips: PersonChips): number => {
    return (
      chips.red * chipValues.red +
      chips.blue * chipValues.blue +
      chips.green * chipValues.green +
      chips.white * chipValues.white +
      chips.black * chipValues.black
    );
  };

  // Calculate balances and payments (with optional chip settlement)
  const calculatePayments = (includeChips: boolean = false): Payment[] => {
    if (people.length === 0) return [];

    // Calculate total costs
    const totalCosts = costs.reduce((sum, cost) => sum + cost.amount, 0);
    const costPerPerson = totalCosts / people.length;

    // Calculate each person's balance
    // Positive balance = they've paid more than their share (owed money)
    // Negative balance = they've paid less than their share (owe money)
    const balances: Record<string, number> = {};
    
    people.forEach((person) => {
      const personCosts = costs
        .filter((cost) => cost.person === person.id)
        .reduce((sum, cost) => sum + cost.amount, 0);
      
      let balance = personCosts - costPerPerson;
      
      // If settling up, add chip value to balance (they "earned" this money)
      if (includeChips) {
        const endChips = endOfNightChips[person.id];
        if (endChips) {
          const chipValue = calculateChipValue(endChips);
          balance += chipValue; // Add chip value to their balance
        }
      }
      
      balances[person.id] = balance;
    });

    // Optimize payments (minimize number of transactions)
    const payments: Payment[] = [];
    const remainingBalances = { ...balances };

    // Sort people by balance (most negative first, most positive last)
    const sortedPeople = [...people].sort(
      (a, b) => remainingBalances[a.id] - remainingBalances[b.id]
    );

    let i = 0; // Start from most negative (owes most)
    let j = sortedPeople.length - 1; // Start from most positive (owed most)

    while (i < j) {
      const debtor = sortedPeople[i];
      const creditor = sortedPeople[j];
      const debt = Math.abs(remainingBalances[debtor.id]);
      const credit = remainingBalances[creditor.id];

      if (debt === 0) {
        i++;
        continue;
      }
      if (credit === 0) {
        j--;
        continue;
      }

      const paymentAmount = Math.min(debt, credit);
      if (paymentAmount > 0.01) {
        // Only create payment if it's more than 1 cent
        payments.push({
          from: debtor.id,
          to: creditor.id,
          amount: Math.round(paymentAmount * 100) / 100, // Round to 2 decimal places
        });
        remainingBalances[debtor.id] += paymentAmount;
        remainingBalances[creditor.id] -= paymentAmount;
      }

      if (Math.abs(remainingBalances[debtor.id]) < 0.01) {
        i++;
      }
      if (Math.abs(remainingBalances[creditor.id]) < 0.01) {
        j--;
      }
    }

    return payments;
  };

  const [isSettledUp, setIsSettledUp] = useState(false);
  const payments = calculatePayments(isSettledUp);

  const getPersonName = (id: string) => {
    return people.find((p) => p.id === id)?.name || "Unknown";
  };

  const handleAddCost = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(newCostAmount);
    if (!newCostPerson || isNaN(amount) || amount <= 0) return;

    addCost({
      person: newCostPerson,
      amount,
      description: newCostDescription || undefined,
    });

    setNewCostPerson("");
    setNewCostAmount("");
    setNewCostDescription("");
  };

  const handlePersonInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      handleAddPersonFromInput();
    } else if (e.key === "Backspace" && personInputValue === "" && people.length > 0) {
      // Remove last person if backspace is pressed on empty input
      removePerson(people[people.length - 1].id);
    }
  };

  const handleAddPersonFromInput = () => {
    const trimmed = personInputValue.trim();
    if (!trimmed) return;

    // Support comma-separated or line-separated names
    const names = trimmed
      .split(/[,\n]/)
      .map((name) => name.trim())
      .filter((name) => name.length > 0 && !people.some((p) => p.name.toLowerCase() === name.toLowerCase()));

    // Add all names as people (default to not having contributed)
    names.forEach((name) => {
      addPerson({
        name,
        hasContributed: false, // Default to false, can be toggled later
      });
    });

    setPersonInputValue("");
  };

  const totalCosts = costs.reduce((sum, cost) => sum + cost.amount, 0);
  const costPerPerson =
    people.length > 0 ? totalCosts / people.length : 0;

  return (
    <div className="flex flex-col h-full min-h-screen p-4 md:p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          Poker Night Cost Splitter
        </h1>
        {(costs.length > 0 || people.length > 0) && (
          <button
            onClick={clearAll}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
          >
            Clear All
          </button>
        )}
      </div>

      {/* People Section - No Box */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          People
        </h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            People
          </label>
          <div className="flex flex-wrap gap-2 md:gap-2 p-3 md:p-3 min-h-[3.5rem] md:min-h-[3rem] border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
            {people.map((person) => {
              const isSelectedForCost = newCostPerson === person.id;
              return (
                <div
                  key={person.id}
                  className={`inline-flex items-center gap-1.5 md:gap-1 px-3 py-2 md:px-3 md:py-1 rounded-full text-base md:text-sm transition-colors touch-manipulation ${
                    isSelectedForCost && person.hasContributed
                      ? "bg-green-600 dark:bg-green-700 text-white ring-2 ring-green-400 cursor-pointer"
                      : person.hasContributed
                      ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-900/40 cursor-pointer active:bg-green-300 dark:active:bg-green-900/50"
                      : "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 active:bg-blue-200 dark:active:bg-blue-900/40"
                  }`}
                  onClick={() => {
                    if (person.hasContributed) {
                      setNewCostPerson(person.id);
                    } else {
                      // If not a contributor, clicking toggles contributor status
                      updatePerson(person.id, {
                        hasContributed: !person.hasContributed,
                      });
                    }
                  }}
                  title={
                    person.hasContributed
                      ? "Click to select for cost assignment"
                      : "Click to mark as contributor"
                  }
                >
                  <span className="font-medium">{person.name}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removePerson(person.id);
                    }}
                    className="ml-1 hover:opacity-80 rounded-full p-1.5 md:p-0.5 transition-opacity touch-manipulation min-w-[32px] md:min-w-0 min-h-[32px] md:min-h-0 flex items-center justify-center"
                    aria-label={`Remove ${person.name}`}
                  >
                    <svg
                      className="w-5 h-5 md:w-4 md:h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              );
            })}
            <input
              type="text"
              value={personInputValue}
              onChange={(e) => setPersonInputValue(e.target.value)}
              onKeyDown={handlePersonInputKeyDown}
              className="flex-1 min-w-[120px] outline-none bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 text-base md:text-sm py-1 touch-manipulation"
              placeholder={people.length === 0 ? "Type names and press Enter or comma" : "Add more people..."}
            />
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Type names separated by commas or press Enter to add. Click a blue pill to mark as contributor, click a green pill to select for cost assignment, or X to remove.
          </p>
        </div>
      </div>

      {/* Add Cost and Poker Chips - Tabbed */}
      <div className="mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Add Costs & Chips
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => setCostChipTab("cost")}
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  costChipTab === "cost"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                }`}
              >
                Add Cost
              </button>
              <button
                onClick={() => setCostChipTab("chips")}
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  costChipTab === "chips"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                }`}
              >
                Poker Chips
              </button>
            </div>
          </div>

          {costChipTab === "cost" ? (
            <form onSubmit={handleAddCost} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Amount ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={newCostAmount}
                    onChange={(e) => setNewCostAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description (optional)
                  </label>
                  <input
                    type="text"
                    value={newCostDescription}
                    onChange={(e) => setNewCostDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Pizza, Beer, etc."
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={!newCostPerson || people.filter((p) => p.hasContributed).length === 0}
                className="w-full px-4 py-3 md:py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-base md:text-sm font-medium touch-manipulation active:bg-green-800"
              >
                Add Cost
              </button>
            </form>
          ) : (
            <PokerChipsSectionContent />
          )}
        </div>
      </div>

      {/* Costs List - Full Width */}
      <div className="mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Costs ({costs.length})
          </h2>
          {costs.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              No costs added yet
            </p>
          ) : (
            <div className="space-y-2">
              {costs.map((cost) => (
                <div
                  key={cost.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {getPersonName(cost.person)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      ${cost.amount.toFixed(2)}
                      {cost.description && ` - ${cost.description}`}
                    </div>
                  </div>
                  <button
                    onClick={() => removeCost(cost.id)}
                    className="ml-2 px-2 py-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {/* Settle Up Section */}
          {Object.keys(endOfNightChips).length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-300 dark:border-gray-600">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-md font-semibold text-gray-900 dark:text-gray-100">
                  Settle Up
                  {isSettledUp && (
                    <span className="ml-2 text-sm font-normal text-green-600 dark:text-green-400">
                      (Active)
                    </span>
                  )}
                </h3>
                <button
                  onClick={() => setIsSettledUp(!isSettledUp)}
                  className={`px-4 py-2 rounded-lg transition-colors text-sm ${
                    isSettledUp
                      ? "bg-green-600 hover:bg-green-700 text-white"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                >
                  {isSettledUp ? "Undo Settle Up" : "Settle Up"}
                </button>
              </div>
              
              {isSettledUp && (
                <div className="mt-4 space-y-2">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Chip Winnings:
                  </h4>
                  {people.map((person) => {
                    const endChips = endOfNightChips[person.id];
                    if (!endChips) return null;
                    
                    const chipValue = calculateChipValue(endChips);
                    const buyInTotal = buyIns
                      .filter((b) => b.personId === person.id)
                      .reduce((sum, b) => sum + b.amount, 0);
                    const winnings = chipValue - buyInTotal;
                    
                    return (
                      <div
                        key={person.id}
                        className={`p-3 rounded-lg ${
                          winnings >= 0
                            ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                            : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-gray-100">
                              {person.name}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              Chips: ${chipValue.toFixed(2)} | Buy-ins: ${buyInTotal.toFixed(2)}
                            </div>
                          </div>
                          <div
                            className={`text-lg font-bold ${
                              winnings >= 0
                                ? "text-green-600 dark:text-green-400"
                                : "text-red-600 dark:text-red-400"
                            }`}
                          >
                            {winnings >= 0 ? "+" : ""}${winnings.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Summary Section */}
      {(people.length > 0 || costs.length > 0) && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 p-4 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Summary
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Total People
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {people.length}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Total Costs
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                ${totalCosts.toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Cost Per Person
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                ${costPerPerson.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payments Section */}
      {payments.length > 0 && (
        <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Payments Required
            {isSettledUp && (
              <span className="ml-2 text-sm font-normal text-green-600 dark:text-green-400">
                (Settled with chips)
              </span>
            )}
          </h2>
          {payments.length > 0 ? (
            <div className="space-y-2">
              {payments.map((payment, index) => (
                <div
                  key={index}
                  className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
                >
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    <span className="text-red-600 dark:text-red-400">
                      {getPersonName(payment.from)}
                    </span>{" "}
                    should pay{" "}
                    <span className="text-green-600 dark:text-green-400">
                      {getPersonName(payment.to)}
                    </span>{" "}
                    <span className="text-lg font-bold">
                      ${payment.amount.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : isSettledUp ? (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-green-800 dark:text-green-200 font-medium">
                All settled! No payments required after accounting for chip values.
              </p>
            </div>
          ) : null}
        </div>
      )}

      {people.length > 0 && costs.length === 0 && (
        <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-yellow-800 dark:text-yellow-200 text-sm">
            Add costs to see payment calculations. Make sure to mark people as
            "has contributed" if they've brought items.
          </p>
        </div>
      )}
    </div>
  );
}

