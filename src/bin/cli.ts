import assert from 'node:assert'
import { getConfig } from '../config'
import { executeSpell } from '../executeSpell'
import { EthereumClient } from '../periphery/ethereum'
import { buildAppUrl } from '../periphery/spark-app'
import { createTenderlyVNet, getRandomChainId } from '../periphery/tenderly'
import { deployContract } from '../periphery/forge'
import { getChainIdFromSpellName } from '../utils/getChainIdFromSpellName'
import { getRequiredShellEnv } from '../config/environments/cli'

async function main(spellName?: string) {
  assert(spellName, 'Pass spell name as an argument ex. SparkEthereum_20240627')

  const config = getConfig(getRequiredShellEnv)
  const originChainId = getChainIdFromSpellName(spellName)
  const chain = config.networks[originChainId]
  assert(chain, `Chain not found for chainId: ${originChainId}`)
  const forkChainId = getRandomChainId()

  console.log(`Executing spell ${spellName} on ${chain.name} (chainId=${originChainId})`)

  const rpc = await createTenderlyVNet({
    account: config.tenderly.account,
    apiKey: config.tenderly.apiKey,
    project: config.tenderly.project,
    originChainId: originChainId,
    forkChainId,
  })
  const ethereumClient = new EthereumClient(rpc, forkChainId, config.deployer)

  const spellAddress = await deployContract(spellName, rpc, config.deployer)

  await executeSpell({ spellAddress, network: chain, ethereumClient })

  console.log(`Fork Network RPC: ${rpc}`)
  console.log(`Spark App URL: ${buildAppUrl({ rpc, originChainId })}`)
}

const arg1 = process.argv[2]
await main(arg1)
