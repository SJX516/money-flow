import { App } from "../app";
import { IncomeExpenditureType } from "../domain/entity/income_expenditure";
import { UserConfigStatus, UserConfigType } from "../domain/entity/user_entity";
import { IncomeExpenditureService } from "../domain/service/income_expenditure_service";
import { UserService } from "../domain/service/user_service";
import { IncomeExpenditureVMService } from "../domain/service/view_model_service";
import DBHelper from "../utils/db";
import { DataUtil, LogUtil } from "../utils/utils";


describe("checkDbUpdate", () => {
  console.log(App.getVersion());

  test('v0 db has no config', async () => {
    let db = new DBHelper();
    await db.createV0Db();
    expect(DataUtil.isNull(db.getDbConfig()["db_version"])).toBe(true);
  });

  test('dbUpate', async () => {
    await App.createDb();
    let config = App.db.getDbConfig();
    expect(config["db_version"]).toBe("1");
    expect(UserService.getAll(UserConfigType.IncomeType).length).toBe(7);
    expect(UserService.getAll(UserConfigType.ExpenditureType).length).toBe(30);
    expect(IncomeExpenditureService.getIncomeTypes().length).toBe(7);
    expect(IncomeExpenditureService.getExpenditureTypes().length).toBe(30);
    expect(IncomeExpenditureService.getIncomeExpendTypeByCode(10000).name).toBe("薪水");
    expect(IncomeExpenditureService.getIncomeExpendTypeByCode(-20000).name).toBe("日常");
    expect(IncomeExpenditureService.getIncomeExpendGroupByCode(20001).name).toBe("红包");
    expect(IncomeExpenditureService.getIncomeExpendGroupByCode(-70001).name).toBe("学习");

    let incomeTrees = IncomeExpenditureVMService.getTypeTrees(UserConfigType.IncomeType)
    let expendTrees = IncomeExpenditureVMService.getTypeTrees(UserConfigType.ExpenditureType)
    expect(incomeTrees.length).toBe(3);
    expect(incomeTrees[0]['childs'].length).toBe(2);
    expect(expendTrees.length).toBe(11);
    expect(expendTrees[0]['childs'].length).toBe(2);

    let hbType = IncomeExpenditureService.getIncomeExpendGroupByCode(20001)
    IncomeExpenditureService.updateType(hbType, "红包AA", null, UserConfigStatus.Normal);
    expect(IncomeExpenditureService.getIncomeExpendGroupByCode(20002).name).toBe("红包AA");

    IncomeExpenditureService.addType(UserConfigType.IncomeType, "收入A", null, UserConfigStatus.Normal);
    let incomeTypes = IncomeExpenditureService.getIncomeTypes();
    expect(incomeTypes.length).toBe(8);
  });

});