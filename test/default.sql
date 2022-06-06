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

INSERT INTO investment_product (gmt_create, gmt_modified, name, type) values (1, 2, 3, 4, 5);