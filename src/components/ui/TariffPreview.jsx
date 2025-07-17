import InfoModal from "./InfoModal.jsx";
import EyeIcon from "./EyeIcon.jsx";
import {formatCurrency, formatDescription} from "../../utils/formatters.jsx";
import CalcStatisticsService from "../../services/calc-statistics.js";

const TariffPreview = ({ selectedTariff, currencySymbol, promoCodeValid, promoDiscount }) => {
    // Function to get the heroicon for each type
    const getIcon = (type) => {
        // Heroicons style (without currency icons)
        switch (type) {
            case "baseAmount": return (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
            ); // Home icon
            case "discount": return (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
                </svg>
            ); // Sparkles icon
            case "promoCode": return (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-500" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 100 4v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2a2 2 0 100-4V6z" />
                </svg>
            ); // Ticket icon
            case "tax": return (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 2a2 2 0 00-2 2v14l3.5-2 3.5 2 3.5-2 3.5 2V4a2 2 0 00-2-2H5zm4.707 3.707a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L8.414 9H10a3 3 0 013 3v1a1 1 0 102 0v-1a5 5 0 00-5-5H8.414l1.293-1.293z" clipRule="evenodd" />
                </svg>
            ); // Receipt tax icon
            case "totalAmount": return (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
            ); // Check circle icon
            default: return (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
            ); // Information circle icon
        }
    };
    return (
        <>
            {selectedTariff && (
                <div className="bg-white p-3 sm:p-4 rounded-xl mb-3 sm:mb-4 border border-gray-200 shadow-sm">
                    <h3 className="text-base sm:text-lg font-medium text-gray-800 mb-2 sm:mb-3">
                        Вие избрахте покритие "{selectedTariff.name}" за Вашето имущество
                    </h3>

                    <div className="space-y-2 sm:space-y-3">
                    {/* Display clauses if available */}
                    {selectedTariff.tariff_preset_clauses && (
                        <div className="p-3 bg-gray-50 rounded-lg mb-4 border border-gray-200">
                            {/* Header - hidden on mobile */}
                            <div className="hidden sm:flex justify-between border-b border-gray-200 py-1 mb-1">
                                <div className="font-medium text-gray-800 text-sm sm:text-base">Клаузи</div>
                                <div className="font-medium text-gray-800 text-sm sm:text-base">Застрахователна сума</div>
                            </div>

                            {/* Clause rows - mobile optimized */}
                            <div className="space-y-1">
                                {selectedTariff.tariff_preset_clauses
                                    .filter(clause => parseFloat(clause.tariff_amount) !== 0 && clause.tariff_amount !== '')
                                    .map((clause) => (
                                        <div key={clause.id}
                                             className="flex justify-between items-center border-b border-gray-200 py-2">
                                            <div
                                                className="text-gray-800 text-sm sm:text-base pr-2 flex-1 flex items-center">
                                                {clause.insurance_clause.name}
                                                {clause.insurance_clause.description && (
                                                    <InfoModal
                                                        title={clause.insurance_clause.name}
                                                        content={formatDescription(clause.insurance_clause.description)}
                                                        icon={
                                                            <EyeIcon className="text-primary h-4 w-4 ml-1"/>
                                                        }
                                                    />
                                                )}
                                            </div>
                                            <div
                                                className="text-gray-800 text-sm sm:text-base text-right font-semibold whitespace-nowrap">
                                              <span className="text-primary">
                                                {formatCurrency(clause.tariff_amount)} {currencySymbol}
                                              </span>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    )}

                    {/* Statistics section */}
                    {selectedTariff.statistics && (
                        <div className="mt-4 rounded-lg overflow-hidden border border-gray-300 shadow-md">
                            {selectedTariff.statistics.total_premium && (
                                <div className="border-b border-gray-200 bg-gray-100 p-2.5 sm:p-3">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-start sm:items-center mb-1 sm:mb-0">
                                            {/*<span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-2 mt-1 sm:mt-0 flex-shrink-0"></span>*/}
                                            <span className="inline-block text-accent rounded-full mr-2 mt-0.5 sm:mt-0 flex-shrink-0 text-xl">{getIcon("baseAmount")}</span>
                                            <span className="uppercase text-gray-800 text-xs sm:text-sm font-medium leading-tight">
                                              Базова сума
                                            </span>
                                        </div>
                                        <div className="text-primary font-semibold text-sm sm:text-base sm:ml-2 self-end sm:self-auto">
                                            {formatCurrency(
                                                CalcStatisticsService.calculate(
                                                    selectedTariff.statistics.total_premium,
                                                    selectedTariff.tax_percent,
                                                    selectedTariff.discount_percent,
                                                    promoDiscount
                                                ).insurancePremiumAmount
                                            )} {currencySymbol}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {selectedTariff.statistics.discounted_premium && selectedTariff.discount_percent && (
                                <div className="border-b border-gray-200 bg-gray-100 p-2.5 sm:p-3">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-start sm:items-center mb-1 sm:mb-0">
                                            <span className="inline-block rounded-full mr-2 mt-0.5 sm:mt-0 flex-shrink-0 text-xl">{getIcon("discount")}</span>
                                            <span className="uppercase text-gray-800 text-xs sm:text-sm font-medium leading-tight">
                                              След отстъпка -{selectedTariff.discount_percent}%
                                            </span>
                                        </div>
                                        <div className="text-primary font-semibold text-sm sm:text-base sm:ml-2 self-end sm:self-auto">
                                            {formatCurrency(
                                                CalcStatisticsService.calculate(
                                                    selectedTariff.statistics.total_premium,
                                                    selectedTariff.tax_percent,
                                                    selectedTariff.discount_percent,
                                                    promoDiscount
                                                ).regularDiscountAmount
                                            )} {currencySymbol}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Show premium after promo code if a valid promo code is applied */}
                            {promoCodeValid && promoDiscount && selectedTariff.statistics.discounted_premium && (
                                <div className="border-b border-gray-200 bg-gray-100 p-2.5 sm:p-3">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-start sm:items-center mb-1 sm:mb-0">
                                            <span className="inline-block rounded-full mr-2 mt-0.5 sm:mt-0 flex-shrink-0 text-xl">{getIcon("promoCode")}</span>
                                            <span className="uppercase text-gray-800 text-xs sm:text-sm font-medium leading-tight">
                                              Промо код -{promoDiscount}%
                                            </span>
                                        </div>
                                        <div className="text-primary font-semibold text-sm sm:text-base sm:ml-2 self-end sm:self-auto">
                                            {formatCurrency(
                                                CalcStatisticsService.calculate(
                                                    selectedTariff.statistics.total_premium,
                                                    selectedTariff.tax_percent,
                                                    selectedTariff.discount_percent,
                                                    promoDiscount
                                                ).promoDiscountAmount
                                            )} {currencySymbol}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {selectedTariff.statistics.tax_amount && selectedTariff.tax_percent && (
                                <div className="border-b border-gray-200 bg-gray-100 p-2.5 sm:p-3">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-start sm:items-center mb-1 sm:mb-0">
                                            <span className="inline-block rounded-full mr-2 mt-0.5 sm:mt-0 flex-shrink-0 text-xl">{getIcon("tax")}</span>
                                            <span className="uppercase text-gray-800 text-xs sm:text-sm font-medium leading-tight">
                                              ДЗП +{selectedTariff.tax_percent}%
                                            </span>
                                        </div>
                                        <div className="text-primary font-semibold text-sm sm:text-base sm:ml-2 self-end sm:self-auto">
                                            {formatCurrency(
                                                CalcStatisticsService.calculate(
                                                    selectedTariff.statistics.total_premium,
                                                    selectedTariff.tax_percent,
                                                    selectedTariff.discount_percent,
                                                    promoDiscount
                                                ).taxAmount
                                            )} {currencySymbol}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="border-b border-gray-200 bg-gray-100 p-2.5 sm:p-3">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center ">
                                        <span className="inline-block rounded-full mr-2 mt-0.5 sm:mt-0 flex-shrink-0 text-xl">{getIcon("totalAmount")}</span>
                                        {/*<span className="inline-block w-3 h-3 bg-red-500 rounded-full mr-2 mt-0.5 sm:mt-0 flex-shrink-0"></span>*/}
                                        <span className="uppercase text-gray-800 text-xs sm:text-sm font-medium leading-tight">
                                          Дължима сума за год.
                                        </span>
                                    </div>
                                    <div className="text-primary font-semibold text-sm sm:text-base sm:ml-2 self-end sm:self-auto pulse">
                                        {formatCurrency(
                                            CalcStatisticsService.calculate(
                                                selectedTariff.statistics.total_premium,
                                                selectedTariff.tax_percent,
                                                selectedTariff.discount_percent,
                                                promoDiscount
                                            ).totalAmount
                                        )} {currencySymbol}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    </div>
                </div>
            )}
        </>
    )
}

export default TariffPreview;
