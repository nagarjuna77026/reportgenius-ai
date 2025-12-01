

import { ReportData, DrillDownRow } from './types';

export const PIPELINE_STEPS = [
  "Collection",
  "Analysis",
  "Visualization",
  "Report Gen",
  "Delivery"
];

export const DEMO_SALES_REPORT: ReportData = {
  id: "RPT-2024-Q2-001",
  title: "Q2 2024 Comprehensive Sales Performance Review",
  type: "SALES REPORT",
  date: new Date().toLocaleDateString(),
  audience: "Executive Leadership Team (ELT)",
  metrics: [
    { label: "Total Revenue Volume", value: "97,240", trend: 12.5, iconType: "volume" },
    { label: "Avg Deal Size", value: "16,167", trend: 5.2, iconType: "trend" },
    { label: "Peak Monthly Sales", value: "21,450", trend: 8.4, iconType: "growth" },
    { label: "YoY Growth Rate", value: "56%", trend: 15.0, iconType: "chart" }
  ],
  summary: "Q2 2024 has served as a pivotal quarter for the organization, demonstrating exceptional resilience in our core markets despite continuing global economic headwinds. The sales team achieved a remarkable 56% year-over-year growth trend, significantly outperforming the initial fiscal projections of 40%. This surge was primarily driven by the successful launch and rapid adoption of the 'Enterprise Plus' tier, which not only increased our total transaction volume to over 97,000 units but also elevated our Average Deal Size (ADS) by 5.2% to $16,167.\n\nRegionally, the North American sector remains our powerhouse, outperforming targets by 18% due to strategic channel partnerships in the technology and healthcare sectors. Europe (EMEA) has stabilized after a volatile Q1, showing a steady 8% quarter-over-quarter recovery. However, the APAC region continues to present challenges, with adoption rates for new product lines lagging 15% behind global averages, suggesting an urgent need for localized pricing structures and targeted marketing interventions in Q3.\n\nOperational efficiency has also seen a marked improvement. The integration of our new CRM automation tools has reduced the average sales cycle from 45 days to 31 days, a 14-day improvement that has accelerated revenue realization. While customer retention remains strong at 92%, we are closely monitoring a slight uptick in churn within the SMB segment, likely due to aggressive pricing maneuvers by competitors.",
  executiveBrief: {
      cfoView: "Financially, the quarter exceeded expectations with a 12.5% increase in total volume driving top-line revenue. Our Gross Margin improved by 150 basis points due to a shift in mix towards the higher-margin 'Enterprise Plus' product. However, the Customer Acquisition Cost (CAC) in the APAC region remains concerning, currently sitting 20% above our efficient frontier. We must implement stricter spend controls on regional marketing until unit economics improve.",
      croView: "From a revenue perspective, sales velocity is at an all-time high. The 14-day reduction in the sales cycle is a game-changer, allowing representatives to close 2 additional deals per month on average. Our focus for Q3 must be double-down on the North American partnership strategy, which yielded 35% of our Q2 pipeline. We are currently under-penetrated in the Financial Services vertical, representing a $5M opportunity for the next half.",
      cooView: "Operationally, the supply chain for hardware components is stabilizing, but we are not out of the woods. The 'Critical' risk regarding single-source dependencies for our Series-X chips remains a vulnerability. We need to fast-track vendor onboarding for a secondary supplier in Vietnam to mitigate potential Q3 bottlenecks. Additionally, the customer support team is reaching capacity; headcount planning needs to align with the 56% sales growth."
  },
  insights: [
    { text: "The 'Enterprise Plus' tier adoption rate surged by 34% Month-over-Month, validating our upmarket strategy. This shift is responsible for 60% of the quarter's total margin expansion.", source: "SalesForce Data" },
    { text: "Customer retention rates have held steady at an industry-leading 92%, creating a predictable recurring revenue baseline. However, churn in the SMB cohort (<50 employees) ticked up by 2.5%, correlating with competitor discount campaigns.", source: "Churn Analysis" },
    { text: "Sales cycle duration decreased dramatically by 14 days (avg 45 to 31 days). Correlation analysis suggests this is directly linked to the implementation of the new AI-driven lead scoring system in mid-April.", source: "Ops Metrics" },
    { text: "Mobile channel acquisition cost dropped by 12% while conversion improved, indicating that our 'Mobile-First' UX redesign is resonating with decision-makers who approve purchases on the go.", source: "Marketing Analytics" }
  ],
  risks: [
    { id: "r1", description: "Supply chain volatility affecting hardware delivery timelines. Single-source dependency for Series-X chips leaves us vulnerable to geopolitical delays.", impact: "High", priority: "Critical" },
    { id: "r2", description: "Aggressive price undercutting by 'Competitor A' in the SMB segment is eroding market share. We risk losing 10-15% of the low-end market if unaddressed.", impact: "Medium", priority: "Monitor" },
    { id: "r3", description: "Currency fluctuation exposure in EMEA markets (EUR/USD) may impact reported revenue by +/- 3% in Q3 if hedging strategies are not adjusted.", impact: "Low", priority: "Monitor" }
  ],
  recommendations: [
    { title: "Accelerate Enterprise Hiring", description: "Immediately unfreeze headcount for the Enterprise Sales team. Hire 5 Senior Account Executives in Q3 to capitalize on the current 'Enterprise Plus' momentum and handle the increased lead flow.", impact: "High", effort: "Medium" },
    { title: "APAC Localization Strategy", description: "Launch a dedicated 'APAC Recovery' project. This should include localized pricing tiers (approx. 15% discount vs Global) and translated marketing assets to improve regional adoption rates.", impact: "Medium", effort: "High" },
    { title: "Supply Chain Diversification", description: "Mitigate the single-source hardware risk by qualifying and onboarding a secondary supplier for Series-X chips. Target a 70/30 split by Q4 to ensure business continuity.", impact: "High", effort: "High" },
    { title: "SMB Loyalty Program Pilot", description: "Counter competitor discounting by launching a value-add loyalty program for SMBs (e.g., free training, priority support) rather than engaging in a price war.", impact: "Medium", effort: "Low" }
  ],
  outlook: "Heading into Q3 2024, our predictive models project a continuation of the upward growth trend, albeit normalizing to a more sustainable 15% Quarter-over-Quarter rate. The sales pipeline for Q3 is robust, with 40% of forecasted deals already in the 'Negotiation' or 'Commit' phases, providing high visibility into revenue targets.\n\nKey strategic themes for the next period will include: 1) Scaling the Enterprise sales motion to new verticals, 2) Stabilizing APAC performance through localization, and 3) rigorous cost management in marketing to optimize CAC. We anticipate headwinds from currency fluctuations in EMEA but expect tailwinds from the holiday season pre-buying in the retail vertical.",
  marketContext: "The global SaaS market is currently experiencing a consolidation phase, with valuations returning to fundamentals. Competitors are aggressively discounting to retain SMB market share, creating a 'race to the bottom' in pricing. Our 56% growth stands in stark contrast to the industry average of 12% for this quarter, signaling that our value-based differentiation strategy is effective.",
  chartData: [
    { name: 'Jan', primary: 4000, secondary: 2400, amt: 2400 },
    { name: 'Feb', primary: 3000, secondary: 1398, amt: 2210 },
    { name: 'Mar', primary: 2000, secondary: 9800, amt: 2290 },
    { name: 'Apr', primary: 2780, secondary: 3908, amt: 2000 },
    { name: 'May', primary: 1890, secondary: 4800, amt: 2181 },
    { name: 'Jun', primary: 2390, secondary: 3800, amt: 2500 },
  ],
  tableData: [
    { category: "North America", primary: 45000, secondary: 2200, contribution: 85 },
    { category: "Europe (EMEA)", primary: 32000, secondary: 1800, contribution: 65 },
    { category: "Asia Pacific", primary: 15000, secondary: 900, contribution: 40 },
    { category: "Latin America", primary: 5240, secondary: 400, contribution: 25 },
  ],
  scenarios: [
      { id: 'price_increase', label: 'Price Increase', min: 0, max: 20, defaultValue: 0, step: 1, unit: '%', impactFactor: 1.2 },
      { id: 'churn_reduction', label: 'Churn Reduction', min: 0, max: 10, defaultValue: 0, step: 0.5, unit: '%', impactFactor: 1.5 },
      { id: 'market_expansion', label: 'New Market Entry', min: 0, max: 5, defaultValue: 0, step: 1, unit: 'x', impactFactor: 2.0 }
  ],
  forecastData: [
      { name: 'Jul (Est)', value: 2500, lowerBound: 2300, upperBound: 2700 },
      { name: 'Aug (Est)', value: 2800, lowerBound: 2500, upperBound: 3100 },
      { name: 'Sep (Est)', value: 3200, lowerBound: 2800, upperBound: 3600 },
  ],
  strategicMap: [
      { dim: 'Innovation', A: 90, B: 60, fullMark: 100 },
      { dim: 'Efficiency', A: 70, B: 85, fullMark: 100 },
      { dim: 'Scale', A: 88, B: 75, fullMark: 100 },
      { dim: 'Cust Sat', A: 92, B: 80, fullMark: 100 },
      { dim: 'Speed', A: 65, B: 70, fullMark: 100 },
      { dim: 'Quality', A: 85, B: 85, fullMark: 100 },
  ],
  competitors: [
      { name: 'Our Company', marketShare: 35, growth: 56, sentiment: 88 },
      { name: 'Competitor A', marketShare: 25, growth: 12, sentiment: 65 },
      { name: 'Competitor B', marketShare: 20, growth: -5, sentiment: 70 },
      { name: 'Others', marketShare: 20, growth: 5, sentiment: 50 },
  ],
  dataQuality: {
      score: 94,
      lastUpdated: new Date().toLocaleTimeString(),
      sourceIntegrity: 'High',
      issuesFound: 0
  },
  versions: [
      { id: 'v1.2', date: new Date(Date.now() - 86400000).toISOString(), author: 'AI Agent', changes: 'Updated Q2 forecast based on new market data' },
      { id: 'v1.1', date: new Date(Date.now() - 172800000).toISOString(), author: 'John Doe', changes: 'Manual adjustment of risk factors' },
      { id: 'v1.0', date: new Date(Date.now() - 259200000).toISOString(), author: 'System', changes: 'Initial generation' }
  ]
};

export const MOCK_DRILLDOWN_DATA: DrillDownRow[] = [
    { id: "TXN-8832", date: "2024-05-12", entity: "Acme Corp", detail: "Enterprise License Renewal", amount: 12500, status: "Completed" },
    { id: "TXN-8833", date: "2024-05-14", entity: "Globex Inc", detail: "Consulting Services - Phase 1", amount: 8400, status: "Completed" },
    { id: "TXN-8834", date: "2024-05-15", entity: "Soylent Corp", detail: "Hardware Bulk Order", amount: 45000, status: "Pending" },
    { id: "TXN-8835", date: "2024-05-18", entity: "Initech", detail: "Software Subscription", amount: 2300, status: "Completed" },
    { id: "TXN-8836", date: "2024-05-20", entity: "Umbrella Corp", detail: "Security Audit", amount: 15000, status: "Completed" },
    { id: "TXN-8837", date: "2024-05-22", entity: "Stark Ind", detail: "R&D Partnership", amount: 150000, status: "Pending" },
    { id: "TXN-8838", date: "2024-05-25", entity: "Wayne Ent", detail: "Infrastructure Upgrade", amount: 92000, status: "Failed" },
    { id: "TXN-8839", date: "2024-05-28", entity: "Cyberdyne", detail: "AI Module Implementation", amount: 67000, status: "Completed" },
];