import InfoModal from "./InfoModal.jsx";
import EyeIcon from "./EyeIcon.jsx";
import {formatCurrency, formatDescription} from "../../utils/formatters.jsx";
import CalcStatisticsService from "../../services/calc-statistics.js";

const TariffPreview = ({ selectedTariff, currencySymbol, promoCodeValid, promoDiscount }) => {
    return (
        <>
            {selectedTariff && (
                <div className="bg-white/10 p-6 rounded-xl mb-6 border border-white/20">
                    <h3 className="text-lg font-medium text-white mb-4">
                        Вие избрахте покритие "{selectedTariff.name}" за Вашето имущество
                    </h3>

                    {/* Display clauses if available */}
                    {selectedTariff.tariff_preset_clauses && (
                        <div className="p-3 bg-white/5 rounded-lg mb-4">
                            {/* Header - hidden on mobile */}
                            <div className="hidden sm:flex justify-between border-b border-white/10 py-1 mb-1">
                                <div className="font-medium text-white text-sm sm:text-base">Клаузи</div>
                                <div className="font-medium text-white text-sm sm:text-base">Застрахователна сума</div>
                            </div>

                            {/* Clause rows - mobile optimized */}
                            <div className="space-y-1">
                                {selectedTariff.tariff_preset_clauses
                                    .filter(clause => parseFloat(clause.tariff_amount) !== 0 && clause.tariff_amount !== '')
                                    .map((clause) => (
                                        <div key={clause.id}
                                             className="flex justify-between items-center border-b border-white/10 py-2">
                                            <div
                                                className="text-white text-sm sm:text-base pr-2 flex-1 flex items-center">
                                                {clause.insurance_clause.name}
                                                {clause.insurance_clause.description && (
                                                    <InfoModal
                                                        title={clause.insurance_clause.name}
                                                        content={formatDescription(clause.insurance_clause.description)}
                                                        icon={
                                                            <EyeIcon className="text-accent h-4 w-4 ml-1"/>
                                                        }
                                                    />
                                                )}
                                            </div>
                                            <div
                                                className="text-white text-sm sm:text-base text-right font-semibold whitespace-nowrap">
                                              <span className="text-accent">
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
                        <div className="mt-4 rounded-lg overflow-hidden border border-white/20 shadow-md">
                            {selectedTariff.statistics.total_premium && (
                                <div className="border-b border-white/10 bg-white/5 p-3">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center">
                                            <span className="inline-block w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                                            <span className="uppercase text-white text-xs sm:text-sm font-medium">
                                              Застрахователна премия
                                            </span>
                                        </div>
                                        <div className="font-semibold text-base sm:text-lg ml-2 whitespace-nowrap">
                                          <span className="text-accent">
                                            {formatCurrency(
                                                CalcStatisticsService.calculate(
                                                    selectedTariff.statistics.total_premium,
                                                    selectedTariff.tax_percent,
                                                    selectedTariff.discount_percent,
                                                    promoDiscount
                                                ).insurancePremiumAmount
                                            )} {currencySymbol}
                                          </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {selectedTariff.statistics.discounted_premium && selectedTariff.discount_percent && (
                                <div className="border-b border-white/10 bg-white/5 p-3">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center">
                                            <span
                                                className="inline-block w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                                            <span className="uppercase text-white text-xs sm:text-sm font-medium">
                                          Застрахователна премия след отстъпка {selectedTariff.discount_percent}%
                                        </span>
                                        </div>
                                        <div className="font-semibold text-base sm:text-lg ml-2 whitespace-nowrap">
                                          <span className="text-accent">
                                            {formatCurrency(
                                                CalcStatisticsService.calculate(
                                                    selectedTariff.statistics.total_premium,
                                                    selectedTariff.tax_percent,
                                                    selectedTariff.discount_percent,
                                                    promoDiscount
                                                ).regularDiscountAmount
                                            )} {currencySymbol}
                                          </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Show premium after promo code if a valid promo code is applied */}
                            {promoCodeValid && promoDiscount && selectedTariff.statistics.discounted_premium && (
                                <div className="border-b border-white/10 bg-white/5 p-3">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center">
                                            <span
                                                className="inline-block w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                                            <span className="uppercase text-white text-xs sm:text-sm font-medium">
                                          Застрахователна премия след приложен промо код {promoDiscount}%
                                        </span>
                                        </div>
                                        <div className="font-semibold text-base sm:text-lg ml-2 whitespace-nowrap">
                                          <span className="text-accent">
                                            {formatCurrency(
                                                CalcStatisticsService.calculate(
                                                    selectedTariff.statistics.total_premium,
                                                    selectedTariff.tax_percent,
                                                    selectedTariff.discount_percent,
                                                    promoDiscount
                                                ).promoDiscountAmount
                                            )} {currencySymbol}
                                          </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {selectedTariff.statistics.tax_amount && selectedTariff.tax_percent && (
                                <div className="border-b border-white/10 bg-white/5 p-3">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center">
                                            <span
                                                className="inline-block w-2 h-2 bg-yellow-400 rounded-full mr-2"></span>
                                            <span className="uppercase text-white text-xs sm:text-sm font-medium">
                                              Данък върху застрахователната премия {selectedTariff.tax_percent}%
                                            </span>
                                        </div>
                                        <div className="font-semibold text-base sm:text-lg ml-2 whitespace-nowrap">
                                          <span className="text-accent">
                                            {formatCurrency(
                                                CalcStatisticsService.calculate(
                                                    selectedTariff.statistics.total_premium,
                                                    selectedTariff.tax_percent,
                                                    selectedTariff.discount_percent,
                                                    promoDiscount
                                                ).taxAmount
                                            )} {currencySymbol}
                                          </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="bg-primary/70 p-3">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center">
                                        <span className="inline-block w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                                        <span className="uppercase text-white text-sm sm:text-base font-bold">
                                          Общо дължима сума за една година
                                        </span>
                                    </div>
                                    <div className="text-white font-bold text-lg sm:text-xl ml-2 whitespace-nowrap">
                                      <span className="text-accent">
                                        {formatCurrency(
                                            CalcStatisticsService.calculate(
                                                selectedTariff.statistics.total_premium,
                                                selectedTariff.tax_percent,
                                                selectedTariff.discount_percent,
                                                promoDiscount
                                            ).totalAmount
                                        )} {currencySymbol}
                                      </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </>
    )
}

export default TariffPreview;
