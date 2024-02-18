import { App } from '../../app';
import { UserConfig, UserConfigStatus, UserConfigType } from '../entity/user_entity';
import { BaseRepo } from './base_repo';

class UserRepo extends BaseRepo {
    constructor() {
        super()
        this.tablename = "user_config"
    }

    /**
      * @param {UserConfig} entity 
      */
    upsert(entity) {
        let gmtCreate = BaseRepo.getDateStr(entity.gmtCreate, true);
        let gmtModified = BaseRepo.getDateStr(new Date());
        if (entity.id == null) {
            App.db?.insert(this.tablename, ['gmt_create', 'gmt_modified', 'type', 'status', 'code', 'name', 'parent_code'], [gmtCreate, gmtModified,
                entity.type.code, entity.status.code, entity.code, entity.name, entity.parent_code]);
        } else {
            App.db?.update(this.tablename, entity.id, ['gmt_create', 'gmt_modified', 'type', 'status', 'code', 'name', 'parent_code'], [gmtCreate, gmtModified,
                entity.type.code, entity.status.code, entity.code, entity.name, entity.parent_code]);
        }
    }

    /**
     * @param {UserConfigType} type 
     */
    selectType(type) {
        return this.convert(App.db?.select(this.tablename, ['type'], [type.code], ['=']))
    }

    convert(content) {
        let result = []
        if(content === undefined || content[0] === undefined) {
            return result
        }
        for (const data of content[0].values) {
            let detail = new UserConfig()
            detail.id = data[0]
            detail.gmtCreate = new Date(data[1])
            detail.gmtModified = new Date(data[2])
            detail.type = UserConfigType.getByCode(data[3])
            detail.status = UserConfigStatus.getByCode(data[4])
            detail.code = data[5]
            detail.name = data[6]
            detail.parent_code = data[7]
            result.push(detail)
        }
        return result
    }
}

export { UserRepo };
