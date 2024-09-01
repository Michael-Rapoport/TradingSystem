import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const PriceChart = ({ asset }) => {
  const [data, setData] = useState([]);

  useEffect(() => {
    // Function to fetch price data
    const fetchPriceData = async () => {
      // In a real app, you'd fetch this data from your backend or a third-party API
      const response = await fetch(`/api/price/${asset}`);
      const priceData = await response.json();
      setData(priceData);
    };

    fetchPriceData();

    // Set up WebSocket connection for real-time updates
    const ws = new WebSocket(`${process.env.NEXT_PUBLIC_WS_URL}/price/${asset}`);
    ws.onmessage = (event) => {
      const newPrice = JSON.parse(event.data);
      setData(currentData => [...currentData, newPrice].slice(-100));  // Keep last 100 data points
    };

    return () => ws.close();
  }, [asset]);

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="timestamp" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="price" stroke="#8884d8" />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default PriceChart;