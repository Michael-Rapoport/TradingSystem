import { useState } from 'react'
import { 
  Box, 
  Button, 
  FormControl, 
  FormLabel, 
  Input, 
  Select, 
  VStack,
  Heading,
  useToast,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
} from "@chakra-ui/react"
import PriceChart from '../components/PriceChart'

export default function Trading() {
  const [order, setOrder] = useState({ 
    asset: 'BTC', 
    amount: '', 
    type: 'market', 
    price: '',
    target_price: '',
    trail_percent: '',
    oco_order: [
      { type: 'limit', price: '', target_price: '' },
      { type: 'stop', price: '', target_price: '' }
    ]
  })
  const toast = useToast()

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(order)
      })
      const data = await response.json()
      if (response.ok) {
        toast({
          title: "Order placed.",
          description: `Order ID: ${data.order_id || data.order_ids.join(', ')}`,
          status: "success",
          duration: 9000,
          isClosable: true,
        })
      } else {
        throw new Error(data.message)
      }
    } catch (error) {
      toast({
        title: "An error occurred.",
        description: error.message,
        status: "error",
        duration: 9000,
        isClosable: true,
      })
    }
  }

  return (
    <Box maxWidth="800px" margin="auto" mt={8}>
      <Heading mb={6}>Trading</Heading>
      <PriceChart asset={order.asset} />
      <form onSubmit={handleSubmit}>
        <VStack spacing={4}>
          <FormControl>
            <FormLabel>Asset</FormLabel>
            <Select
              value={order.asset}
              onChange={(e) => setOrder({...order, asset: e.target.value})}
            >
              <option value="BTC">Bitcoin</option>
              <option value="ETH">Ethereum</option>
            </Select>
          </FormControl>
          <FormControl>
            <FormLabel>Amount</FormLabel>
            <Input
              type="number"
              value={order.amount}
              onChange={(e) => setOrder({...order, amount: e.target.value})}
              placeholder="Amount"
            />
          </FormControl>
          <FormControl>
            <FormLabel>Order Type</FormLabel>
            <Select
              value={order.type}
              onChange={(e) => setOrder({...order, type: e.target.value})}
            >
              <option value="market">Market</option>
              <option value="limit">Limit</option>
              <option value="stop">Stop</option>
              <option value="trailing_stop">Trailing Stop</option>
              <option value="oco">OCO</option>
            </Select>
          </FormControl>
          {order.type === 'limit' && (
            <FormControl>
              <FormLabel>Limit Price</FormLabel>
              <Input
                type="number"
                value={order.target_price}
                onChange={(e) => setOrder({...order, target_price: e.target.value})}
                placeholder="Limit Price"
              />
            </FormControl>
          )}
          {order.type === 'stop' && (
            <FormControl>
              <FormLabel>Stop Price</FormLabel>
              <Input
                type="number"
                value={order.target_price}
                onChange={(e) => setOrder({...order, target_price: e.target.value})}
                placeholder="Stop Price"
              />
            </FormControl>
          )}
          {order.type === 'trailing_stop' && (
            <FormControl>
              <FormLabel>Trail Percent</FormLabel>
              <Input
                type="number"
                value={order.trail_percent}
                onChange={(e) => setOrder({...order, trail_percent: e.target.value})}
                placeholder="Trail Percent"
              />
            </FormControl>
          )}
          {order.type === 'oco' && (
            <Accordion allowMultiple>
              <AccordionItem>
                <h2>
                  <AccordionButton>
                    <Box flex="1" textAlign="left">
                      First OCO Order
                    </Box>
                    <AccordionIcon />
                  </AccordionButton>
                </h2>
                <AccordionPanel pb={4}>
                  <FormControl>
                    <FormLabel>Type</FormLabel>
                    <Select
                      value={order.oco_order[0].type}
                      onChange={(e) => setOrder({...order, oco_order: [
                        {...order.oco_order[0], type: e.target.value},
                        order.oco_order[1]
                      ]})}
                    >
                      <option value="limit">Limit</option>
                      <option value="stop">Stop</option>
                    </Select>
                  </FormControl>
                  <FormControl mt={2}>
                    <FormLabel>Price</FormLabel>
                    <Input
                      type="number"
                      value={order.oco_order[0].price}
                      onChange={(e) => setOrder({...order, oco_order: [
                        {...order.oco_order[0], price: e.target.value},
                        order.oco_order[1]
                      ]})}
                      placeholder="Price"
                    />
                  </FormControl>
                </AccordionPanel>
              </AccordionItem>
              <AccordionItem>
                <h2>
                  <AccordionButton>
                    <Box flex="1" textAlign="left">
                      Second OCO Order
                    </Box>
                    <AccordionIcon />
                  </AccordionButton>
                </h2>
                <AccordionPanel pb={4}>
                  <FormControl>
                    <FormLabel>Type</FormLabel>
                    <Select
                      value={order.oco_order[1].type}
                      onChange={(e) => setOrder({...order, oco_order: [
                        order.oco_order[0],
                        {...order.oco_order[1], type: e.target.value}
                      ]})}
                    >
                      <option value="limit">Limit</option>
                      <option value="stop">Stop</option>
                    </Select>
                  </FormControl>
                  <FormControl mt={2}>
                    <FormLabel>Price</FormLabel>
                    <Input
                      type="number"
                      value={order.oco_order[1].price}
                      onChange={(e) => setOrder({...order, oco_order: [
                        order.oco_order[0],
                        {...order.oco_order[1], price: e.target.value}
                      ]})}
                      placeholder="Price"
                    />
                  </FormControl>
                </AccordionPanel>
              </AccordionItem>
            </Accordion>
          )}
          <Button type="submit" colorScheme="blue">Place Order</Button>
        </VStack>
      </form>
    </Box>
  )
}