import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  LineChart,
  BarChart3,
  PieChart,
  Filter,
  Download,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  DollarSign,
  Activity,
} from "lucide-react";

const DataInsightsDashboard = () => {
  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-50">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-slate-800 bg-slate-950/80 backdrop-blur-xl">
        <div className="px-6 py-5 flex items-center gap-3 border-b border-slate-800">
          <div className="h-9 w-9 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center font-bold text-slate-950 text-xl">
            DI
          </div>
          <div>
            <div className="font-semibold tracking-tight">Data Insights</div>
            <div className="text-xs text-slate-400">Client analytics workspace</div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 text-sm">
          <SidebarItem label="Overview" icon={<LineChart className="h-4 w-4" />} active />
          <SidebarItem label="Revenue" icon={<DollarSign className="h-4 w-4" />} />
          <SidebarItem label="Customers" icon={<Users className="h-4 w-4" />} />
          <SidebarItem label="Operations" icon={<Activity className="h-4 w-4" />} />
          <SidebarItem label="Reports" icon={<BarChart3 className="h-4 w-4" />} />
        </nav>

        <div className="px-4 pb-5 pt-2 border-t border-slate-800 text-xs text-slate-400 space-y-2">
          <div className="flex items-center justify-between">
            <span>Workspace usage</span>
            <span className="text-slate-300 font-medium">68%</span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-800">
            <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500" />
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span>10 of 15 report slots used</span>
            <Button variant="ghost" size="sm" className="h-6 px-2 text-[11px] text-cyan-300">
              Upgrade
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col">
        {/* Top bar */}
        <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-lg md:text-xl font-semibold tracking-tight">
                  Client Insights Overview
                </h1>
                <Badge className="bg-emerald-500/10 text-emerald-300 border-emerald-500/40">
                  Live
                </Badge>
              </div>
              <p className="text-xs md:text-sm text-slate-400 max-w-xl">
                Generate on-demand business analysis reports across revenue, customers, and operations for any client.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" className="border-slate-700 bg-slate-900/60 text-slate-100 text-xs md:text-sm h-9">
                <Filter className="h-4 w-4 mr-2" />
                Save filter set
              </Button>
              <Button
                className="bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-semibold text-xs md:text-sm h-9 shadow-lg shadow-cyan-500/25 hover:from-cyan-300 hover:to-blue-400"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Generate report
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="border-t border-slate-800 bg-slate-950/80">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-1 flex-wrap gap-2 items-center">
                <Select defaultValue="all-clients">
                  <SelectTrigger className="w-[170px] h-9 text-xs md:text-sm bg-slate-900/80 border-slate-700">
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-clients">All clients</SelectItem>
                    <SelectItem value="acme">Acme Corp</SelectItem>
                    <SelectItem value="globex">Globex Industries</SelectItem>
                    <SelectItem value="umbrella">Umbrella Health</SelectItem>
                  </SelectContent>
                </Select>

                <Select defaultValue="quarter">
                  <SelectTrigger className="w-[150px] h-9 text-xs md:text-sm bg-slate-900/80 border-slate-700">
                    <SelectValue placeholder="Date range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="month">Last 30 days</SelectItem>
                    <SelectItem value="quarter">Last quarter</SelectItem>
                    <SelectItem value="year">Last 12 months</SelectItem>
                    <SelectItem value="custom">Custom range</SelectItem>
                  </SelectContent>
                </Select>

                <Select defaultValue="revenue">
                  <SelectTrigger className="w-[180px] h-9 text-xs md:text-sm bg-slate-900/80 border-slate-700">
                    <SelectValue placeholder="Primary focus" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="revenue">Revenue & margin</SelectItem>
                    <SelectItem value="customers">Customer behavior</SelectItem>
                    <SelectItem value="operations">Operations & SLA</SelectItem>
                    <SelectItem value="finance">Cash flow & risk</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  placeholder="Search by segment, region, SKU..."
                  className="flex-1 min-w-[180px] h-9 text-xs md:text-sm bg-slate-900/80 border-slate-700"
                />
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  className="h-9 px-3 border-slate-700 bg-slate-900/80 text-xs md:text-sm text-slate-200"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Content area */}
        <div className="flex-1 bg-gradient-to-b from-slate-950 via-slate-950 to-slate-950/95">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
            <Tabs defaultValue="summary" className="space-y-4">
              <TabsList className="bg-slate-900/80 border border-slate-800">
                <TabsTrigger value="summary" className="data-[state=active]:bg-slate-800 data-[state=active]:text-slate-100">
                  Executive summary
                </TabsTrigger>
                <TabsTrigger value="revenue" className="data-[state=active]:bg-slate-800 data-[state=active]:text-slate-100">
                  Revenue & margin
                </TabsTrigger>
                <TabsTrigger value="customers" className="data-[state=active]:bg-slate-800 data-[state=active]:text-slate-100">
                  Customers
                </TabsTrigger>
                <TabsTrigger value="operations" className="data-[state=active]:bg-slate-800 data-[state=active]:text-slate-100">
                  Operations
                </TabsTrigger>
              </TabsList>

              <TabsContent value="summary" className="space-y-4">
                {/* KPI cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                  <KpiCard
                    label="Total revenue"
                    value="$4.2M"
                    delta="12.4% vs last period"
                    positive
                  />
                  <KpiCard
                    label="Gross margin"
                    value="38.6%"
                    delta="+2.1 pts"
                    positive
                  />
                  <KpiCard
                    label="Active clients"
                    value="128"
                    delta="+9 new onboarded"
                    icon={<Users className="h-4 w-4 text-slate-400" />}
                  />
                  <KpiCard
                    label="At-risk revenue"
                    value="$310K"
                    delta="-6.3% vs last period"
                    positive={false}
                  />
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mt-2">
                  {/* Chart area */}
                  <Card className="col-span-2 bg-slate-950/80 border-slate-800">
                    <CardHeader className="flex flex-row items-center justify-between pb-3">
                      <div>
                        <CardTitle className="text-sm font-medium text-slate-100">
                          Revenue & margin trend
                        </CardTitle>
                        <p className="text-xs text-slate-400 mt-1">
                          Monthly revenue, gross margin, and key events impacting performance.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <span className="inline-block h-2 w-2 rounded-full bg-slate-50" />
                          Revenue
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="inline-block h-2 w-2 rounded-full bg-cyan-400" />
                          Margin
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="h-[260px] rounded-xl border border-dashed border-slate-800 bg-slate-950/80 flex flex-col items-center justify-center text-center text-xs text-slate-500">
                        <LineChart className="h-8 w-8 mb-2 text-slate-600" />
                        <p className="font-medium text-slate-300 mb-1">Chart placeholder</p>
                        <p className="max-w-sm text-xs text-slate-500">
                          Plug in your chart component here (Recharts, ECharts, or any preferred library) using the API data
                          from your backend.
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Insight snippets */}
                  <Card className="bg-slate-950/80 border-slate-800">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-slate-100 flex items-center gap-2">
                        AI-generated insights
                        <Sparkles className="h-4 w-4 text-cyan-300" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[260px] pr-2">
                        <ul className="space-y-3 text-xs text-slate-300">
                          <InsightItem
                            title="Revenue concentration risk"
                            body="Top 3 enterprise clients contribute 56% of total revenue; consider diversification or multi-year contracts."
                          />
                          <InsightItem
                            title="Margin leakage in discounts"
                            body="Average discount in the SMB segment increased from 8% to 13% while win rate remained flat." 
                          />
                          <InsightItem
                            title="Churn early warning"
                            body="12 clients show a >30% drop in usage over the last 90 days with open support tickets." 
                          />
                          <InsightItem
                            title="Upsell opportunities"
                            body="Analytics add-on has 21% attach rate among mid-market clients vs 47% among enterprise clients." 
                          />
                        </ul>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </div>

                {/* Table + secondary charts */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mt-4">
                  <Card className="xl:col-span-2 bg-slate-950/80 border-slate-800">
                    <CardHeader className="pb-3 flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="text-sm font-medium text-slate-100">
                          Segment performance snapshot
                        </CardTitle>
                        <p className="text-xs text-slate-400 mt-1">Top segments ranked by revenue and margin.</p>
                      </div>
                      <Button variant="outline" size="sm" className="h-7 text-[11px] border-slate-700 bg-slate-900/80">
                        Download CSV
                      </Button>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-950/80">
                        <div className="grid grid-cols-5 text-[11px] uppercase tracking-wide text-slate-400 bg-slate-950/90 border-b border-slate-800">
                          <div className="px-3 py-2 text-left">Segment</div>
                          <div className="px-3 py-2 text-right">Revenue</div>
                          <div className="px-3 py-2 text-right">Margin</div>
                          <div className="px-3 py-2 text-right">YoY growth</div>
                          <div className="px-3 py-2 text-right">Clients</div>
                        </div>
                        {[
                          {
                            segment: "Enterprise SaaS",
                            revenue: "$1.9M",
                            margin: "44%",
                            growth: "+18%",
                            clients: "24",
                            positive: true,
                          },
                          {
                            segment: "Mid-market retail",
                            revenue: "$980K",
                            margin: "33%",
                            growth: "+9%",
                            clients: "62",
                            positive: true,
                          },
                          {
                            segment: "SMB services",
                            revenue: "$620K",
                            margin: "28%",
                            growth: "-4%",
                            clients: "41",
                            positive: false,
                          },
                          {
                            segment: "Public sector",
                            revenue: "$410K",
                            margin: "39%",
                            growth: "+3%",
                            clients: "7",
                            positive: true,
                          },
                        ].map((row) => (
                          <div
                            key={row.segment}
                            className="grid grid-cols-5 text-xs border-t border-slate-900/60 hover:bg-slate-900/60"
                          >
                            <div className="px-3 py-2.5 text-left text-slate-100">{row.segment}</div>
                            <div className="px-3 py-2.5 text-right text-slate-200">{row.revenue}</div>
                            <div className="px-3 py-2.5 text-right text-slate-200">{row.margin}</div>
                            <div
                              className={`px-3 py-2.5 text-right font-medium flex items-center justify-end gap-1 ${
                                row.positive ? "text-emerald-400" : "text-rose-400"
                              }`}
                            >
                              {row.positive ? (
                                <ArrowUpRight className="h-3 w-3" />
                              ) : (
                                <ArrowDownRight className="h-3 w-3" />
                              )}
                              {row.growth}
                            </div>
                            <div className="px-3 py-2.5 text-right text-slate-300">{row.clients}</div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-slate-950/80 border-slate-800">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-slate-100 flex items-center gap-2">
                        Mix & risk overview
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="h-[120px] rounded-xl border border-dashed border-slate-800 bg-slate-950/80 flex flex-col items-center justify-center text-center text-xs text-slate-500 mb-2">
                        <PieChart className="h-8 w-8 mb-2 text-slate-600" />
                        <p className="font-medium text-slate-300 mb-1">Client mix placeholder</p>
                        <p className="max-w-xs text-xs text-slate-500">
                          Use this area for a mix chart (by region, segment, or product) to show concentration.
                        </p>
                      </div>

                      <div className="space-y-2 text-xs">
                        <InsightChip label="Enterprise" value="46% of revenue" />
                        <InsightChip label="Top region" value="North America (61% share)" />
                        <InsightChip label="Churn risk" value="7 clients >40% usage drop" negative />
                        <InsightChip label="Upsell pool" value="31 clients eligible for premium tier" positive />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Other tabs can reuse or specialize components later */}
              <TabsContent value="revenue" className="space-y-4">
                <PlaceholderPanel
                  icon={<BarChart3 className="h-6 w-6" />}
                  title="Revenue & margin workspace"
                  body="Drill into product, region, and sales channel performance. You can reuse the components from the summary tab and add more granular filters here."
                />
              </TabsContent>

              <TabsContent value="customers" className="space-y-4">
                <PlaceholderPanel
                  icon={<Users className="h-6 w-6" />}
                  title="Customer analytics workspace"
                  body="Segment customers by lifecycle stage, contract value, product usage, and satisfaction to generate retention and expansion reports."
                />
              </TabsContent>

              <TabsContent value="operations" className="space-y-4">
                <PlaceholderPanel
                  icon={<Activity className="h-6 w-6" />}
                  title="Operations & SLAs workspace"
                  body="Monitor ticket volumes, response times, and service-level adherence. Connect your operations data sources to bring this view to life."
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
};

interface SidebarItemProps {
  label: string;
  icon?: React.ReactNode;
  active?: boolean;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ label, icon, active }) => (
  <button
    className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium transition ${
      active
        ? "bg-slate-800 text-slate-50 shadow-sm"
        : "text-slate-300 hover:bg-slate-900 hover:text-slate-50"
    }`}
  >
    {icon && <span>{icon}</span>}
    <span>{label}</span>
  </button>
);

interface KpiCardProps {
  label: string;
  value: string;
  delta: string;
  positive?: boolean;
  icon?: React.ReactNode;
}

const KpiCard: React.FC<KpiCardProps> = ({ label, value, delta, positive = true, icon }) => (
  <Card className="bg-slate-950/80 border-slate-800">
    <CardHeader className="pb-2 flex flex-row items-center justify-between">
      <div className="space-y-0.5">
        <p className="text-[11px] uppercase tracking-wide text-slate-400">{label}</p>
        <div className="flex items-baseline gap-2">
          <p className="text-lg font-semibold text-slate-50">{value}</p>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
              positive
                ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/40"
                : "bg-rose-500/10 text-rose-300 border border-rose-500/40"
            }`}
          >
            {positive ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
            {delta}
          </span>
        </div>
      </div>
      {icon && <div className="text-slate-500">{icon}</div>}
    </CardHeader>
    <CardContent className="pt-0 text-[11px] text-slate-500">
      Auto-updated from your latest data sync.
    </CardContent>
  </Card>
);

interface InsightItemProps {
  title: string;
  body: string;
}

const InsightItem: React.FC<InsightItemProps> = ({ title, body }) => (
  <li className="rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2">
    <p className="text-[11px] font-semibold text-slate-100 mb-1">{title}</p>
    <p className="text-[11px] text-slate-400 leading-snug">{body}</p>
  </li>
);

interface InsightChipProps {
  label: string;
  value: string;
  positive?: boolean;
  negative?: boolean;
}

const InsightChip: React.FC<InsightChipProps> = ({ label, value, positive, negative }) => (
  <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2">
    <span className="text-slate-400 text-[11px]">{label}</span>
    <span
      className={`text-[11px] font-medium ${
        positive ? "text-emerald-300" : negative ? "text-rose-300" : "text-slate-200"
      }`}
    >
      {value}
    </span>
  </div>
);

interface PlaceholderPanelProps {
  icon: React.ReactNode;
  title: string;
  body: string;
}

const PlaceholderPanel: React.FC<PlaceholderPanelProps> = ({ icon, title, body }) => (
  <Card className="bg-slate-950/80 border-slate-800">
    <CardHeader className="pb-2">
      <CardTitle className="flex items-center gap-2 text-sm text-slate-100">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
          {icon}
        </span>
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-xs text-slate-400 max-w-2xl">
        {body}
      </p>
      <div className="mt-3 inline-flex items-center gap-1 rounded-full border border-slate-800 bg-slate-900/80 px-3 py-1 text-[11px] text-slate-400">
        <Sparkles className="h-3 w-3" />
        Tip: Duplicate this layout and plug in more specific charts, filters, and tables for this workspace.
      </div>
    </CardContent>
  </Card>
);

export default DataInsightsDashboard;
