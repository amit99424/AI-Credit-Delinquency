"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "../components/DashboardLayout";
import StatCard from "../components/StatCard";
import { getCustomers, getPredictions } from "../services/api";
import {
  Users,
  BrainCircuit,
  TriangleAlert,
  Gauge,
} from "lucide-react";

type Prediction = {
  prediction_id: number;
  customer_id: number;
  customer_name: string;
  customer_email: string;
  default_probability: number;
  risk_level: string;
  prediction: string;
  created_at: string;
};

export default function Home() {
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [customerData, predictionData] = await Promise.all([
          getCustomers(),
          getPredictions(),
        ]);

        setTotalCustomers(customerData.total_customers);
        setPredictions(predictionData.predictions);
      } catch (error) {
        console.error("Dashboard error:", error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const highRisk = predictions.filter(
    (item) => item.risk_level === "HIGH RISK"
  ).length;

  const averageProbability =
    predictions.length > 0
      ? (
        predictions.reduce(
          (sum, item) => sum + item.default_probability,
          0
        ) / predictions.length
      ).toFixed(1)
      : "0";

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Credit Risk Dashboard
          </h1>

          <p className="mt-2 text-slate-500">
            Monitor customers and AI delinquency risk predictions.
          </p>
        </div>

        <a
          href="/predict"
          className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          + New Prediction
        </a>
      </div>

      {loading ? (
        <p className="text-slate-500">Loading dashboard...</p>
      ) : (
        <>
          {/* Statistics */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Total Customers"
              value={totalCustomers}
              subtitle="Customers in database"
              icon={Users}
            />

            <StatCard
              title="Total Predictions"
              value={predictions.length}
              subtitle="AI risk assessments"
              icon={BrainCircuit}
            />

            <StatCard
              title="High Risk"
              value={highRisk}
              subtitle="Customers requiring attention"
              icon={TriangleAlert}
            />

            <StatCard
              title="Average Default Risk"
              value={`${averageProbability}%`}
              subtitle="Across all predictions"
              icon={Gauge}
            />
          </div>

          {/* Recent Predictions */}
          <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-slate-900">
                Recent Predictions
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Latest AI credit delinquency assessments
              </p>
            </div>

            {predictions.length === 0 ? (
              <p className="text-slate-500">
                No predictions available.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-200 text-sm text-slate-500">
                      <th className="pb-3">Customer</th>
                      <th className="pb-3">Email</th>
                      <th className="pb-3">Probability</th>
                      <th className="pb-3">Risk Level</th>
                      <th className="pb-3">Prediction</th>
                    </tr>
                  </thead>

                  <tbody>
                    {predictions.slice(0, 5).map((item) => (
                      <tr
                        key={item.prediction_id}
                        className="border-b border-slate-100 text-sm"
                      >
                        <td className="py-4 font-medium text-slate-900">
                          {item.customer_name}
                        </td>

                        <td className="py-4 text-slate-600">
                          {item.customer_email}
                        </td>

                        <td className="py-4 text-slate-600">
                          {item.default_probability}%
                        </td>

                        <td className="py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium ${item.risk_level === "HIGH RISK"
                                ? "bg-red-100 text-red-700"
                                : item.risk_level === "MEDIUM RISK"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-green-100 text-green-700"
                              }`}
                          >
                            {item.risk_level}
                          </span>
                        </td>

                        <td className="py-4 text-slate-600">
                          {item.prediction}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </DashboardLayout>
  );
}