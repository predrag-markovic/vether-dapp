require('dotenv').config({path: '../.env' })
const ethers = require('ethers');
const vether = require('./vether.js')
const BigNumber = require('bignumber.js')

function BN2Int(BN){return(((new BigNumber(BN)).toFixed()/10**18).toFixed(2))}

const main = async () => {

    const provider = ethers.getDefaultProvider();
    const contract = new ethers.Contract(vether.addr(), vether.abi(), provider)
    
    const currentEra = await contract.currentEra()
    const currentDay = await contract.currentDay()
    const daysPerEra = await contract.daysPerEra()
    for (var i = 1; i <= currentEra; i++) {
        for (var j = 1; j <= daysPerEra; j++) {
            const burntForDay = BN2Int(await contract.mapEraDay_Units(i, j))
            const unclaimedUnits = BN2Int(await contract.mapEraDay_UnitsRemaining(i, j))
            const emissionForDay = BN2Int(await contract.mapEraDay_Emission(i, j))
            const unclaimedEmission = BN2Int(await contract.mapEraDay_EmissionRemaining(i, j))
            const claimRate = (((burntForDay - unclaimedUnits) / burntForDay)*100).toFixed(2)
            console.log("Era-%s, Day-%s, Burnt-%s, Unclaimed-%s, ClaimRate-%s%, Emission-%s, VetherLeft-%s", i, j, 
            burntForDay, unclaimedUnits, claimRate, emissionForDay, unclaimedEmission)
        }
    }
}

main()