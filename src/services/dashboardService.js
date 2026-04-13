const OrderDetail = require("../models/OrderDetail");
const Product = require("../models/Product");

function formatDate(date) {
  return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1)
    .toString()
    .padStart(2, "0")}/${date.getFullYear()}`;
}

function getDateRange(filter, fromDate, toDate) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const hasFromDate = Boolean(fromDate);
  const hasToDate = Boolean(toDate);
  const parsedFrom = fromDate ? new Date(fromDate) : null;
  const parsedTo = toDate ? new Date(toDate) : null;

  if (hasFromDate !== hasToDate) {
    return {
      from: new Date("2025-01-01T00:00:00.000Z"),
      to: now,
      label: "Tu 01/2025 den hien tai",
      custom: false,
      appliedFilter: "all",
      error: "Vui long chon day du Tu ngay va Den ngay.",
    };
  }

  if (
    parsedFrom instanceof Date &&
    !Number.isNaN(parsedFrom.getTime()) &&
    parsedTo instanceof Date &&
    !Number.isNaN(parsedTo.getTime())
  ) {
    const rangeFrom = new Date(parsedFrom.getFullYear(), parsedFrom.getMonth(), parsedFrom.getDate());
    const rangeTo = new Date(
      parsedTo.getFullYear(),
      parsedTo.getMonth(),
      parsedTo.getDate(),
      23,
      59,
      59,
      999
    );

    if (rangeFrom <= rangeTo) {
      return {
        from: rangeFrom,
        to: rangeTo,
        label: `${formatDate(rangeFrom)} - ${formatDate(rangeTo)}`,
        custom: true,
        appliedFilter: "custom",
        error: "",
      };
    }

    return {
      from: new Date("2025-01-01T00:00:00.000Z"),
      to: now,
      label: "Tu 01/2025 den hien tai",
      custom: false,
      appliedFilter: "all",
      error: "Khoang ngay khong hop le. Tu ngay phai nho hon hoac bang Den ngay.",
    };
  }

  if (filter === "thisMonth") {
    return {
      from: new Date(now.getFullYear(), now.getMonth(), 1),
      to: now,
      label: "Thang nay",
      custom: false,
      appliedFilter: "thisMonth",
      error: "",
    };
  }

  if (filter === "lastMonth") {
    return {
      from: new Date(now.getFullYear(), now.getMonth() - 1, 1),
      to: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999),
      label: "Thang truoc",
      custom: false,
      appliedFilter: "lastMonth",
      error: "",
    };
  }

  if (filter === "last7Days") {
    return {
      from: new Date(startOfToday.getTime() - 6 * 24 * 60 * 60 * 1000),
      to: now,
      label: "7 ngay qua",
      custom: false,
      appliedFilter: "last7Days",
      error: "",
    };
  }

  return {
    from: new Date("2025-01-01T00:00:00.000Z"),
    to: now,
    label: "Tu 01/2025 den hien tai",
    custom: false,
    appliedFilter: "all",
    error: "",
  };
}

async function getOverviewData(filter = "all", fromDate, toDate) {
  const dateRange = getDateRange(filter, fromDate, toDate);
  const matchDate = {
    "orderInfo.orderDate": { $gte: dateRange.from, $lte: dateRange.to },
    "orderInfo.status": "Completed",
  };
  const revenueGroupId = dateRange.custom
    ? {
        year: { $year: "$orderInfo.orderDate" },
        month: { $month: "$orderInfo.orderDate" },
        day: { $dayOfMonth: "$orderInfo.orderDate" },
      }
    : {
        year: { $year: "$orderInfo.orderDate" },
        month: { $month: "$orderInfo.orderDate" },
      };
  const revenueSort = dateRange.custom
    ? { "_id.year": 1, "_id.month": 1, "_id.day": 1 }
    : { "_id.year": 1, "_id.month": 1 };

  const monthlyRevenueRaw = await OrderDetail.aggregate([
    {
      $lookup: {
        from: "orders",
        localField: "order",
        foreignField: "_id",
        as: "orderInfo",
      },
    },
    { $unwind: "$orderInfo" },
    { $match: matchDate },
    {
      $group: {
        _id: revenueGroupId,
        totalRevenue: { $sum: { $multiply: ["$quantity", "$unitPrice"] } },
      },
    },
    { $sort: revenueSort },
  ]);

  const revenueByCategory = await OrderDetail.aggregate([
    {
      $lookup: {
        from: "orders",
        localField: "order",
        foreignField: "_id",
        as: "orderInfo",
      },
    },
    { $unwind: "$orderInfo" },
    { $match: matchDate },
    {
      $lookup: {
        from: "products",
        localField: "product",
        foreignField: "_id",
        as: "productInfo",
      },
    },
    { $unwind: "$productInfo" },
    {
      $group: {
        _id: "$productInfo.category",
        totalRevenue: { $sum: { $multiply: ["$quantity", "$unitPrice"] } },
      },
    },
    { $sort: { totalRevenue: -1 } },
  ]);

  const netProfitResult = await OrderDetail.aggregate([
    {
      $lookup: {
        from: "orders",
        localField: "order",
        foreignField: "_id",
        as: "orderInfo",
      },
    },
    { $unwind: "$orderInfo" },
    { $match: matchDate },
    {
      $lookup: {
        from: "products",
        localField: "product",
        foreignField: "_id",
        as: "productInfo",
      },
    },
    { $unwind: "$productInfo" },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: { $multiply: ["$quantity", "$unitPrice"] } },
        totalCost: { $sum: { $multiply: ["$quantity", "$productInfo.costPrice"] } },
      },
    },
    {
      $project: {
        _id: 0,
        totalRevenue: 1,
        totalCost: 1,
        netProfit: { $subtract: ["$totalRevenue", "$totalCost"] },
      },
    },
  ]);

  return {
    dateRange,
    monthlyRevenue: monthlyRevenueRaw.map((item) => ({
      label: dateRange.custom
        ? `${String(item._id.day).padStart(2, "0")}/${String(item._id.month).padStart(2, "0")}/${item._id.year}`
        : `${String(item._id.month).padStart(2, "0")}/${item._id.year}`,
      totalRevenue: item.totalRevenue,
    })),
    revenueByCategory: revenueByCategory.map((item) => ({
      category: item._id,
      totalRevenue: item.totalRevenue,
    })),
    netProfit: netProfitResult[0] || { totalRevenue: 0, totalCost: 0, netProfit: 0 },
  };
}

async function getReportsData(filter = "all", fromDate, toDate) {
  const dateRange = getDateRange(filter, fromDate, toDate);
  const matchDate = {
    "orderInfo.orderDate": { $gte: dateRange.from, $lte: dateRange.to },
    "orderInfo.status": "Completed",
  };

  const topCustomers = await OrderDetail.aggregate([
    {
      $lookup: {
        from: "orders",
        localField: "order",
        foreignField: "_id",
        as: "orderInfo",
      },
    },
    { $unwind: "$orderInfo" },
    { $match: matchDate },
    {
      $group: {
        _id: "$orderInfo._id",
        customer: { $first: "$orderInfo.customer" },
        orderTotal: { $sum: { $multiply: ["$quantity", "$unitPrice"] } },
      },
    },
    {
      $group: {
        _id: "$customer",
        totalOrders: { $sum: 1 },
        totalSpent: { $sum: "$orderTotal" },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "userInfo",
      },
    },
    { $unwind: "$userInfo" },
    {
      $project: {
        _id: 0,
        name: "$userInfo.name",
        email: "$userInfo.email",
        totalOrders: 1,
        totalSpent: 1,
      },
    },
    { $sort: { totalSpent: -1 } },
    { $limit: 10 },
  ]);

  const employeePerformance = await OrderDetail.aggregate([
    {
      $lookup: {
        from: "orders",
        localField: "order",
        foreignField: "_id",
        as: "orderInfo",
      },
    },
    { $unwind: "$orderInfo" },
    { $match: matchDate },
    {
      $group: {
        _id: "$orderInfo._id",
        staff: { $first: "$orderInfo.staff" },
        orderTotal: { $sum: { $multiply: ["$quantity", "$unitPrice"] } },
      },
    },
    {
      $group: {
        _id: "$staff",
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: "$orderTotal" },
      },
    },
    {
      $lookup: {
        from: "employees",
        localField: "_id",
        foreignField: "_id",
        as: "staffInfo",
      },
    },
    { $unwind: "$staffInfo" },
    {
      $project: {
        _id: 0,
        code: "$staffInfo.code",
        name: "$staffInfo.name",
        totalOrders: 1,
        totalRevenue: 1,
        bonus: { $multiply: ["$totalRevenue", 0.01] },
      },
    },
    { $sort: { totalRevenue: -1 } },
  ]);

  const lowStockProducts = await Product.find({ stock: { $lt: 10 } })
    .select("name category stock price")
    .sort({ stock: 1 })
    .lean();

  return {
    dateRange,
    topCustomers,
    employeePerformance,
    lowStockProducts,
  };
}

module.exports = { getOverviewData, getReportsData, getDateRange };
