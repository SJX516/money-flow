import React from "react";
import { IncomeExpenditureType } from "../../../domain/entity/income_expenditure";
import { UserConfigType } from "../../../domain/entity/user_entity";
import { IncomeExpenditureService } from "../../../domain/service/income_expenditure_service";
import { IncomeExpenditureVMService } from "../../../domain/service/view_model_service";
import { CusDialog } from "./cus_dialog";

function typeTreeCode(type) {
    return type ? `${type.code}___${type.name}` : null
}

function typeTreeData(configType) {
    return IncomeExpenditureVMService.getTypeTrees(configType, false).map(group => ({
        title: group.entity.name,
        value: typeTreeCode(group.entity),
        children: group.childs.map(child => ({
            title: child.entity.name,
            value: typeTreeCode(child.entity)
        }))
    }))
}

function IncomeExpenditureEditDialog({ detail, onSaved, onCancel }) {
    const type = detail ? IncomeExpenditureType.getByCode(detail.typeCode) : null
    const configType = type?.isIncome() ? UserConfigType.IncomeType : UserConfigType.ExpenditureType
    return <CusDialog
        title="修改收入/支出"
        visible={detail != null}
        key={detail?.id}
        cfgs={[{
            name: "treeType",
            required: true,
            treeData: typeTreeData(configType),
            defaultValue: typeTreeCode(type)
        }, {
            name: "desc",
            type: "input",
            required: false,
            defaultValue: detail?.desc
        }]}
        extra={detail}
        onOk={values => {
            const typeCode = parseInt(values.treeType.split("___")[0])
            IncomeExpenditureService.upsert(
                detail.rawMoney,
                IncomeExpenditureType.getByCode(typeCode),
                detail.happenTime,
                values.desc ?? "",
                detail.id
            )
            onSaved()
            return true
        }}
        onCancel={onCancel}
    />
}

export default IncomeExpenditureEditDialog
