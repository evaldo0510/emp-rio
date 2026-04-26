export const validateCommissionRate = (rateInput: any): number | null => {
  if (rateInput === null || rateInput === undefined) {
    return null;
  }

  const rateStr = String(rateInput).trim();
  if (rateStr === "") {
    return null;
  }

  const rate = Number(rateStr);
  
  if (isNaN(rate) || rate < 0 || rate > 100) {
    return null;
  }

  return Math.round(rate * 100) / 100;
};
