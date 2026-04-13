require("dotenv").config();
const { faker } = require("@faker-js/faker");
const connectDB = require("../src/config/db");
const User = require("../src/models/User");
const Employee = require("../src/models/Employee");
const Product = require("../src/models/Product");
const Order = require("../src/models/Order");
const OrderDetail = require("../src/models/OrderDetail");

const USER_COUNT = 500;
const EMPLOYEE_COUNT = 30;
const PRODUCT_COUNT = 100;
const ORDER_COUNT = 5000;
const ORDER_DETAILS_AVG = 3;

const CATEGORIES = [
  "Smartphone",
  "Laptop",
  "Tablet",
  "PC",
  "Monitor",
  "Audio",
  "Accessory",
  "Networking",
  "SmartHome",
  "Gaming",
];

function randomDateInRange() {
  const start = new Date("2025-01-01T00:00:00.000Z").getTime();
  const end = Date.now();
  return new Date(faker.number.int({ min: start, max: end }));
}

async function seedUsers() {
  const users = Array.from({ length: USER_COUNT }, () => ({
    name: faker.person.fullName(),
    email: faker.internet.email().toLowerCase(),
    address: faker.location.streetAddress({ useFullAddress: true }),
    phone: faker.phone.number("0#########"),
  }));

  return User.insertMany(users, { ordered: false });
}

async function seedEmployees() {
  const employees = Array.from({ length: EMPLOYEE_COUNT }, (_, idx) => ({
    name: faker.person.fullName(),
    code: `EMP${String(idx + 1).padStart(4, "0")}`,
    position: idx < 3 ? "Manager" : idx < 8 ? "Leader" : "Sales",
    salary: faker.number.int({ min: 9000000, max: 35000000 }),
  }));

  return Employee.insertMany(employees, { ordered: true });
}

async function seedProducts() {
  const products = Array.from({ length: PRODUCT_COUNT }, () => {
    const costPrice = faker.number.int({ min: 500000, max: 40000000 });
    const salePrice = Math.round(costPrice * faker.number.float({ min: 1.08, max: 1.45 }));
    return {
      name: faker.commerce.productName(),
      category: faker.helpers.arrayElement(CATEGORIES),
      price: salePrice,
      costPrice,
      stock: faker.number.int({ min: 0, max: 120 }),
    };
  });

  return Product.insertMany(products, { ordered: true });
}

async function seedOrdersAndDetails(users, employees, products) {
  const orders = Array.from({ length: ORDER_COUNT }, () => ({
    customer: faker.helpers.arrayElement(users)._id,
    staff: faker.helpers.arrayElement(employees)._id,
    orderDate: randomDateInRange(),
    status: faker.helpers.weightedArrayElement([
      { value: "Completed", weight: 82 },
      { value: "Pending", weight: 10 },
      { value: "Cancelled", weight: 8 },
    ]),
  }));

  const insertedOrders = await Order.insertMany(orders, { ordered: true });
  const orderDetails = [];

  for (const order of insertedOrders) {
    const lineCount = faker.number.int({ min: 2, max: 4 });
    for (let i = 0; i < lineCount; i += 1) {
      const product = faker.helpers.arrayElement(products);
      const quantity = faker.number.int({ min: 1, max: 5 });
      const unitPrice = Math.round(product.price * faker.number.float({ min: 0.92, max: 1.05 }));
      orderDetails.push({
        order: order._id,
        product: product._id,
        quantity,
        unitPrice,
      });
    }
  }

  // Insert in chunks to avoid huge memory spikes on large datasets.
  const chunkSize = 3000;
  for (let i = 0; i < orderDetails.length; i += chunkSize) {
    const chunk = orderDetails.slice(i, i + chunkSize);
    await OrderDetail.insertMany(chunk, { ordered: false });
  }

  return { orders: insertedOrders.length, details: orderDetails.length };
}

async function clearCollections() {
  await Promise.all([
    User.deleteMany({}),
    Employee.deleteMany({}),
    Product.deleteMany({}),
    Order.deleteMany({}),
    OrderDetail.deleteMany({}),
  ]);
}

async function run() {
  await connectDB();
  console.log("Seeding started...");

  await clearCollections();

  const users = await seedUsers();
  const employees = await seedEmployees();
  const products = await seedProducts();
  const orderStats = await seedOrdersAndDetails(users, employees, products);

  console.log("Seeding done:");
  console.log(`- Users: ${users.length}`);
  console.log(`- Employees: ${employees.length}`);
  console.log(`- Products: ${products.length}`);
  console.log(`- Orders: ${orderStats.orders}`);
  console.log(`- OrderDetails: ${orderStats.details} (target ~${ORDER_COUNT * ORDER_DETAILS_AVG})`);

  process.exit(0);
}

run().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
