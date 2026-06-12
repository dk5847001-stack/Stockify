import { AlertTriangle, IndianRupee, PackageCheck, ReceiptText } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import StatCard from "../components/common/StatCard.jsx";

const salesData = [
  { day: "Mon", sales: 18400, stock: 240 },
  { day: "Tue", sales: 22800, stock: 222 },
  { day: "Wed", sales: 31200, stock: 214 },
  { day: "Thu", sales: 27600, stock: 196 },
  { day: "Fri", sales: 38900, stock: 188 },
  { day: "Sat", sales: 45200, stock: 172 },
  { day: "Sun", sales: 41700, stock: 168 }
];

const Dashboard = () => {
  return (
    <div className="dashboard-page">
      <section className="row g-3">
        <div className="col-12 col-md-6 col-xl-3">
          <StatCard
            title="Today's Sales"
            value="₹45,200"
            delta="+12.4% from yesterday"
            icon={IndianRupee}
            tone="green"
          />
        </div>
        <div className="col-12 col-md-6 col-xl-3">
          <StatCard
            title="Total Products"
            value="1,248"
            delta="86 categories active"
            icon={PackageCheck}
            tone="blue"
          />
        </div>
        <div className="col-12 col-md-6 col-xl-3">
          <StatCard
            title="Bills Generated"
            value="312"
            delta="Live counter ready"
            icon={ReceiptText}
            tone="violet"
          />
        </div>
        <div className="col-12 col-md-6 col-xl-3">
          <StatCard
            title="Low Stock Alerts"
            value="18"
            delta="Needs restock soon"
            icon={AlertTriangle}
            tone="amber"
          />
        </div>
      </section>

      <section className="row g-3 mt-1">
        <div className="col-12 col-xl-8">
          <div className="panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow mb-1">Weekly Performance</p>
                <h2>Sales Flow</h2>
              </div>
              <span className="status-chip">Live Ready</span>
            </div>
            <div className="chart-box">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0f766e" stopOpacity={0.34} />
                      <stop offset="95%" stopColor="#0f766e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip formatter={(value) => `₹${value.toLocaleString("en-IN")}`} />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    stroke="#0f766e"
                    strokeWidth={3}
                    fill="url(#salesGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-4">
          <div className="panel h-100">
            <div className="panel-heading">
              <div>
                <p className="eyebrow mb-1">Priority Queue</p>
                <h2>Operations</h2>
              </div>
            </div>
            <div className="task-list">
              <div>
                <strong>Restock dairy section</strong>
                <span>8 items below reorder level</span>
              </div>
              <div>
                <strong>Sync today's bills</strong>
                <span>POS counters ready for API integration</span>
              </div>
              <div>
                <strong>Review cashier access</strong>
                <span>Role-based auth scaffold enabled</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
