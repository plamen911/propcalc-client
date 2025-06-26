const CalcStatisticsService = {
    calculate: (insurancePremiumAmount, taxPercent, regularDiscountPercent, promoDiscountPercent = 0) => {
        insurancePremiumAmount = +insurancePremiumAmount;
        promoDiscountPercent = +promoDiscountPercent;

        const regularDiscountAmount = +((insurancePremiumAmount - (insurancePremiumAmount * (regularDiscountPercent / 100))).toFixed(2));
        let taxAmount = +((regularDiscountAmount * taxPercent / 100).toFixed(2));
        let totalAmount = +((regularDiscountAmount + taxAmount).toFixed(2));
        let promoDiscountAmount = 0.0;
        if (promoDiscountPercent > 0) {
            promoDiscountAmount = +((regularDiscountAmount - (insurancePremiumAmount * (promoDiscountPercent / 100))).toFixed(2));
            taxAmount = +(promoDiscountAmount * taxPercent / 100).toFixed(2);
            totalAmount = +(promoDiscountAmount + taxAmount).toFixed(2);
        }

        const totalAmountWithoutDiscount = +((insurancePremiumAmount + (insurancePremiumAmount * taxPercent / 100)).toFixed(2));

        return {
            insurancePremiumAmount,
            regularDiscountAmount,
            promoDiscountAmount,
            taxAmount,
            totalAmount,
            totalAmountWithoutDiscount
        }
    }
}

export default CalcStatisticsService;
