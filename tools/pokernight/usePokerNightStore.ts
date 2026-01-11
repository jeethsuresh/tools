import { create } from "zustand";

export interface Cost {
  id: string;
  person: string;
  amount: number; // in dollars (e.g., 25.50)
  description?: string;
}

export interface Person {
  id: string;
  name: string;
  hasContributed: boolean; // true if they've brought something, false if they're just sharing costs
}

export type ChipColor = "red" | "blue" | "green" | "white" | "black";

export interface ChipValues {
  red: number;
  blue: number;
  green: number;
  white: number;
  black: number;
}

export interface PersonChips {
  red: number;
  blue: number;
  green: number;
  white: number;
  black: number;
}

export interface BuyIn {
  id: string;
  personId: string;
  chips: PersonChips;
  amount: number; // calculated from chip values
}

interface PokerNightState {
  costs: Cost[];
  people: Person[];
  chipValues: ChipValues;
  buyIns: BuyIn[];
  endOfNightChips: Record<string, PersonChips>; // personId -> chips
  
  // Actions
  addCost: (cost: Omit<Cost, "id">) => void;
  removeCost: (id: string) => void;
  updateCost: (id: string, cost: Partial<Cost>) => void;
  addPerson: (person: Omit<Person, "id">) => void;
  removePerson: (id: string) => void;
  updatePerson: (id: string, person: Partial<Person>) => void;
  setChipValue: (color: ChipColor, value: number) => void;
  addBuyIn: (buyIn: Omit<BuyIn, "id" | "amount">) => void;
  removeBuyIn: (buyInId: string) => void;
  updateBuyIn: (buyInId: string, chips: PersonChips) => void;
  setEndOfNightChips: (personId: string, chips: PersonChips) => void;
  clearAll: () => void;
}

const calculateBuyInAmount = (chips: PersonChips, values: ChipValues): number => {
  return (
    chips.red * values.red +
    chips.blue * values.blue +
    chips.green * values.green +
    chips.white * values.white +
    chips.black * values.black
  );
};

export const usePokerNightStore = create<PokerNightState>((set) => ({
  costs: [],
  people: [],
  chipValues: {
    red: 1,
    blue: 5,
    green: 10,
    white: 25,
    black: 100,
  },
  buyIns: [],
  endOfNightChips: {},
  
  addCost: (cost) =>
    set((state) => ({
      costs: [
        ...state.costs,
        {
          ...cost,
          id: `cost-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        },
      ],
    })),
  
  removeCost: (id) =>
    set((state) => ({
      costs: state.costs.filter((cost) => cost.id !== id),
    })),
  
  updateCost: (id, updates) =>
    set((state) => ({
      costs: state.costs.map((cost) =>
        cost.id === id ? { ...cost, ...updates } : cost
      ),
    })),
  
  addPerson: (person) =>
    set((state) => ({
      people: [
        ...state.people,
        {
          ...person,
          id: `person-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        },
      ],
    })),
  
  removePerson: (id) =>
    set((state) => ({
      people: state.people.filter((person) => person.id !== id),
      // Also remove costs associated with this person
      costs: state.costs.filter((cost) => cost.person !== id),
      buyIns: state.buyIns.filter((buyIn) => buyIn.personId !== id),
      endOfNightChips: Object.fromEntries(
        Object.entries(state.endOfNightChips).filter(([pid]) => pid !== id)
      ),
    })),
  
  updatePerson: (id, updates) =>
    set((state) => ({
      people: state.people.map((person) =>
        person.id === id ? { ...person, ...updates } : person
      ),
    })),
  
  setChipValue: (color, value) =>
    set((state) => {
      const newValues = { ...state.chipValues, [color]: value };
      // Recalculate all buy-in amounts and update costs
      const updatedBuyIns = state.buyIns.map((buyIn) => ({
        ...buyIn,
        amount: calculateBuyInAmount(buyIn.chips, newValues),
      }));
      const updatedCosts = state.costs.map((cost) => {
        if (cost.id.startsWith("buyin-")) {
          const buyInId = cost.id.replace("buyin-", "");
          const buyIn = updatedBuyIns.find((b) => b.id === buyInId);
          if (buyIn) {
            return { ...cost, amount: buyIn.amount };
          }
        }
        return cost;
      });
      return {
        chipValues: newValues,
        buyIns: updatedBuyIns,
        costs: updatedCosts,
      };
    }),
  
  addBuyIn: (buyIn) =>
    set((state) => {
      const amount = calculateBuyInAmount(buyIn.chips, state.chipValues);
      const buyInId = `buyin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newBuyIn = { ...buyIn, id: buyInId, amount };
      // Add as a cost
      const costId = buyInId;
      return {
        buyIns: [...state.buyIns, newBuyIn],
        costs: [
          ...state.costs,
          {
            id: costId,
            person: buyIn.personId,
            amount,
            description: "Buy-in",
          },
        ],
      };
    }),
  
  removeBuyIn: (buyInId) =>
    set((state) => ({
      buyIns: state.buyIns.filter((b) => b.id !== buyInId),
      costs: state.costs.filter((c) => c.id !== buyInId),
    })),
  
  updateBuyIn: (buyInId, chips) =>
    set((state) => {
      const amount = calculateBuyInAmount(chips, state.chipValues);
      const updatedBuyIns = state.buyIns.map((buyIn) =>
        buyIn.id === buyInId ? { ...buyIn, chips, amount } : buyIn
      );
      // Update the cost
      return {
        buyIns: updatedBuyIns,
        costs: state.costs.map((cost) =>
          cost.id === buyInId ? { ...cost, amount } : cost
        ),
      };
    }),
  
  setEndOfNightChips: (personId, chips) =>
    set((state) => ({
      endOfNightChips: {
        ...state.endOfNightChips,
        [personId]: chips,
      },
    })),
  
  clearAll: () =>
    set({
      costs: [],
      people: [],
      buyIns: [],
      endOfNightChips: {},
    }),
}));

