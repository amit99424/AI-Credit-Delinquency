"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { getPredictions } from "../../services/api";

type Prediction = {
  prediction_id: number;
  customer_id: number;
  customer_name: string;
  customer_email: string;
  default_probability: number;
  risk_level: string;
  prediction: string;
  created_at: string | null;
};

export default function PredictionsPage() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  const [totalPages, setTotalPages] = useState(1);

  const [totalPredictions, setTotalPredictions] = useState(0);

  const limit = 50;

  /*
  ==========================================
  Load Predictions
  ==========================================
  */

  useEffect(() => {
    async function loadPredictions() {
      try {
        setLoading(true);
        setError("");

        // Fetch only current page
        const data = await getPredictions(
          currentPage,
          limit
        );

        setPredictions(
          data.predictions || []
        );

        setTotalPages(
          data.total_pages || 1
        );

        setTotalPredictions(
          data.total_predictions || 0
        );

      } catch (err) {
        console.error(
          "Failed to load predictions:",
          err
        );

        setError(
          "Failed to load prediction history."
        );

      } finally {
        setLoading(false);
      }
    }

    loadPredictions();

  }, [currentPage]);


  /*
  ==========================================
  Risk Badge Style
  ==========================================
  */

  function getRiskStyle(
    riskLevel: string
  ) {
    if (riskLevel === "HIGH RISK") {
      return "bg-red-100 text-red-700";
    }

    if (riskLevel === "MEDIUM RISK") {
      return "bg-yellow-100 text-yellow-700";
    }

    return "bg-green-100 text-green-700";
  }


  /*
  ==========================================
  Previous Page
  ==========================================
  */

  function handlePrevious() {
    if (currentPage > 1) {
      setCurrentPage(
        currentPage - 1
      );
    }
  }


  /*
  ==========================================
  Next Page
  ==========================================
  */

  function handleNext() {
    if (currentPage < totalPages) {
      setCurrentPage(
        currentPage + 1
      );
    }
  }


  /*
  ==========================================
  Change Page
  ==========================================
  */

  function handlePageChange(
    page: number
  ) {
    setCurrentPage(page);
  }


  return (
    <DashboardLayout>

      {/* ======================================
          Header
      ====================================== */}

      <div className="mb-8">

        <h1 className="text-3xl font-bold text-slate-900">
          Prediction History
        </h1>

        <p className="mt-2 text-slate-500">
          View all AI credit delinquency risk
          assessments.
        </p>

      </div>


      {/* ======================================
          Prediction History Card
      ====================================== */}

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

        {/* Card Header */}

        <div className="mb-6 flex items-center justify-between">

          <div>

            <h2 className="text-xl font-semibold text-slate-900">
              All Predictions
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Total predictions:{" "}
              <span className="font-medium text-slate-700">
                {totalPredictions}
              </span>
            </p>

          </div>


          {/* Current Page Info */}

          {totalPredictions > 0 && (

            <div className="text-sm text-slate-500">

              Page{" "}

              <span className="font-medium text-slate-900">
                {currentPage}
              </span>

              {" "}of{" "}

              <span className="font-medium text-slate-900">
                {totalPages}
              </span>

            </div>

          )}

        </div>


        {/* ======================================
            Loading
        ====================================== */}

        {loading ? (

          <div className="py-12 text-center">

            <p className="text-slate-500">
              Loading prediction history...
            </p>

          </div>

        ) : error ? (

          /* ======================================
              Error
          ====================================== */

          <div className="rounded-lg border border-red-200 bg-red-50 p-4">

            <p className="text-red-600">
              {error}
            </p>

          </div>

        ) : predictions.length === 0 ? (

          /* ======================================
              Empty State
          ====================================== */

          <div className="py-12 text-center">

            <p className="text-slate-500">
              No predictions available.
            </p>

          </div>

        ) : (

          <>

            {/* ======================================
                Predictions Table
            ====================================== */}

            <div className="overflow-x-auto">

              <table className="w-full text-left">

                <thead>

                  <tr className="border-b border-slate-200 text-sm text-slate-500">

                    <th className="pb-4">
                      ID
                    </th>

                    <th className="pb-4">
                      Customer
                    </th>

                    <th className="pb-4">
                      Email
                    </th>

                    <th className="pb-4">
                      Probability
                    </th>

                    <th className="pb-4">
                      Risk Level
                    </th>

                    <th className="pb-4">
                      Prediction
                    </th>

                    <th className="pb-4">
                      Date
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {predictions.map(
                    (item) => (

                      <tr
                        key={
                          item.prediction_id
                        }
                        className="border-b border-slate-100 text-sm transition hover:bg-slate-50"
                      >

                        {/* ID */}

                        <td className="py-4 text-slate-500">

                          #
                          {
                            item.prediction_id
                          }

                        </td>


                        {/* Customer Name */}

                        <td className="py-4 font-medium text-slate-900">

                          {
                            item.customer_name
                          }

                        </td>


                        {/* Email */}

                        <td className="py-4 text-slate-600">

                          {
                            item.customer_email
                          }

                        </td>


                        {/* Probability */}

                        <td className="py-4 font-medium text-slate-900">

                          {
                            item.default_probability
                          }
                          %

                        </td>


                        {/* Risk */}

                        <td className="py-4">

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium ${getRiskStyle(
                              item.risk_level
                            )}`}
                          >

                            {
                              item.risk_level
                            }

                          </span>

                        </td>


                        {/* Prediction */}

                        <td className="py-4 text-slate-600">

                          {
                            item.prediction
                          }

                        </td>


                        {/* Date */}

                        <td className="py-4 text-slate-500">

                          {item.created_at
                            ? new Date(
                                item.created_at
                              ).toLocaleString()
                            : "N/A"}

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>


            {/* ======================================
                Pagination
            ====================================== */}

            <div className="mt-6 flex flex-col gap-4 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">

              {/* Showing Records */}

              <p className="text-sm text-slate-500">

                Showing{" "}

                <span className="font-medium text-slate-900">

                  {(currentPage - 1) *
                    limit +
                    1}

                </span>

                {" "}to{" "}

                <span className="font-medium text-slate-900">

                  {Math.min(
                    currentPage *
                      limit,
                    totalPredictions
                  )}

                </span>

                {" "}of{" "}

                <span className="font-medium text-slate-900">

                  {
                    totalPredictions
                  }

                </span>

                {" "}predictions

              </p>


              {/* Pagination Buttons */}

              <div className="flex items-center gap-2">

                {/* Previous */}

                <button
                  onClick={
                    handlePrevious
                  }
                  disabled={
                    currentPage === 1
                  }
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >

                  Previous

                </button>


                {/* Page Numbers */}

                {Array.from(
                  {
                    length:
                      totalPages,
                  },
                  (_, index) =>
                    index + 1
                ).map((page) => (

                  <button
                    key={page}
                    onClick={() =>
                      handlePageChange(
                        page
                      )
                    }
                    className={`h-9 min-w-9 rounded-lg px-3 text-sm font-medium transition ${
                      currentPage ===
                      page
                        ? "bg-blue-600 text-white"
                        : "border border-slate-300 text-slate-600 hover:bg-slate-50"
                    }`}
                  >

                    {page}

                  </button>

                ))}


                {/* Next */}

                <button
                  onClick={
                    handleNext
                  }
                  disabled={
                    currentPage ===
                    totalPages
                  }
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >

                  Next

                </button>

              </div>

            </div>

          </>

        )}

      </div>

    </DashboardLayout>
  );
}