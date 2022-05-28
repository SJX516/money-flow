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
     * @param {InvestmentProduct} product 
     */
    static deleteProduct(product) {
        InvestmentProduct.delete(product.id)
    }

    static getProductInvestsBefore(productId, endTime) {
        return InvestmentDetail.queryTimeBetwen(productId, InvestmentRecordType.BuySell, null, endTime)
    }

    static addInvestProfit(productId, productName, money, happenTime) {
        var id = this._upsertInvest(productId, productName, money, happenTime, InvestmentRecordType.Profit)
        console.log(id)
    }

    static addBuyInvest(productId, productName, money, currentPrice, happenTime) {
        var id = this._upsertInvest(productId, productName, money, happenTime, InvestmentRecordType.BuySell)
        this._upsertInvest(productId, productName, currentPrice, happenTime, InvestmentRecordType.CurrentPrice, id)
    }

    static addSellInvest(productId, productName, sellGetMoney, currentPrice, currentProfit, happenTime) {
        let totalInvestMoney = 0
        // 添加1秒，避免同一天添加的买入查不出来
        this.getProductInvestsBefore(productId, new Date(happenTime.getTime() + 1000)).forEach(buySell => {
            totalInvestMoney += buySell.money
        })
        // 所得为正数，表示花费的本金
        let principal = totalInvestMoney + currentProfit - currentPrice 
        let profit = sellGetMoney - principal
        console.log(`totalInvestMoney: ${totalInvestMoney} currentProfit: ${currentProfit} currentPrice: ${currentPrice}        principal: ${principal} sellGetMoney: ${sellGetMoney} profit: ${profit}`)
        // 卖出本金，需要转为负数
        var id = this._upsertInvest(productId, productName, -1 * principal, happenTime, InvestmentRecordType.BuySell)
        this._upsertInvest(productId, productName, currentPrice, happenTime, InvestmentRecordType.CurrentPrice, id)
        this._upsertInvest(productId, productName, profit, happenTime, InvestmentRecordType.Profit, id)
    }

    static deleteInvestDetail(detail) {
        detail.delete()
    }

    static _upsertInvest(productId, productName, money, happenTime, recordType, buySellId=null, id=null) {
        var detail = new InvestmentDetail()
        detail.id = id
        detail.productId = productId
        detail.productName = productName
        detail.money = money
        detail.happenTime = happenTime
        detail.buySellId = buySellId
        detail.recordType = recordType
        return detail.save()
    }
}

export default InvestmentService