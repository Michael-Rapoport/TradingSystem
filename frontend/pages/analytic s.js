

jsxCopyimport { useState, useEffect } from 'react'
import { Box, Heading, VStack } from "@chakra-ui/react"
import PriceChart from '../components/PriceChart'

export default function Analytics() {
  const [assets, setAssets] = useState(['BTC', 'ETH'])

  return (
    <Box maxWidth="800px" margin="auto" mt={8}>
      <Heading mb={6}>Analytics</Heading>
      <VStack spacing={8} align="stretch">
        {assets.map(asset => (
          <Box key={asset}>
            <Heading size="md" mb={4}>{asset} Price Chart</Heading>
            <PriceChart asset={asset} />
          </Box>
        ))}
      </VStack>
    </Box>
  )
}

