
import React, { useState, useEffect } from 'react';
import { ScenarioParam, ChartDataPoint } from '../types';
import { RefreshCw, TrendingUp, DollarSign, Percent, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line } from 'recharts';

interface PredictiveAnalyticsProps {
  scenarios: ScenarioParam[];
  baseData: ChartDataPoint[];
  themeColor: string;
}

const PredictiveAnalytics: React.FC<PredictiveAnalyticsProps> = ({ scenarios, baseData, themeColor }) => {
  const [params, setParams] = useState<Record<string, number>>({});
  const [projectedData, setProjectedData] = useState<any[]>([]);
  const [impactSummary, setImpactSummary] = useState({ growth: 0, revenue: 0 });
  const [safeScenarios, setSafeScenarios] = useState<ScenarioParam[]>([]);

  useEffect(() => {
    // If AI fails to generate scenarios, provide defaults
    if (!scenarios || scenarios.length === 0) {
        setSafeScenarios([
            { id: 'price', label: 'Price Increase', min: 0, max: 20, defaultValue: 0, step: 1, unit: '%', impactFactor: 1.2 },
            { id: 'volume', label: 'Volume Growth', min: 0, max: 20, defaultValue: 0, step: 1, unit: '%', impactFactor: 1.0 }
        ]);
    } else {
        setSafeScenarios(scenarios);
    }
  }, [scenarios]);

  useEffect(() => {
    // Initialize default values
    const defaults: Record<string, number> = {};
    safeScenarios.forEach(s => defaults[s.id] = s.defaultValue);
    setParams(defaults);
  }, [safeScenarios]);

  useEffect(() => {
    calculateProjection();
  }, [params, baseData]);

  const calculateProjection = () => {
    let totalMultiplier = 1;
    
    // Calculate aggregate impact from all sliders
    safeScenarios.forEach(s => {
       const val = params[s.id] || 0;
       if (val > 0) {
           // Simple simulation logic: value * factor * 0.01 (if percentage)
           const contribution = (val * s.impactFactor) / 100;
           totalMultiplier += contribution;
       }
    });

    // Apply to data
    const projected = baseData.map(d => ({
        name: d.name,
        actual: d.primary,
        projected: Math.round(d.primary * totalMultiplier),
        delta: Math.round((d.primary * totalMultiplier) - d.primary)
    }));

    setProjectedData(projected);

    // Calculate summary metrics
    const totalActual = projected.reduce((sum, item) => sum + item.actual, 0);
    const totalProjected = projected.reduce((sum, item) => sum + item.projected, 0);
    const growth = totalActual > 0 ? ((totalProjected - totalActual) / totalActual) * 100 : 0;

    setImpactSummary({
        growth: parseFloat(growth.toFixed(1)),
        revenue: totalProjected - totalActual
    });
  };

  const handleParamChange = (id: string, value: number) => {
    setParams(prev => ({ ...prev, [id]: value }));
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
      <div className="flex items-center justify-between mb-6">
         <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
             <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                 <Activity size={20} />
             </div>
             What-If Analysis & Simulation
         </h3>
         <div className="flex gap-4">
             <div className="text-right">
                 <div className="text-xs text-gray-500 font-bold uppercase">Proj. Growth</div>
                 <div className={`text-lg font-bold ${impactSummary.growth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                     {impactSummary.growth > 0 ? '+' : ''}{impactSummary.growth}%
                 </div>
             </div>
             <div className="text-right border-l border-gray-200 dark:border-gray-700 pl-4">
                 <div className="text-xs text-gray-500 font-bold uppercase">Rev. Impact</div>
                 <div className="text-lg font-bold text-gray-900 dark:text-white">
                     {impactSummary.revenue > 0 ? '+' : ''}${impactSummary.revenue.toLocaleString()}
                 </div>
             </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Controls */}
        <div className="lg:col-span-4 space-y-6 bg-gray-50 dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <RefreshCw size={14} /> Scenario Variables
            </h4>
            
            {safeScenarios.map(scenario => (
                <div key={scenario.id}>
                    <div className="flex justify-between mb-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">{scenario.label}</label>
                        <span className="text-xs font-bold text-brand-accent bg-brand-accent/10 px-2 py-0.5 rounded">
                            {params[scenario.id]} {scenario.unit}
                        </span>
                    </div>
                    <input 
                        type="range" 
                        min={scenario.min} 
                        max={scenario.max} 
                        step={scenario.step}
                        value={params[scenario.id] || 0}
                        onChange={(e) => handleParamChange(scenario.id, parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-accent"
                    />
                    <div className="flex justify-between mt-1 text-[10px] text-gray-400">
                        <span>{scenario.min}</span>
                        <span>{scenario.max}</span>
                    </div>
                </div>
            ))}

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <button 
                    onClick={() => {
                        const defaults: Record<string, number> = {};
                        safeScenarios.forEach(s => defaults[s.id] = s.defaultValue);
                        setParams(defaults);
                    }}
                    className="text-xs text-gray-500 hover:text-brand-accent flex items-center gap-1 transition-colors"
                >
                    <RefreshCw size={12} /> Reset Simulation
                </button>
            </div>
        </div>

        {/* Chart */}
        <div className="lg:col-span-8 h-[300px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <AreaChart data={projectedData}>
                    <defs>
                        <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorProjected" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={themeColor} stopOpacity={0.5}/>
                            <stop offset="95%" stopColor={themeColor} stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                    <XAxis dataKey="name" fontSize={12} tick={{fill: '#888'}} axisLine={false} tickLine={false} dy={10} />
                    <YAxis fontSize={12} tick={{fill: '#888'}} axisLine={false} tickLine={false} />
                    <Tooltip 
                        contentStyle={{backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: 'white'}}
                        itemStyle={{color: 'white'}}
                    />
                    <Area 
                        type="monotone" 
                        dataKey="actual" 
                        stroke="#94a3b8" 
                        fillOpacity={1} 
                        fill="url(#colorActual)" 
                        name="Baseline"
                    />
                    <Area 
                        type="monotone" 
                        dataKey="projected" 
                        stroke={themeColor} 
                        fillOpacity={1} 
                        fill="url(#colorProjected)" 
                        name="Simulated"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default PredictiveAnalytics;
