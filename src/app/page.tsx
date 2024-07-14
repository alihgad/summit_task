"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { Table, Input, Select } from "antd";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import Loader from "./components/loader/Loader";

// define interfaces
interface Customer {
  id: number;
  name: string;
  amount: number;
}

interface Transaction {
  id: number;
  customer_id: number;
  date: string;
  amount: number;
}

interface Data {
  transaction_id: number;
  name: string | undefined;
  amount: number;
  date: string;
}
// Destruct Select Option
const { Option } = Select;

const Home: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [search, setSearch] = useState<string>("");
  const [selectedCustomer, setSelectedCustomer] = useState<number | null>(null);
  const [graphData, setGraphData] = useState<
    { date: string; amount: number }[]
  >([]);

  useEffect(() => {
    // Fetch data from API
    const fetchData = async () => {
      try {
        const [customersRes, transactionsRes] = await Promise.all([
          axios.get("https://summit-api-kappa.vercel.app/customers"),
          axios.get("https://summit-api-kappa.vercel.app/transactions"),
        ]);
        setCustomers(customersRes.data);
        setTransactions(transactionsRes.data);
      } catch (error) {
        console.error("Failed to fetch data", error);
      } finally {
        // end loading any way
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // prepare table data by merging customer name with rvrey transaction
  let result: Data[] = transactions.map((t) => {
    return {
      transaction_id: t.id,
      name: customers.find((c) => {
        return c.id == t.customer_id;
      })?.name,
      date: t.date,
      amount: t.amount,
    };
  });

  // Handle search input changes
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  let filtered: Data[] = result;

  if (search) {
    if (Number(search)) {
      filtered = result.filter((c) => c.amount?.toString().includes(search));
    } else {
      filtered = result.filter((c) =>
        c.name?.toLowerCase().includes(search.toLowerCase())
      );
    }
  }

  // prepare graph data
  const handleCustomerChange = (value: number) => {
    setSelectedCustomer(value);
    // get selsevted customr transaction
    const customerTransactions = transactions.filter(
      (transaction) => transaction.customer_id == customers[value - 1].id
    );

    // sum evrey day total transaction amount
    const aggregatedData = customerTransactions.reduce(
      (acc: { [key: string]: number }, t) => {
        acc[t.date] = (acc[t.date] || 0) + t.amount;
        return acc;
      },
      {}
    );
    const formattedData = Object.keys(aggregatedData).map((date) => ({
      date,
      amount: aggregatedData[date],
    }));

    setGraphData(formattedData);
  };

  // define table columns
  const columns = [
    { title: "Name", dataIndex: "name", key: "name" },
    { title: "Transaction Amount", dataIndex: "amount", key: "amount" },
    { title: "Transaction Date", dataIndex: "date", key: "date" },
  ];

  return (
    <div className="mb-20 ">
      {loading ? (
        <Loader />
      ) : (
        <div className="sm:mx-auto mx-3 my-5  border border-gray-500 rounded-lg max-w-7xl">
          <section className="border-b-2 px-4 pt-2">
            <Input
              placeholder="Search by customer name or transaction value"
              value={search}
              onChange={handleSearch}
              style={{ marginBottom: 10 }}
              className="mt-2 mb-4 w-full "
            />

            <Table
              className="overflow-x-auto"
              bordered={true}
              pagination={{
                position: ["bottomCenter"],
                pageSize: 5,
                responsive: true,
                showTotal: (total, range) => {
                  return `${total} transaction , ${range[0]}-${range[1]} of ${total}`;
                },
              }}
              dataSource={filtered.map((transaction) => ({
                key: transaction.transaction_id,
                name: transaction.name,
                amount: transaction.amount,
                date: transaction.date,
              }))}
              columns={columns}
            />
          </section>

          <section className="flex justify-center flex-col items-center px-4 pt-4">
            <h4 className="text-3xl text-center">
              {"<"} Graph {">"}
            </h4>
            <Select
              placeholder="Select a customer"
              // style={{ width: 200, margin: "20px 0" }}
              className="w-full sm:w-1/2 mt-4 mb-4"
              onChange={handleCustomerChange}
            >
              {customers.map((customer) => (
                <Option key={customer.id} value={customer.id}>
                  {customer.name}
                </Option>
              ))}
            </Select>
          </section>

          <section className=" mx-2  overflow-x-auto lg:flex justify-center my-5">
            <div>
              {selectedCustomer && (
                <LineChart
                  width={600}
                  height={300}
                  data={graphData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis name="amount" />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="amount" stroke="#8884d8" />
                </LineChart>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default Home;
