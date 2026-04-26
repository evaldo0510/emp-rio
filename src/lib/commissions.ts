export const validateCommissionRate = (rateInput: any): number | null => {
  const rate = typeof rateInput === "string" && rateInput.trim() === "" ? NaN : Number(rateInput);
  
  // Round to 2 decimal places (as percentages, so 15.25 is 0.1525)
  // Input is the percentage value (0 to 100)
  if (isNaN(rate) || rate < 0 || rate > 100) {
    return null;
  }

  return Math.round(rate * 100) / 100;
};
