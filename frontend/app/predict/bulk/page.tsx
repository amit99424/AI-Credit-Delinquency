"use client";

import { ChangeEvent, useState } from "react";
import Papa from "papaparse";

import DashboardLayout from "../../../components/DashboardLayout";
import { createBulkPredictions } from "../../../services/api";

type CSVCustomer = Record<string, string | number>;

type PredictionResult = {
  customer_id: number;
  customer_name?: string;
  customer_email?: string;
  default_probability: number;
  risk_level: string;
  prediction: string;
};

type Summary = {
  total_customers: number;
  low_risk: number;
  medium_risk: number;
  high_risk: number;
  likely_to_default: number;
  unlikely_to_default: number;
};

export default function BulkPredictionPage() {
  const [customers, setCustomers] = useState<CSVCustomer[]>([]);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");
  const [results, setResults] = useState<PredictionResult[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);

  /*
  ==========================================
  Handle CSV Upload
  ==========================================
  */

  const handleCSVUpload = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setError("");
    setResults([]);
    setSummary(null);
    setCustomers([]);
    setFileName("");

    // Validate CSV file
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("Please upload a valid CSV file.");
      return;
    }

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,

      complete: (result) => {
        const rows = result.data;

        // Empty CSV
        if (rows.length === 0) {
          setError(
            "CSV file contains no customer data."
          );
          return;
        }

        // Maximum 500 customers
        if (rows.length > 500) {
          setError(
            `CSV contains ${rows.length} customers. Maximum 500 customers are allowed.`
          );
          return;
        }

        try {
          const parsedCustomers: CSVCustomer[] =
            rows.map((row, index) => {
              const customer: CSVCustomer = {};

              Object.entries(row).forEach(
                ([key, value]) => {
                  const cleanKey = key.trim();
                  const cleanValue =
                    String(value).trim();

                  // Ignore empty fields
                  if (cleanValue === "") {
                    return;
                  }

                  // Keep name and email as strings
                  if (
                    cleanKey === "name" ||
                    cleanKey === "email"
                  ) {
                    customer[cleanKey] =
                      cleanValue;

                    return;
                  }

                  // Convert ML features to numbers
                  const numericValue =
                    Number(cleanValue);

                  if (
                    Number.isNaN(numericValue)
                  ) {
                    throw new Error(
                      `Invalid value "${cleanValue}" in row ${
                        index + 2
                      }, column "${cleanKey}".`
                    );
                  }

                  customer[cleanKey] =
                    numericValue;
                }
              );

              // Validate customer name
              if (!customer.name) {
                throw new Error(
                  `Missing name in row ${
                    index + 2
                  }.`
                );
              }

              // Validate customer email
              if (!customer.email) {
                throw new Error(
                  `Missing email in row ${
                    index + 2
                  }.`
                );
              }

              return customer;
            });

          setCustomers(parsedCustomers);
          setFileName(file.name);

        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to read CSV file."
          );
        }
      },

      error: () => {
        setError(
          "Failed to parse CSV file."
        );
      },
    });
  };

  /*
  ==========================================
  Run Bulk Prediction
  ==========================================
  */

  const handleBulkPrediction = async () => {
    if (customers.length === 0) {
      setError(
        "Please upload a CSV file first."
      );
      return;
    }

    setLoading(true);
    setError("");
    setResults([]);
    setSummary(null);

    try {
      const response =
        await createBulkPredictions(
          customers
        );

      setResults(response.results);
      setSummary(response.summary);

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Bulk prediction failed."
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>

      {/* ======================================
          Page Header
      ====================================== */}

      <div className="mb-8">

        <h1 className="text-3xl font-bold text-slate-900">
          Bulk Credit Risk Prediction
        </h1>

        <p className="mt-2 text-slate-500">
          Upload a CSV file and analyze up to
          500 customers at once.
        </p>

      </div>


      {/* ======================================
          CSV Upload Card
      ====================================== */}

      <div className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

        <div className="mb-5">

          <h2 className="text-xl font-semibold text-slate-900">
            Upload Customer CSV
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            CSV must contain customer name,
            email and all required credit risk
            features.
          </p>

        </div>


        {/* Upload Controls */}

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">

          <input
            type="file"
            accept=".csv"
            onChange={handleCSVUpload}
            className="
              block
              w-full
              max-w-xl
              rounded-lg
              border
              border-slate-300
              bg-white
              p-2
              text-sm
              text-slate-600

              file:mr-4
              file:rounded-md
              file:border-0
              file:bg-blue-50
              file:px-4
              file:py-2
              file:text-sm
              file:font-medium
              file:text-blue-700

              hover:file:bg-blue-100
            "
          />

          <button
            onClick={
              handleBulkPrediction
            }
            disabled={
              loading ||
              customers.length === 0
            }
            className="
              rounded-lg
              bg-blue-600
              px-6
              py-3
              text-sm
              font-medium
              text-white
              transition

              hover:bg-blue-700

              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >

            {loading
              ? `Processing ${customers.length} Customers...`
              : "Predict All Customers"}

          </button>

        </div>


        {/* ======================================
            CSV Loaded Message
        ====================================== */}

        {customers.length > 0 && (

          <div className="mt-5 rounded-lg border border-green-200 bg-green-50 p-4">

            <p className="font-medium text-green-700">
              CSV loaded successfully
            </p>

            <div className="mt-2 space-y-1 text-sm text-slate-600">

              <p>
                File:{" "}
                <span className="font-medium text-slate-900">
                  {fileName}
                </span>
              </p>

              <p>
                Customers found:{" "}

                <span className="font-semibold text-slate-900">
                  {customers.length}
                </span>

                {" "}/ 500
              </p>

            </div>

          </div>

        )}


        {/* ======================================
            Error Message
        ====================================== */}

        {error && (

          <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4">

            <p className="text-sm font-medium text-red-600">
              {error}
            </p>

          </div>

        )}

      </div>


      {/* ======================================
          Prediction Summary
      ====================================== */}

      {summary && (

        <div className="mb-8">

          <h2 className="mb-4 text-xl font-semibold text-slate-900">
            Prediction Summary
          </h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">

            <SummaryCard
              title="Total Customers"
              value={
                summary.total_customers
              }
            />

            <SummaryCard
              title="Low Risk"
              value={
                summary.low_risk
              }
            />

            <SummaryCard
              title="Medium Risk"
              value={
                summary.medium_risk
              }
            />

            <SummaryCard
              title="High Risk"
              value={
                summary.high_risk
              }
            />

            <SummaryCard
              title="Likely Default"
              value={
                summary.likely_to_default
              }
            />

            <SummaryCard
              title="Unlikely Default"
              value={
                summary.unlikely_to_default
              }
            />

          </div>

        </div>

      )}


      {/* ======================================
          Prediction Results
      ====================================== */}

      {results.length > 0 && (

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

          {/* Table Header */}

          <div className="border-b border-slate-200 p-6">

            <h2 className="text-xl font-semibold text-slate-900">
              Prediction Results
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Showing {results.length} customer
              predictions
            </p>

          </div>


          {/* Table */}

          <div className="max-h-150 overflow-auto">

            <table className="w-full text-left">

              <thead className="sticky top-0 bg-slate-50">

                <tr className="border-b border-slate-200">

                  <th className="px-6 py-4 text-sm font-medium text-slate-500">
                    Customer ID
                  </th>

                  <th className="px-6 py-4 text-sm font-medium text-slate-500">
                    Name
                  </th>

                  <th className="px-6 py-4 text-sm font-medium text-slate-500">
                    Email
                  </th>

                  <th className="px-6 py-4 text-sm font-medium text-slate-500">
                    Default Probability
                  </th>

                  <th className="px-6 py-4 text-sm font-medium text-slate-500">
                    Risk Level
                  </th>

                  <th className="px-6 py-4 text-sm font-medium text-slate-500">
                    Prediction
                  </th>

                </tr>

              </thead>


              <tbody>

                {results.map(
                  (result, index) => (

                    <tr
                      key={`${result.customer_id}-${index}`}
                      className="border-b border-slate-100 text-sm hover:bg-slate-50"
                    >

                      <td className="px-6 py-4 text-slate-500">
                        #{result.customer_id}
                      </td>


                      <td className="px-6 py-4 font-medium text-slate-900">

                        {result.customer_name ||
                          "-"}

                      </td>


                      <td className="px-6 py-4 text-slate-600">

                        {result.customer_email ||
                          "-"}

                      </td>


                      <td className="px-6 py-4 font-medium text-slate-900">

                        {
                          result.default_probability
                        }
                        %

                      </td>


                      <td className="px-6 py-4">

                        <RiskBadge
                          risk={
                            result.risk_level
                          }
                        />

                      </td>


                      <td className="px-6 py-4 text-slate-600">

                        {result.prediction}

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        </div>

      )}

    </DashboardLayout>
  );
}


/*
==========================================
Summary Card
==========================================
*/

function SummaryCard({
  title,
  value,
}: {
  title: string;
  value: number;
}) {

  return (

    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

      <p className="text-sm text-slate-500">
        {title}
      </p>

      <p className="mt-2 text-2xl font-bold text-slate-900">
        {value}
      </p>

    </div>

  );
}


/*
==========================================
Risk Badge
==========================================
*/

function RiskBadge({
  risk,
}: {
  risk: string;
}) {

  let styles =
    "bg-green-100 text-green-700";

  if (risk === "MEDIUM RISK") {

    styles =
      "bg-yellow-100 text-yellow-700";

  }

  if (risk === "HIGH RISK") {

    styles =
      "bg-red-100 text-red-700";

  }

  return (

    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${styles}`}
    >
      {risk}
    </span>

  );
}