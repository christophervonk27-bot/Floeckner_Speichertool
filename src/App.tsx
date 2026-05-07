import { useState, useMemo } from 'react';

// Helper functions for formatting
const formatNumber = (value: number): string => new Intl.NumberFormat('de-DE').format(value);
const formatCurrency = (value: number): string => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);
const formatDecimal = (value: number): string => value.toFixed(2).replace('.', ',');

// Input field component
interface InputProps {
  label: string;
  value: number | string;
  onChange: (value: number | string) => void;
  unit: string;
  hint?: string;
  min?: number;
  max?: number;
  step?: number;
  type?: string;
}

function InputField({ label, value, onChange, unit, hint, min = 0, max = Infinity, step = 1, type = "number" }: InputProps) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
        {label}
        {hint && <span className="text-gray-400 text-xs">({hint})</span>}
      </label>
      <div className="flex items-center gap-2">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(type === "number" ? Number(e.target.value) : e.target.value)}
          min={min}
          max={max}
          step={step}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <span className="text-gray-600 whitespace-nowrap">{unit}</span>
      </div>
    </div>
  );
}

// Storage row component
interface StorageRowProps {
  size: number;
  data: {
    usableDischarge: number;
    additionalConsumption: number;
    restGridConsumption: number;
    restFeedIn: number;
    grossSavings: number;
    investment: number;
    maintenance: number;
    netBenefit: number;
    amortization: number;
    netAdvantage: number;
    rating: string;
  };
  isOptimal: boolean;
}

function StorageRow({ size, data, isOptimal }: StorageRowProps) {
  return (
    <tr className={isOptimal ? 'bg-green-50 font-medium' : ''}>
      <td className="px-4 py-2 text-center">{size}</td>
      <td className="px-4 py-2 text-right">{formatNumber(Math.round(data.usableDischarge))}</td>
      <td className="px-4 py-2 text-right">{formatNumber(Math.round(data.additionalConsumption))}</td>
      <td className="px-4 py-2 text-right">{formatNumber(Math.round(data.restGridConsumption))}</td>
      <td className="px-4 py-2 text-right">{formatNumber(Math.round(data.restFeedIn))}</td>
      <td className="px-4 py-2 text-right">{formatCurrency(data.grossSavings)}</td>
      <td className="px-4 py-2 text-right">{formatCurrency(data.investment)}</td>
      <td className="px-4 py-2 text-right">{formatCurrency(data.maintenance)}</td>
      <td className="px-4 py-2 text-right">{formatCurrency(data.netBenefit)}</td>
      <td className="px-4 py-2 text-right">{formatDecimal(data.amortization)}</td>
      <td className="px-4 py-2 text-right">{formatCurrency(data.netAdvantage)}</td>
      <td className="px-4 py-2 text-center">
        {isOptimal ? (
          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold">
            BESTER WERT
          </span>
        ) : data.rating === 'wirtschaftlich' ? (
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
            wirtschaftlich
          </span>
        ) : (
          <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">
            prüfen
          </span>
        )}
      </td>
    </tr>
  );
}

// Result card component
interface ResultCardProps {
  title: string;
  value: string | number;
  unit?: string;
  description: string;
}

function ResultCard({ title, value, unit, description }: ResultCardProps) {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
      <div className="text-2xl font-bold text-blue-600 mb-1">
        {typeof value === 'number' ? formatNumber(value) : value}
        {unit && <span className="text-lg font-normal text-gray-500"> {unit}</span>}
      </div>
      <p className="text-xs text-gray-500">{description}</p>
    </div>
  );
}

// Main component
export default function App() {
  // State for all input parameters
  const [inputs, setInputs] = useState({
    customer: '',
    gridConsumption: 50000,
    pvSurplus: 100000,
    totalConsumption: 115000,
    electricityPrice: 0.28,
    feedInTariff: 0.06,
    batteryEfficiency: 0.9,
    fullCycles: 260,
    variableStorageCost: 250,
    fixedStorageCost: 5000,
    considerationPeriod: 20,
    maintenanceRate: 0.005,
    storageStep: 25,
    maxStorageSize: 1000,
    amortizationThreshold: 10,
  });

  // Calculate all storage sizes
  const storageSizes = useMemo(() => {
    const sizes: number[] = [];
    for (let size = inputs.storageStep; size <= inputs.maxStorageSize; size += inputs.storageStep) {
      sizes.push(size);
    }
    return sizes;
  }, [inputs.storageStep, inputs.maxStorageSize]);

  // Calculate results for all storage sizes
  const results = useMemo(() => {
    const savingsPerKWh = inputs.electricityPrice - inputs.feedInTariff;

    return storageSizes.map((size) => {
      const usableDischarge = size * inputs.fullCycles * inputs.batteryEfficiency;
      const additionalConsumption = Math.min(usableDischarge, inputs.pvSurplus, inputs.totalConsumption);
      const restGridConsumption = Math.max(inputs.gridConsumption - additionalConsumption, 0);
      const restFeedIn = Math.max(inputs.pvSurplus - (additionalConsumption / inputs.batteryEfficiency), 0);
      const grossSavings = additionalConsumption * savingsPerKWh;
      const investment = size * inputs.variableStorageCost + inputs.fixedStorageCost;
      const maintenance = investment * inputs.maintenanceRate;
      const netBenefit = grossSavings - maintenance;
      const amortization = netBenefit > 0 ? investment / netBenefit : Infinity;
      const netAdvantage = netBenefit * inputs.considerationPeriod - investment;

      let rating = 'prüfen';
      if (amortization <= inputs.amortizationThreshold) {
        rating = 'wirtschaftlich';
      }

      return {
        size,
        usableDischarge,
        additionalConsumption,
        restGridConsumption,
        restFeedIn,
        grossSavings,
        investment,
        maintenance,
        netBenefit,
        amortization,
        netAdvantage,
        rating,
      };
    });
  }, [storageSizes, inputs]);

  // Find optimal storage size
  const optimalResult = useMemo(() => {
    return results.reduce((best, current) =>
      current.netAdvantage > best.netAdvantage ? current : best
    , results[0] || { netAdvantage: -Infinity });
  }, [results]);

  // Handle input changes
  const handleInputChange = (key: string, value: number | string) => {
    setInputs(prev => ({ ...prev, [key]: value }));
  };

  // Calculate summary values
  const savingsPerKWh = inputs.electricityPrice - inputs.feedInTariff;
  const totalInvestment = optimalResult ? optimalResult.investment : 0;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            PV- & Batteriespeicher-Auslegung – Schnelltool
          </h1>
          <p className="text-gray-600 mt-1">
            Nur gelbe Felder ausfüllen – Ergebnis erscheint automatisch
          </p>
        </header>

        {/* Input Section */}
        <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Eingabefelder</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <InputField
              label="Kunde / Betrieb"
              value={inputs.customer}
              onChange={(v) => handleInputChange('customer', v)}
              unit=""
              hint="Optional"
              type="text"
            />
            <InputField
              label="Strombezug aus Netz"
              value={inputs.gridConsumption}
              onChange={(v) => handleInputChange('gridConsumption', v)}
              unit="kWh/Jahr"
              hint="Jahreswert aus Stromrechnung"
            />
            <InputField
              label="PV-Einspeisung / Überschuss"
              value={inputs.pvSurplus}
              onChange={(v) => handleInputChange('pvSurplus', v)}
              unit="kWh/Jahr"
              hint="PV-Strom, der aktuell eingespeist wird"
            />
            <InputField
              label="Last / Gesamtverbrauch"
              value={inputs.totalConsumption}
              onChange={(v) => handleInputChange('totalConsumption', v)}
              unit="kWh/Jahr"
              hint="Jahresverbrauch des Betriebs"
            />
            <InputField
              label="Strompreis Bezug"
              value={inputs.electricityPrice}
              onChange={(v) => handleInputChange('electricityPrice', v)}
              unit="€/kWh"
              hint="Netto-Arbeitspreis"
              step={0.01}
            />
            <InputField
              label="Einspeisevergütung"
              value={inputs.feedInTariff}
              onChange={(v) => handleInputChange('feedInTariff', v)}
              unit="€/kWh"
              hint="Erlös je eingespeister kWh"
              step={0.01}
            />
            <InputField
              label="Batterie-Wirkungsgrad"
              value={inputs.batteryEfficiency}
              onChange={(v) => handleInputChange('batteryEfficiency', v)}
              unit=""
              hint="z. B. 0.9 für 90%"
              min={0}
              max={1}
              step={0.01}
            />
            <InputField
              label="Vollzyklen pro Jahr"
              value={inputs.fullCycles}
              onChange={(v) => handleInputChange('fullCycles', v)}
              unit="Zyklen"
              hint="Praxiswert Gewerbe"
            />
            <InputField
              label="Speicherkosten variabel"
              value={inputs.variableStorageCost}
              onChange={(v) => handleInputChange('variableStorageCost', v)}
              unit="€/kWh"
              hint="Preis je kWh Speicherkapazität"
            />
            <InputField
              label="Speicherkosten fix"
              value={inputs.fixedStorageCost}
              onChange={(v) => handleInputChange('fixedStorageCost', v)}
              unit="€"
              hint="EMS, Wechselrichter, Montage, Planung"
            />
            <InputField
              label="Betrachtungszeitraum"
              value={inputs.considerationPeriod}
              onChange={(v) => handleInputChange('considerationPeriod', v)}
              unit="Jahre"
              hint="Wirtschaftlichkeitszeitraum"
            />
            <InputField
              label="Wartung / Betrieb"
              value={inputs.maintenanceRate}
              onChange={(v) => handleInputChange('maintenanceRate', v)}
              unit="% Invest/Jahr"
              hint="Laufende Kosten pauschal"
              step={0.001}
            />
            <InputField
              label="Speichergrößen-Schritt"
              value={inputs.storageStep}
              onChange={(v) => handleInputChange('storageStep', v)}
              unit="kWh"
              hint="z. B. 10, 25 oder 50"
            />
            <InputField
              label="Maximale Speichergröße"
              value={inputs.maxStorageSize}
              onChange={(v) => handleInputChange('maxStorageSize', v)}
              unit="kWh"
              hint="Obergrenze der Auswertung"
            />
            <InputField
              label="Grenzwert Amortisation"
              value={inputs.amortizationThreshold}
              onChange={(v) => handleInputChange('amortizationThreshold', v)}
              unit="Jahre"
              hint="Für Ampel-Empfehlung"
            />
          </div>
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>Logik:</strong> Der Speicher wird in Größen-Schritten verglichen. Je Speichergröße wird geschätzt,
              wie viel PV-Überschuss statt Einspeisung selbst genutzt werden kann. Die optimale Größe ist die Variante
              mit dem höchsten Netto-Vorteil im Betrachtungszeitraum.
            </p>
          </div>
        </section>

        {/* Quick Results */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Schnellergebnis</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <ResultCard
              title="Optimale Speichergröße"
              value={optimalResult?.size || 0}
              unit="kWh"
              description="Speichergröße mit höchstem Netto-Vorteil"
            />
            <ResultCard
              title="Netto-Nutzen/Jahr"
              value={optimalResult?.netBenefit || 0}
              unit="€"
              description="Brutto-Ersparnis abzüglich Wartung"
            />
            <ResultCard
              title="Amortisation"
              value={optimalResult?.amortization || 0}
              unit="Jahre"
              description="Investition / jährlicher Netto-Nutzen"
            />
            <ResultCard
              title="Netto-Vorteil Zeitraum"
              value={optimalResult?.netAdvantage || 0}
              unit="€"
              description="Nutzen über Zeitraum minus Investition"
            />
          </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <ResultCard
              title="Genutzter PV-Überschuss"
              value={optimalResult?.additionalConsumption || 0}
              unit="kWh/Jahr"
              description="PV-Überschuss, der durch Speicher selbst genutzt wird"
            />
            <ResultCard
              title="Rest-Netzbezug"
              value={optimalResult?.restGridConsumption || 0}
              unit="kWh/Jahr"
              description="Netzbezug nach Speicherwirkung"
            />
            <ResultCard
              title="Rest-Einspeisung"
              value={optimalResult?.restFeedIn || 0}
              unit="kWh/Jahr"
              description="PV-Überschuss nach Speicherwirkung"
            />
            <ResultCard
              title="Investition Speicher"
              value={totalInvestment}
              unit="€"
              description="Speicherkosten gesamt"
            />
          </div>
          <div className="mt-4">
            <ResultCard
              title="Nutzen je gespeicherter kWh"
              value={savingsPerKWh}
              unit="€/kWh"
              description="Strompreis Bezug minus Einspeisevergütung"
            />
          </div>
        </section>

        {/* Storage Comparison Table */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Speichervergleich</h2>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Speichergröße kWh</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Nutzbare Entladung kWh/Jahr</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Zusätzlicher Eigenverbrauch kWh/Jahr</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Rest-Netzbezug kWh/Jahr</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Rest-Einspeisung kWh/Jahr</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Brutto-Ersparnis €/Jahr</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Investition €</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Wartung €/Jahr</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Netto-Nutzen €/Jahr</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amortisation Jahre</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Netto-Vorteil Zeitraum €</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Bewertung</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {results.map((result) => (
                  <StorageRow
                    key={result.size}
                    size={result.size}
                    data={result}
                    isOptimal={result.size === optimalResult?.size}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Disclaimer */}
        <section className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">Wichtiger Hinweis</h3>
          <p className="text-yellow-700 text-sm">
            Das Tool ist ein Schnellrechner für Erstberatung und Messe. Es ersetzt keine finale Auslegung mit
            15-Minuten-Lastgang, berücksichtigt aber die wichtigsten Einflussgrößen: Netzbezug, PV-Überschuss,
            Strompreis, Einspeisevergütung, Wirkungsgrad, Vollzyklen und Speicherkosten.
          </p>
        </section>
      </div>
    </div>
  );
}