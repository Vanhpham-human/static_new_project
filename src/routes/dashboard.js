const express = require("express");
const { getOverviewData, getReportsData } = require("../services/dashboardService");

const router = express.Router();

router.get("/", (req, res) => {
  res.redirect("/dashboard/overview");
});

router.get("/dashboard/overview", async (req, res, next) => {
  try {
    const filter = req.query.filter || "all";
    const fromDate = req.query.fromDate || "";
    const toDate = req.query.toDate || "";
    const data = await getOverviewData(filter, fromDate, toDate);
    res.render("overview", {
      filter: data.dateRange.appliedFilter || filter,
      fromDate,
      toDate,
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
    const fromDate = req.query.fromDate || "";
    const toDate = req.query.toDate || "";
    const data = await getReportsData(filter, fromDate, toDate);
    res.render("reports", {
      filter: data.dateRange.appliedFilter || filter,
      fromDate,
      toDate,
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
