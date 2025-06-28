import InfoModal from "./InfoModal.jsx";
import EyeIcon from "./EyeIcon.jsx";
import {formatCurrency, formatDescription} from "../../utils/formatters.jsx";
import CalcStatisticsService from "../../services/calc-statistics.js";

const TariffPreview = ({ selectedTariff, currencySymbol, promoCodeValid, promoDiscount }) => {
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
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                                        <div className="flex items-start sm:items-center mb-1 sm:mb-0">
                                            <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-2 mt-1 sm:mt-0 flex-shrink-0"></span>
                                            <span className="uppercase text-gray-800 text-xs sm:text-sm font-medium leading-tight">
                                              Застрахователна премия
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
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                                        <div className="flex items-start sm:items-center mb-1 sm:mb-0">
                                            <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2 mt-1 sm:mt-0 flex-shrink-0"></span>
                                            <span className="uppercase text-gray-800 text-xs sm:text-sm font-medium leading-tight">
                                              Застрахователна премия след отстъпка {selectedTariff.discount_percent}%
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
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                                        <div className="flex items-start sm:items-center mb-1 sm:mb-0">
                                            <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2 mt-1 sm:mt-0 flex-shrink-0"></span>
                                            <span className="uppercase text-gray-800 text-xs sm:text-sm font-medium leading-tight">
                                              Застрахователна премия след приложен промо код {promoDiscount}%
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
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                                        <div className="flex items-start sm:items-center mb-1 sm:mb-0">
                                            <span className="inline-block w-2 h-2 bg-yellow-500 rounded-full mr-2 mt-1 sm:mt-0 flex-shrink-0"></span>
                                            <span className="uppercase text-gray-800 text-xs sm:text-sm font-medium leading-tight">
                                              Данък върху застрахователната премия {selectedTariff.tax_percent}%
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
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                                    <div className="flex items-start sm:items-center mb-1.5 sm:mb-0">
                                        <span className="inline-block w-3 h-3 bg-red-500 rounded-full mr-2 mt-0.5 sm:mt-0 flex-shrink-0"></span>
                                        <span className="uppercase text-gray-800 text-xs sm:text-sm font-medium leading-tight">
                                          Общо дължима сума за една година
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
