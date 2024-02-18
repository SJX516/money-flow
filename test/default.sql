CREATE TABLE `income_expenditure_detail` (
 `id` INTEGER NOT NULL ,
 `gmt_create` datetime NOT NULL  ,
 `gmt_modified` datetime NOT NULL  ,
 `type` int NOT NULL  ,
 `desc` varchar(64) NULL  ,
 `money` INTEGER NOT NULL  ,
 `happen_time` datetime NOT NULL  ,
 PRIMARY KEY (`id` AUTOINCREMENT)
);

CREATE TABLE `investment_detail` (
 `id` INTEGER NOT NULL  ,
 `gmt_create` datetime NOT NULL  ,
 `gmt_modified` datetime NOT NULL  ,
 `product_id` INTEGER NOT NULL  ,
 `product_name` varchar(64) NOT NULL  ,
 `product_type` INTEGER NOT NULL  ,
 `money` INTEGER NOT NULL,
 `happen_time` datetime NOT NULL  ,
 `buy_sell_id` INTEGER,
 `record_type` int NOT NULL ,
 `count` INTEGER,
 PRIMARY KEY (`id` AUTOINCREMENT)
);


CREATE TABLE `investment_product` (
 `id` INTEGER NOT NULL  ,
 `gmt_create` datetime NOT NULL  ,
 `gmt_modified` datetime NOT NULL  ,
 `name` varchar(64) NOT NULL  ,
 `type` int NOT NULL  ,
 `desc` varchar(64) NULL  ,
 PRIMARY KEY (`id` AUTOINCREMENT)
);


CREATE TABLE `data_summary` (
 `id` INTEGER NOT NULL  ,
 `gmt_create` datetime NOT NULL  ,
 `gmt_modified` datetime NOT NULL  ,
 `type` varchar(64) NOT NULL ,
 `time` datetime NOT NULL  ,
 `money` INTEGER,
 PRIMARY KEY (`id` AUTOINCREMENT)
);

// version, 1
CREATE TABLE `db_config` (
 `id` INTEGER NOT NULL UNIQUE,
 `gmt_create` datetime NOT NULL  ,
 `gmt_modified` datetime NOT NULL  ,
 `type` varchar(64) NOT NULL ,
 `value` varchar(64) NOT NULL ,
 PRIMARY KEY (`id` AUTOINCREMENT)
);

// type: 1 - account / 2 - ExpenditureType / 3 - IncomeType
// type, code, name, parent_code
// 1, 1, 账户1
// 2, 1, 支出aa, null
// 2, 2, 支出aa-1, 1
// 3, 1, 收入aa, null
CREATE TABLE `app_config` (
 `id` INTEGER NOT NULL UNIQUE,
 `gmt_create` datetime NOT NULL  ,
 `gmt_modified` datetime NOT NULL  ,
 `type` INTEGER NOT NULL ,
 `code` INTEGER NOT NULL ,
 `name` varchar(64) NOT NULL ,
 `parent_code` INTEGER ,
 PRIMARY KEY (`id` AUTOINCREMENT)
);

