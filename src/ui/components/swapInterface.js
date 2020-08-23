import React, { useState, useEffect, useContext } from 'react'
import { Context } from '../../context'
import Web3 from 'web3'

import { Row, Col, Input, Tooltip } from 'antd'
import { SwapOutlined, QuestionCircleOutlined, LoadingOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import { Label, Sublabel, Button, Colour, LabelGrey } from '../components'

import { ETH, vetherAddr, vetherAbi, vetherPools2Addr, vetherPools2Abi, getEtherscanURL,
    infuraAPI, getVetherPrice } from '../../client/web3.js'
import { totalSupply, convertToWei, BN2Str, oneBN, convertFromWei, currency } from '../../common/utils'
import { calcSwapOutput } from '../../common/clpLogic'
import { getETHPrice } from "../../client/market"

export const SwapInterface = () => {

    const context = useContext(Context)

    const [connected, setConnected] = useState(false)
    const [account, setAccount] = useState(
        { address: '', vethBalance: '', ethBalance: '' })

    const [approved, setApproved] = useState(true)
    const [approveFlag, setApproveFlag] = useState(false)

    const [ethTx, setEthTx] = useState(null)
    const [ethAmount, setEthAmount] = useState(0)
    const [ethAmountCalculated, setEthAmountCalculated] = useState(0)

    const [trade, setTrade] = useState({ price: 0, slippage: 0, slippagePercent: 0, slippageColor: '', slippageWarning: false })
    const inCurrency = 'ETH'

    const [vetherContract, setVetherContract] = useState(null)
    const [vethTx, setVethTx] = useState(null)
    const [vethAmount, setVethAmount] = useState(0)
    const [vethAmountCalculated, setVethAmountCalculated] = useState(0)

    const [buyFlag, setBuyFlag] = useState(false)
    const [loadedBuy, setLoadedBuy] = useState(null)
    const [sellFlag, setSellFlag] = useState(false)
    const [loadedSell, setLoadedSell] = useState(null)

    const [poolData, setPoolData] = useState(
		{ "eth": "", "veth": '', 'price': "", "fees": "", "volume": "", "txCount": "", 'roi': "" })
    const [marketData, setMarketData] = useState(
        { priceUSD: '', priceETH: '', ethPrice: '' })

    useEffect(() => {
        connect()
        loadPoolData()
        loadMarketData()
        // eslint-disable-next-line
    }, [])

    const connect = async () => {
        const accountConnected = (await window.web3.eth.getAccounts())[0]
        if(accountConnected) {
            const accounts = await window.web3.eth.getAccounts()
            const address = accounts[0]
            const web3 = new Web3(new Web3.providers.HttpProvider(infuraAPI()))
            const vetherContract = new web3.eth.Contract(vetherAbi(), vetherAddr())
            loadAccountData(vetherContract, address)
            setVetherContract(vetherContract)
            checkApproval(address)
            setConnected(true)
        } else {
            setConnected(false)
        }
    }

    const loadAccountData = async (contract, address) => {
        const accountConnected = (await window.web3.eth.getAccounts())[0]
        if(accountConnected) {
            const ethBalance = Web3.utils.fromWei(await window.web3.eth.getBalance(address), 'ether')
            const vethBalance = Web3.utils.fromWei(await contract.methods.balanceOf(address).call(), 'ether')
            setAccount({
                address: address,
                vethBalance: vethBalance,
                ethBalance: ethBalance
            })
            context.setContext({
                "accountData": {
                    'address': address,
                    'vethBalance': vethBalance,
                    'ethBalance': ethBalance
                }
            })
        }
    }

	const loadPoolData = async () => {
		const web3_ = new Web3(new Web3.providers.HttpProvider(infuraAPI()))
		const poolContract = new web3_.eth.Contract(vetherPools2Abi(), vetherPools2Addr())
		let poolData = await poolContract.methods.poolData(ETH).call()
		let price = await poolContract.methods.calcValueInAsset(BN2Str(oneBN), ETH).call()
		let roi = await poolContract.methods.getPoolROI(ETH).call()
		const poolData_ = {
			"eth": convertFromWei(poolData.asset),
			"veth": convertFromWei(poolData.vether),
			"price": convertFromWei(price),
			"volume": convertFromWei(poolData.volume),
			"fees": convertFromWei(poolData.fees),
			"txCount": poolData.txCount,
			"roi": (+roi / 100) - 100
		}
		console.log(poolData_)
		setPoolData(poolData_)
		context.setContext({
			"poolData": poolData_
		})
	}

    const loadMarketData = async () => {
        const priceEtherUSD = await getETHPrice()
        const priceVetherEth = await getVetherPrice()

        const priceVetherUSD = convertFromWei(priceVetherEth) * priceEtherUSD

        const marketData = {
            priceUSD: priceVetherUSD,
            priceETH: convertFromWei(priceVetherEth),
            ethPrice: priceEtherUSD
        }

        setMarketData(marketData)
        context.setContext({
            "marketData": marketData
        })
    }

    const checkApproval = async (address) => {
        const accountConnected = (await window.web3.eth.getAccounts())[0]
        if(accountConnected){
            const vetherContract = new window.web3.eth.Contract(vetherAbi(), vetherAddr())
            const from = address
            const spender = vetherPools2Addr()
            const approval = await vetherContract.methods.allowance(from, spender).call()
            const vethBalance = await vetherContract.methods.balanceOf(address).call()
            if (+approval >= +vethBalance && +vethBalance >= 0) {
                setApproved(true)
            } else {
                setApproved(false)
            }
        }
    }

    const unlockToken = async () => {
        const accountConnected = (await window.web3.eth.getAccounts())[0]
        if(accountConnected){
            setApproveFlag(true)
            const vetherContract = new window.web3.eth.Contract(vetherAbi(), vetherAddr())
            const from = account.address
            const spender = vetherPools2Addr()
            const value = totalSupply.toString()
            await vetherContract.methods.approve(spender, value)
                .send({
                    from: from
                })
            checkApproval(account.address)
        }
    }

    const onEthAmountChange = e => {
        loadPoolData()
        const value = e.target.value
        let valueInVeth = BN2Str(calcSwapOutput(convertToWei(value), convertToWei(poolData.eth), convertToWei(poolData.veth)))
        valueInVeth = valueInVeth === Infinity || isNaN(valueInVeth) ? 0 : convertFromWei(valueInVeth)
        setEthAmount(value.toString())
        setVethAmount("")
        setVethAmountCalculated((+valueInVeth).toFixed(2))
        calcTrade(value, valueInVeth)
    }

    const onVethAmountChange = e => {
        loadPoolData()
        const value = e.target.value
        let valueInEth = BN2Str(calcSwapOutput(convertToWei(value), convertToWei(poolData.veth), convertToWei(poolData.eth)))
        valueInEth = +valueInEth === Infinity || isNaN(+valueInEth) ? 0 : convertFromWei(valueInEth)
        setVethAmount(value.toString())
        setEthAmount("")
        setEthAmountCalculated((+valueInEth).toFixed(5))
        calcTrade(valueInEth, value)
    }

    const calcTrade = (size0, size1) => {
        const marketRate = marketData.priceETH
        const tradeRate = size0/size1 === Infinity || isNaN(size0/size1) ? 0 : size0/size1
        let slippage = tradeRate - marketRate === Infinity || isNaN(tradeRate - marketRate) ? 0 : tradeRate - marketRate
        slippage = slippage < 0 ? slippage * (-1) : slippage
        const slippagePercent = (slippage/marketRate)*(100) < 0 || (slippage/marketRate)*(100) === 100 ? 0 : (slippage/marketRate)*(100)

        let color
        let slippageWarning
        switch(true) {
            case (slippagePercent === 0):
                color = 'inherit'
                break;
            case (slippagePercent <= 1):
                color = '#7cb305'
                break;
            case (slippagePercent < 3):
                color = 'inherit'
                break;
            case (slippagePercent > 5):
                color = '#cf1322'
                slippageWarning = true
                break;
            case (slippagePercent >= 3):
                color = '#fa541c'
                break;
            default:
                color = 'inherit'
        }

        setTrade({
            price: tradeRate,
            slippage: slippage,
            slippagePercent: slippagePercent,
            slippageColor: color,
            slippageWarning: slippageWarning
        })
    }

    const buyVether = async () => {
        setBuyFlag(true)
        setLoadedBuy(false)
        const poolContract = new window.web3.eth.Contract(vetherPools2Abi(), vetherPools2Addr())
		const amountEth = (convertToWei(ethAmount)).toString()
        const tx = await poolContract.methods.swap(amountEth, ETH, vetherAddr())
            .send({
                from: account.address,
                gasPrice: '',
                gas: '',
                value: Web3.utils.toWei(ethAmount, 'ether')
            })
        setEthTx(tx.transactionHash)
        loadAccountData(vetherContract, account.address)
        setLoadedBuy(true)
    }

    const sellVether = async () => {
        setLoadedSell(false)
        setSellFlag(true)
        const poolContract = new window.web3.eth.Contract(vetherPools2Abi(), vetherPools2Addr())
        const amountVeth = (convertToWei(vethAmount)).toString()
        const tx = await poolContract.methods.swap(amountVeth, vetherAddr(), ETH)
            .send({
                from: account.address,
                gasPrice: '',
                gas: '240085',
                value: ''
            })
        setVethTx(tx.transactionHash)
        loadAccountData(vetherContract, account.address)
        setLoadedSell(true)
    }

    const getLink = (tx) => {
        return getEtherscanURL().concat('tx/').concat(tx)
    }

    return (
        <>
            <Row type="flex" justify="center">
                <Col lg={12} xs={24}>
                    <Label display="block" style={{ marginBottom: '1.33rem' }}>Actual Price</Label>
                    <div style={{ textAlign: 'center' }}><span style={{ fontSize: 30 }}>{currency(marketData.priceUSD)}</span>
                        <Tooltip placement="right" title="Current market rate">
                            &nbsp;<QuestionCircleOutlined style={{ color: Colour().grey, margin: 0 }} />
                        </Tooltip>
                    </div>
                    <LabelGrey style={{ display: 'block', marginBottom: 0, textAlign: 'center' }}>{currency(marketData.priceETH, 0, 6, inCurrency)}</LabelGrey>
                </Col>
            </Row>
            <Row type="flex" justify="center">
                <Col lg={12} xs={24}>
                    <Row type="flex" justify="center" align="middle">
                        <Col span={10}>
                            <Label display="block" style={{marginBottom: '0.55rem'}}>Buy</Label>
                            <Input size={'large'} style={{marginBottom: "1.3rem"}} onChange={onEthAmountChange} value={ethAmount}
                                   placeholder={ethAmountCalculated} suffix="ETH Ξ"/>
                            { connected && ethAmount > 0
                                ? <Button backgroundColor="transparent" onClick={buyVether}>BUY VETH >></Button>
                                : <Button backgroundColor="transparent" disabled>BUY VETH >></Button>
                            }
                            <Sublabel>BUY VETHER WITH ETH</Sublabel>
                        </Col>

                        <Col span={4} style={{textAlign: 'center'}}>
                            <SwapOutlined style={{fontSize: '19px'}}/>
                        </Col>

                        <Col span={10} style={{textAlign: "right"}}>
                            <Row>
                                <Col xs={24}>
                                    <Label display="block" style={{marginBottom: '0.55rem'}}>Sell</Label>
                                    <Input size={'large'} style={{marginBottom: '1.3rem'}} onChange={onVethAmountChange} value={vethAmount}
                                           placeholder={vethAmountCalculated} suffix="$VETH"/>
                                    { connected && approved && vethAmount > 0
                                        ? <Button backgroundColor="transparent" onClick={sellVether}>SELL&nbsp;VETH&nbsp;>></Button>
                                        : <Button backgroundColor="transparent" disabled>SELL&nbsp;VETH&nbsp;>></Button>
                                    }

                                    { connected && !approved && !approveFlag &&
                                        <>
                                            <Button backgroundColor="transparent" onClick={unlockToken}>APPROVE VETHER >></Button>
                                            <Sublabel>ALLOW VETHER FOR TRADES</Sublabel>
                                        </>
                                    }

                                    {connected && !approved && !approveFlag
                                        ? <Sublabel>ALLOW VETHER FOR TRADES</Sublabel>
                                        : <Sublabel>SELL VETHER FOR ETH</Sublabel>
                                    }

                                    {connected && approveFlag &&
                                        <>
                                            <LoadingOutlined />
                                        </>
                                    }
                                </Col>
                            </Row>
                        </Col>
                    </Row>
                    <Row type="flex" justify="center" align="middle" style={{ marginBottom: '1.33rem' }}>
                        <Col span={12}>
                            <Row>
                                <Col span={12}>
                                        Trade Price&nbsp;<Tooltip placement="right" title="The price you will get when the trade gets executed.">
                                            <QuestionCircleOutlined style={{ color: Colour().grey, margin: 0 }} />
                                        </Tooltip>
                                </Col>
                                <Col span={12} style={{ textAlign: 'right' }}>
                                    {currency(trade.price, 0, 6, inCurrency)}
                                </Col>
                                <Col span={12}>
                                    Slippage&nbsp;<Tooltip placement="right" title="The difference between market price and trade price due to order size.">
                                        <QuestionCircleOutlined style={{ color: Colour().grey, margin: 0 }} />
                                    </Tooltip>
                                </Col>
                                <Col span={12} style={{ textAlign: 'right', color: trade.slippageColor }}>
                                    {trade.slippagePercent.toFixed(2)}%
                                </Col>
                            </Row>
                        </Col>
                    </Row>
                    { trade.slippageWarning &&
                        <>
                            <LabelGrey display={'block'} style={{ fontStyle: 'italic' }}>
                                <ExclamationCircleOutlined style={{ marginBottom: '0' }}/>&nbsp;Due to trade size your price's affected by high slippage.
                            </LabelGrey>
                        </>
                    }
                </Col>
            </Row>

            { buyFlag &&
                <>
                    <Row type="flex" justify="center" >
                        <Col span={12} style={{ textAlign: 'left' }}>
                            {loadedBuy &&
                            <>
                                <a href={getLink(ethTx)} rel="noopener noreferrer" title="Transaction Link"
                                   target="_blank">VIEW TRANSACTION -></a>
                            </>
                            }
                        </Col>
                    </Row>
                </>
            }

            { sellFlag &&
                <>
                    <Row type="flex" justify="center" >
                        <Col span={12} style={{ textAlign: 'right' }}>
                            {loadedSell &&
                            <>
                                <a href={getLink(vethTx)} rel="noopener noreferrer" title="Transaction Link"
                                   target="_blank">VIEW TRANSACTION -></a>
                            </>
                            }
                        </Col>
                    </Row>
                </>
            }
        </>
    )
}