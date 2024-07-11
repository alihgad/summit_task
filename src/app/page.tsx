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
    const fetchData = async () => {
      const customersRes = await axios.get(
        "https://summit-api-kappa.vercel.app/customers"
      );
      const transactionsRes = await axios.get(
        "https://summit-api-kappa.vercel.app/transactions"
      );
      setLoading(false);
      setCustomers(customersRes.data);
      setTransactions(transactionsRes.data);
    };
    fetchData();
  }, []);

  let filteredData: Customer[] = customers;

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  let filtered: Customer[] = customers;

  if (search) {
    filtered = customers.filter((c) =>
      c.name.toLowerCase().includes(search.toLowerCase())
    );
  }

  let filter = filtered.map((c) => {
    return {
      id: c.id,
      name: c.name,
      amount: transactions
        .map((t) => {
          if (t.customer_id == c.id) {
            return t.amount;
          } else {
            return 0;
          }
        })
        .reduce((acc, t) => acc + t, 0),
    };
  });

  filteredData = filter;

  const handleCustomerChange = (value: number) => {
    setSelectedCustomer(value);
    const customerTransactions = transactions.filter(
      (t) => t.customer_id == customers[value - 1].id
    );

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

  const columns = [
    { title: "Name", dataIndex: "name", key: "name" },
    { title: "Transaction Amount", dataIndex: "amount", key: "amount" },
  ];

  return (
    <div className="mb-20 ">
      {loading ? (
        <Loader />
      ) : (
        <div className="mx-5 my-5 px-2 border border-gray-500 rounded-lg">
          <Input
            placeholder="Search by customer name"
            value={search}
            onChange={handleSearch}
            style={{ marginBottom: 10 }}
            className="mt-2"
          />

          <Table
            dataSource={filteredData.map((customer) => ({
              key: customer.id,
              name: customer.name,
              amount: customer.amount,
            }))}
            columns={columns}
          />

          <Select
            placeholder="Select a customer"
            style={{ width: 200, margin: "20px 0" }}
            onChange={handleCustomerChange}
          >
            {customers.map((customer) => (
              <Option key={customer.id} value={customer.id}>
                {customer.name}
              </Option>
            ))}
          </Select>
          <div className="overflow-x-auto">
          {selectedCustomer && (
            <LineChart
              width={600}
              height={300}
              data={graphData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="amount" stroke="#8884d8" />
            </LineChart>
          )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
