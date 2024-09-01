import { useState, useEffect } from 'react'
import { 
  Box, 
  Heading, 
  Text, 
  VStack, 
  HStack, 
  Table, 
  Thead, 
  Tbody, 
  Tr, 
  Th, 
  Td 
} from "@chakra-ui/react"

export default function Dashboard() {
  const [portfolio, setPortfolio] = useState({})
  const [trades, setTrades] = useState([])

  useEffect(() => {
    // Fetch portfolio data
    fetch('/api/portfolio', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
      .then(res => res.json())
      .then(data => setPortfolio(data))

    // Fetch recent trades
    fetch('/api/trades', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
      .then(res => res.json())
      .then(data => setTrades(data.slice(0, 5)))  // Show only 5 most recent trades

    // Set up WebSocket for real-time updates
    const ws = new WebSocket(`${process.env.NEXT_PUBLIC_WS_URL}/updates`);
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.type === 'trade') {
        setTrades(prevTrades => [data.trade, ...prevTrades.slice(0, 4)])
      } else if (data.type === 'portfolio_update') {
        setPortfolio(data.portfolio)
      }
    }

    return () => ws.close()
  }, [])

  return (
    <Box maxWidth="800px" margin="auto" mt={8}>
      <Heading mb={6}>Dashboard</Heading>
      <VStack spacing={8} align="stretch">
        <Box>
          <Heading size="md" mb={4}>Portfolio</Heading>
          <HStack spacing={4}>
            {Object.entries(portfolio).map(([asset, amount]) => (
              <Box key={asset} p={4} borderWidth={1} borderRadius="md">
                <Text fontWeight="bold">{asset}</Text>
                <Text>{amount}</Text>
              </Box>
            ))}
          </HStack>
        </Box>
        <Box>
          <Heading size="md" mb={4}>Recent Trades</Heading>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Asset</Th>
                <Th>Amount</Th>
                <Th>Price</Th>
                <Th>Type</Th>
                <Th>Time</Th>
              </Tr>
            </Thead>
            <Tbody>
              {trades.map(trade => (
                <Tr key={trade.id}>
                  <Td>{trade.asset}</Td>
                  <Td>{trade.amount}</Td>
                  <Td>${trade.price}</Td>
                  <Td>{trade.type}</Td>
                  <Td>{new Date(trade.timestamp).toLocaleString()}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      </VStack>
    </Box>
  )
}