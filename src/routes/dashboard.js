const express = require("express");
const { getOverviewData, getReportsData } = require("../services/dashboardService");

const router = express.Router();

function parseDateRangeQuery(dateRangeText) {
  if (!dateRangeText) {
    return { fromDate: "", toDate: "" };
  }

  const parts = dateRangeText.split(" to ").map((value) => value.trim());
  if (parts.length !== 2) {
    return { fromDate: "", toDate: "" };
  }

  const [fromDate, toDate] = parts;
  return { fromDate, toDate };
}

router.get("/", (req, res) => {
  res.redirect("/dashboard/overview");
});

router.get("/dashboard/overview", async (req, res, next) => {
  try {
    const filter = req.query.filter || "all";
    const dateRangeText = req.query.dateRange || "";
    const dateRangeParsed = parseDateRangeQuery(dateRangeText);
    const fromDate = req.query.fromDate || dateRangeParsed.fromDate || "";
    const toDate = req.query.toDate || dateRangeParsed.toDate || "";
    const granularity = req.query.granularity || "auto";
    const data = await getOverviewData(filter, fromDate, toDate, granularity);
    res.render("overview", {
      filter: data.dateRange.appliedFilter || filter,
      fromDate,
      toDate,
      dateRangeText: fromDate && toDate ? `${fromDate} to ${toDate}` : "",
      granularity: data.effectiveGranularity,
      dateRangeLabel: data.dateRange.label,
      filterError: data.dateRange.error,
      isCustomRange: data.dateRange.custom,
      monthlyRevenue: data.monthlyRevenue,
      revenueByCategory: data.revenueByCategory,
      netProfit: data.netProfit,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/dashboard/reports", async (req, res, next) => {
  try {
    const filter = req.query.filter || "all";
    const dateRangeText = req.query.dateRange || "";
    const dateRangeParsed = parseDateRangeQuery(dateRangeText);
    const fromDate = req.query.fromDate || dateRangeParsed.fromDate || "";
    const toDate = req.query.toDate || dateRangeParsed.toDate || "";
    const data = await getReportsData(filter, fromDate, toDate);
    res.render("reports", {
      filter: data.dateRange.appliedFilter || filter,
      fromDate,
      toDate,
      dateRangeText: fromDate && toDate ? `${fromDate} to ${toDate}` : "",
      dateRangeLabel: data.dateRange.label,
      filterError: data.dateRange.error,
      isCustomRange: data.dateRange.custom,
      topCustomers: data.topCustomers,
      employeePerformance: data.employeePerformance,
      lowStockProducts: data.lowStockProducts,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
