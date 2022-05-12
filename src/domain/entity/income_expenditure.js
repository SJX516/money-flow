import IncomeExpenditureRepo from '../repo/income_expenditure_repo';

class IncomeExpenditureDetail {
    id = null;
    gmtCreate = null;
    gmtModified = null;
    type = null;
    desc = null;
    money = null;
    happenTime = null;

    static repo = new IncomeExpenditureRepo()

    static load(id) {
        this.repo.get(id)
    }

    save() {
        if(this.gmtCreate == null) {
            this.gmtCreate = new Date().timeStr()
        }
        this.gmtModified = new Date().timeStr()
        IncomeExpenditureDetail.repo.upsert(this)
    }

}


class IncomeExpenditureTypes {
    static Income_salary = 10000;
    static Expenditure_home = 50000;
}

export {IncomeExpenditureDetail, IncomeExpenditureTypes}
