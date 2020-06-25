import Web3 from 'web3'
import VETHEROLD from '../artifacts/VetherOld.json'
import VETHER from '../artifacts/Vether.json'
import UNISWAP from '../artifacts/UniswapPair.json'
import REGISTRY from '../artifacts/UniswapRegistry.json'
import GASMINE from '../artifacts/GasMineContract.json'

const TESTNET = (process.env.REACT_APP_TESTNET === 'TRUE') ? true : false

export const getEtherscanURL = () => {
    if(TESTNET) {
        return "https://rinkeby.etherscan.io/"
    } else {
        return "https://etherscan.io/"
    }
}

export const vetherOldAddr = () => {
    if(TESTNET) {
        return '0x04cFc5Df3c091bc6c050909eab808dF7a0910C91'
    } else {
        return '0x31Bb711de2e457066c6281f231fb473FC5c2afd3'
    }
}

export const vetherOldAbi = () => {
	return VETHEROLD.abi
}

export const vetherAddr = () => {
    if(TESTNET) {
        return '0x02E53F80Ee139bF46D0Cd20B34a86d1f2926544B'
    } else {
        return '0x01217729940055011f17befe6270e6e59b7d0337'
    }
}

export const vetherAbi = () => {
	return VETHER.abi
}

export const gasMineAddr = () => {
    if(TESTNET) {
        return '0xE5EdDde02968D27D4A580cc85351cCBD244CBBCA'
    } else {
        return '0x8A9C1Cd4074751e94F2c4075D333Fb3226CA9378'
    }
}

export const gasMineAbi = () => {
	return GASMINE.abi
}

export const infuraAPI = () => {
    const apiKey = process.env.REACT_APP_INFURA_API
    if(TESTNET) {
        return ('https://rinkeby.infura.io/v3/' + apiKey)
    } else {
        return ('https://mainnet.infura.io/v3/' + apiKey)
    }
}

export const getWeb3 = () => {
    return new Web3(Web3.givenProvider || "http://localhost:7545") 
}

export const uniSwapAddr = () => {
    if(TESTNET) {
        return null
    } else {
        return '0x03e008804c5bf70e20b5a0b7233cf2687ccd2a96'
    }
}

export const uniSwapAbi = () => {
	return UNISWAP.abi
}

export const registryAddr = () => {
    if(TESTNET) {
        return null
    } else {
        return '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f'
    }
}

export const registryAbi = () => {
	return REGISTRY.abi
}

export const getUniswapPriceEth = async () => {
    const web3 = new Web3(new Web3.providers.HttpProvider(infuraAPI()))
    const contract = new web3.eth.Contract(uniSwapAbi(), uniSwapAddr())
    let valueEth;
    try {
        const reserves = await contract.methods.getReserves().call()
        const vether = reserves.reserve0
        const ether = reserves.reserve1
        valueEth = ether/vether
    } catch(err) {
        valueEth = 0.00
        console.log(err)
    }
    return convertFromWei(valueEth)
}

export const getExchangeAddr = async (token) =>{
    const web3 = new Web3(new Web3.providers.HttpProvider(infuraAPI()))
    const registry = new web3.eth.Contract(registryAbi(), registryAddr())
    const exchange = await registry.methods.getExchange(token).call()
    console.log(exchange, token)
    return exchange
}

export const getUniswapTokenPriceEth = async (token) => {
    const exchange = await getExchangeAddr(token)
    const web3 = new Web3(new Web3.providers.HttpProvider(infuraAPI()))
    const contract = new web3.eth.Contract(uniSwapAbi(), exchange)
    const _1 = (1*10**18).toString()
    let valueEth;
    try {
        valueEth = await contract.methods.getTokenToEthInputPrice(_1).call()
    } catch(err) {
        valueEth = 0.00
        console.log(err)
    }
    return convertFromWei(valueEth)
}

export const getGasValue = async () => {
    
}

export const getUniswapDetails = async () => {
    const web3 = new Web3(new Web3.providers.HttpProvider(infuraAPI()))
    const contract = new web3.eth.Contract(vetherAbi(), vetherAddr())
    const ethBalance = convertFromWei(await web3.eth.getBalance(uniSwapAddr()))
	const vethBalance = convertFromWei(await contract.methods.balanceOf(uniSwapAddr()).call())
    const uniswapDetails = {"eth":ethBalance, "veth":vethBalance, address:uniSwapAddr()}
    return uniswapDetails
}

function convertFromWei(number) {
    return number / 1000000000000000000
}

export const getAccounts = async (i) => {
    let web3_ = getWeb3()
    let accounts = await web3_.eth.getAccounts()
    return accounts[i]
}

export const getBalance = async (acc) => {
    let bal_ = await getWeb3().eth.getBalance(acc)
    return bal_
}

export const vetherContract = () => {
    let abi_ = vetherAbi()
    let addr_ = vetherAddr()
    let web3_ = getWeb3()
    return new web3_.eth.Contract(abi_, addr_)
}

export const getVethBalance = async (acc) => {
    let bal_ = await vetherContract().methods.balanceOf(acc).call()
    return bal_
}
