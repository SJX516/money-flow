import DBHelper from '../../utils/db';
import { BaseRepo } from './base_repo';
import { IncomeExpenditureDetail, IncomeExpenditureTypes } from '../entity/income_expenditure';
import { App } from '../..';

class IncomeExpenditureRepo extends BaseRepo {

    constructor() {
        super()
        this.tablename = "income_expenditure_detail"
    }

    /**
      * @param {IncomeExpenditureDetail} detail 
      */
    upsert(detail) {
        if (detail.id == null) {
            App.db.insert(this.tablename, [null, detail.gmtCreate, detail.gmtModified,
                 detail.type, detail.desc, detail.money, detail.happenTime])
        } else {
            App.db.update(this.tablename, detail.id, ['gmt_create', 'gmt_modified', 
            'type', 'desc', 'money', 'happen_time'], [detail.gmtCreate, detail.gmtModified,
                detail.type, detail.desc, detail.money, detail.happenTime])
        }
    }
}

export default IncomeExpenditureRepo