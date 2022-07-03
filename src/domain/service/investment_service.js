import { DataUtil } from "../../utils/utils";
import { InvestmentDetail, InvestmentProduct, InvestmentRecordType, InvestmentType } from "../entity/investment";

class InvestmentService {

    static getProductTypes() {
        return InvestmentType.toList(InvestmentType.Product)
    }

    static upsertProduct(typeCode, name, desc = null, id = null) {
        var entity = new InvestmentProduct()
        entity.id = id
        entity.type = InvestmentType.getByCode(typeCode)
        entity.desc = desc
        entity.name = name
        entity.save()
    }

    static queryProducts() {
        return InvestmentProduct.queryAll()
    }

    /**
     * 
     * @param {InvestmentProduct} detail 
     * @param {String} desc 
     * @param {Number} fixVote 
     */
    static editProduct(detail, desc, fixVote) {
        detail.fixVote = fixVote
        detail.desc = desc
        detail.save()
    }

    /**
     * 
     * @param {InvestmentProduct} product 
     */
    static deleteProduct(product) {
        InvestmentProduct.delete(product.id)
    }

    static getAllInvestDetailBefore(endTime) {
        var details = InvestmentDetail.queryTimeBetwen(null, null, null, endTime)
        let investMap = {
            invest: {},
            stock: {},
            asset: {},
            debt: {}
        }
        details.forEach(detail => {
            this.dealDetail(detail, investMap)
        })
        return investMap
    }

    /**
     * 
     * @param {InvestmentDetail} detail 
     * @param {{}} investMap 
     * 
     *  investMap = {
            invest: {
                "1": {
                    "currentPrice": InvestmentDetail,
                    "buySells": {
                        "totalMoney": 100000
                        "datas": [InvestmentDetail]
                    },
                    "profits": {
                        "totalMoney": 2000
                        "datas": [InvestmentDetail]
                    }
                }
            },
            stock: {
                "11": {

                }
            }
            asset: {                
                "2": {
                    "currentPrice": InvestmentDetail,
                    "profits": {
                        "totalMoney": 2000
                        "datas": [InvestmentDetail]
                    }
                }

            },
            debt: {                
                "3": {
                    "currentPrice": InvestmentDetail,
                    "profits": {
                        "totalMoney": 2000
                        "datas": [InvestmentDetail]
                    }
                }
            }
        }
     */
    static dealDetail(detail, investMap) {
        var currentProductMap = null
        if (detail.productType.isAsset()) {
            currentProductMap = investMap.asset
        } else if (detail.productType.isDebt()) {
            currentProductMap = investMap.debt
        } else if (detail.productType.isStock()) {
            currentProductMap = investMap.stock
        } else {
            currentProductMap = investMap.invest
        }
        if (DataUtil.isNull(currentProductMap[detail.productId])) {
            currentProductMap[detail.productId] = {}
        }
        currentProductMap = currentProductMap[detail.productId]
        currentProductMap.info = detail

        // 保存现价
        if (detail.recordType == InvestmentRecordType.CurrentPrice || detail.recordType == InvestmentRecordType.AssetDebtCurrentPrice) {
            if(currentProductMap.currentPrice === undefined) {
                currentProductMap.currentPrice = detail
            }
        } else if (detail.recordType == InvestmentRecordType.Profit || detail.recordType == InvestmentRecordType.AssetDebtProfit) {
            if (DataUtil.isNull(currentProductMap.profits)) {
                currentProductMap.profits = {
                    totalMoney: 0,
                    datas: [],
                }
            }
            currentProductMap.profits.totalMoney += detail.money
            currentProductMap.profits.datas.push(detail)
        } else if (detail.recordType == InvestmentRecordType.BuySell) {
            if (DataUtil.isNull(currentProductMap.buySells)) {
                currentProductMap.buySells = {
                    totalMoney: 0,
                    totalSellMoney: 0,
                    totalCount: 0,
                    datas: [],
                }
            }
            if(!DataUtil.notNumber(detail.count)) {
                currentProductMap.buySells.totalCount += detail.count
            }
            currentProductMap.buySells.totalMoney += detail.money
            if(detail.money < 0) {
                currentProductMap.buySells.totalSellMoney += detail.money
            }
            currentProductMap.buySells.datas.push(detail)
        }
        return investMap
    }

    static getProductTotalBuySellBefore(productId, endTime) {
        return InvestmentDetail.queryTimeBetwen(productId, InvestmentRecordType.BuySell, null, endTime)
    }

    static addAssetDebtProfit(productId, productName, productTypeCode, money, currentPrice, happenTime) {
        if (!DataUtil.notNumber(money) && money != 0) {
            this._upsertInvest(productId, productName, productTypeCode, money, happenTime,
                InvestmentRecordType.AssetDebtProfit)
        }
        this._upsertInvest(productId, productName, productTypeCode, currentPrice, happenTime,
            InvestmentRecordType.AssetDebtCurrentPrice)
    }

    static addBuyInvest(productId, productName, productTypeCode, count, money, currentPrice, happenTime) {
        var id = this._upsertInvest(productId, productName, productTypeCode, money, happenTime,
            InvestmentRecordType.BuySell, count)
        this._upsertInvest(productId, productName, productTypeCode, currentPrice, happenTime,
            InvestmentRecordType.CurrentPrice, null, id)
    }

    static addSellInvest(productId, productName, productTypeCode, count, sellGetMoney, currentPrice, currentProfit, happenTime) {
        let totalInvestMoney = 0
        // 添加1秒，避免同一天添加的买入查不出来
        this.getProductTotalBuySellBefore(productId, new Date(happenTime.getTime() + 1000)).forEach(buySell => {
            totalInvestMoney += buySell.money
        })
        // 所得为正数，卖出的本金 = 总投资金额 - 当前投资金额
        let principal = totalInvestMoney - (currentPrice - currentProfit)
        let sellProfit = sellGetMoney - principal
        console.log(`totalInvestMoney: ${totalInvestMoney} currentProfit: ${currentProfit} currentPrice: ${currentPrice} principal: ${principal} sellGetMoney: ${sellGetMoney} sellProfit: ${sellProfit}`)
        this.addSellInvestOfProfit(productId, productName, productTypeCode, count, sellGetMoney, sellProfit, currentPrice, happenTime)
    }

    static addSellInvestOfProfit(productId, productName, productTypeCode, count, sellGetMoney, sellProfit, currentPrice, happenTime) {
        // 所得为正数，表示花费的本金
        let principal = sellGetMoney - sellProfit
        if(!DataUtil.notNumber(count)) {
            count = -1 * count
        }
        // 卖出本金，需要转为负数
        var id = this._upsertInvest(productId, productName, productTypeCode, -1 * principal, happenTime,
            InvestmentRecordType.BuySell, count)
        if(currentPrice >= 0) {
            this._upsertInvest(productId, productName, productTypeCode, currentPrice, happenTime,
                InvestmentRecordType.CurrentPrice, null, id)
        }
        this._upsertInvest(productId, productName, productTypeCode, sellProfit, happenTime, InvestmentRecordType.Profit, null, id)
    }

    /**
     * @param {InvestmentDetail} detail 
     */
    static deleteInvestDetail(detail) {
        detail.delete()
    }

    static _upsertInvest(productId, productName, productTypeCode, money, happenTime, recordType,
        count = null, buySellId = null, id = null) {
        var detail = new InvestmentDetail()
        detail.id = id
        detail.productId = productId
        detail.productName = productName
        detail.productType = InvestmentType.getByCode(productTypeCode)
        detail.money = money
        detail.count = count
        detail.happenTime = happenTime
        detail.buySellId = buySellId
        detail.recordType = recordType
        return detail.save()
    }
}

export default InvestmentService