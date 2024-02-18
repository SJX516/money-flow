import { App } from "../app";
import { IncomeExpenditureType } from "../domain/entity/income_expenditure";
import { InvestmentType } from "../domain/entity/investment";
import { UserConfigType } from "../domain/entity/user_entity";
import { IncomeExpenditureService } from "../domain/service/income_expenditure_service";
import InvestmentService from "../domain/service/investment_service";
import { UserService } from "../domain/service/user_service";
import { IncomeExpenditureVMService, InvestmentVMService } from "../domain/service/view_model_service";
import DBHelper from "../utils/db";
import { DataUtil, LogUtil } from "../utils/utils";

describe('checkCalcuateMoney', () => {

  test("income and expend", async () => {
    await App.createDb();
    let date = new Date();
    IncomeExpenditureService.upsert(1122, IncomeExpenditureType.getByCode(10000), date, "desc")
    IncomeExpenditureService.upsert(2233, IncomeExpenditureType.getByCode(10000), date, "desc")
    IncomeExpenditureService.upsert(-11, IncomeExpenditureType.getByCode(-20000), date, "desc")
    IncomeExpenditureService.upsert(-122, IncomeExpenditureType.getByCode(-20001), date, "desc")
    let data = IncomeExpenditureVMService.queryMonthData(date)
    expect(data['income']['total']).toBe(3355)
    expect(data['income']['details'].length).toBe(2)
    expect(data['expend']['total']).toBe(-133)
    expect(data['expend']['details'].length).toBe(2)

	let yearData = IncomeExpenditureVMService.queryYearData(date)
    expect(yearData['income']['total']).toBe(3355)
    expect(yearData['income']['sumByMonth'].length).toBe(1)
    expect(yearData['expend']['total']).toBe(-133)
    expect(yearData['expend']['sumByMonth'].length).toBe(1)

  });

  test("investment", async () => {
    await App.createDb();
	let productCode = 100
	let productName = "测试产品"
	InvestmentService.addBuyInvest(productCode, productName, InvestmentType.Product.stock.code, 
		100, 2000, 2200, new Date('2023-10'))
    let lastMonthDate = new Date('2023-11')
	InvestmentService.addBuyInvest(productCode, productName, InvestmentType.Product.stock.code, 
		100, 1000, 3100, lastMonthDate)
	let lastMonthData = InvestmentVMService.queryMonthData(lastMonthDate)

	//totalMoneys: [totalCurrentPrice, totalBuySellMoney]
	expect(lastMonthData['stock']['totalMoneys'][0]).toBe(3100)
	expect(lastMonthData['stock']['totalMoneys'][1]).toBe(3000)
	//totalProfitMoneys: [totalProfitMoney, totalFilterProfitMoney]
	expect(lastMonthData['stock']['totalProfitMoneys'][0]).toBe(0)
	expect(lastMonthData['stock']['totalProfitMoneys'][1]).toBe(0)
	//products: 
	// {  
	// 	"1": {
	// 		"currentPrice": InvestmentDetail,
	// 		"buySells": {
	// 			"totalMoney": 100000
	// 			"datas": [InvestmentDetail]
	// 			"filterDatas": [InvestmentDetail]
	// 			"filterMoney": 10000
	// 			"filterSellMoney": 100
	// 			"filterTotalCount": 100
	// 		},
	// 		"profits": {
	// 			"totalMoney": 2000
	// 			"datas": [InvestmentDetail]
	//			"filterDatas": [InvestmentDetail]
	//			"filterTotalMoney": 1000
	// 		}
	// 	}}
	// }
	let lastMonthEntity = lastMonthData['stock']['products'][productCode]
	expect(lastMonthEntity['currentPrice']['money']).toBe(3100)
	expect(lastMonthEntity['buySells']['totalMoney']).toBe(3000)
	expect(lastMonthEntity['buySells']['datas'].length).toBe(2)
	expect(lastMonthEntity['buySells']['filterDatas'].length).toBe(1)
	expect(lastMonthEntity['buySells']['filterMoney']).toBe(1000)
	expect(DataUtil.isNull(lastMonthEntity.profits)).toBe(true)
	expect(InvestmentVMService.getPaperProfit(lastMonthEntity)).toBe(100)

	let date = new Date('2023-12');
	InvestmentService.addSellInvest(productCode, productName, InvestmentType.Product.stock.code, 
		200, 3050, 0, 0, date);
	let monthData = InvestmentVMService.queryMonthData(date)
	let entity = monthData['stock']['products'][productCode]
	expect(entity['currentPrice']['money']).toBe(0)
	expect(entity['buySells']['totalMoney']).toBe(0)
	//当期投资变化额
	expect(entity['buySells']['filterMoney']).toBe(-3000)
	expect(entity['profits']['totalMoney']).toBe(50)
	expect(entity['profits']['filterTotalMoney']).toBe(50)
	//当期账面利润
	let qoqPaperProfit = DataUtil.safeGetNumber(entity.profits?.filterTotalMoney) + 
		InvestmentVMService.getPaperProfit(entity) - InvestmentVMService.getPaperProfit(lastMonthEntity)
	expect(qoqPaperProfit).toBe(-50)

	let nextDate = new Date('2024-01');
	InvestmentService.addBuyInvest(productCode, productName, InvestmentType.Product.stock.code, 
		100, 1000, 1500, nextDate)
	let nextMonthData = InvestmentVMService.queryMonthData(nextDate)
	let nextEntity = nextMonthData['stock']['products'][productCode]
	let nextQoqPaperProfit = DataUtil.safeGetNumber(nextEntity.profits?.filterTotalMoney) + 
		InvestmentVMService.getPaperProfit(nextEntity) - InvestmentVMService.getPaperProfit(entity)
	expect(nextQoqPaperProfit).toBe(500)

  });

});
