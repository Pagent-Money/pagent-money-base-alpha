import { http, createConfig } from 'wagmi'
import { coinbaseWallet } from 'wagmi/connectors'
import { getDefaultChain, getSupportedChains, getChainConfig } from '../config/chains'

// Get supported chains
const supportedChains = getSupportedChains()
const defaultChain = getDefaultChain()

// Build transports for all supported chains
const transports = supportedChains.reduce((acc, chain) => {
  const config = getChainConfig(chain.id)
  if (config) {
    acc[chain.id] = http(config.rpcUrl)
  }
  return acc
}, {} as Record<number, ReturnType<typeof http>>)

export const config = createConfig({
  chains: supportedChains as any,
  connectors: [
    coinbaseWallet({
      appName: 'Pagent Credits',
      appLogoUrl: 'https://pagent-credits-hgkrcp3ew-wenqing-yus-projects.vercel.app/pagentmoney_p_logo.png',
      preference: 'smartWalletOnly',
      version: '4',
    }),
  ],
  transports,
  ssr: true,
})

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}
